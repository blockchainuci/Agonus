#!/usr/bin/env python3
"""
Seed: "Q4 2025 Championship" — a LIVE mid-game tournament for UI testing.

Creates:
  - 1 live tournament (started 2 days ago, ends in 2 days)
  - Uses same existing DB agents as seed_test_tournament.py (first 4)
  - Mid-game portfolio values with realistic divergence
  - 28 trades over the past 2 days
  - 1 active (unsettled) test bet on the leading agent

Usage:
    cd backend
    python seed_live_tournament.py
"""

import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from uuid import uuid4

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.db.models import Agent, Tournament, AgentState, Trade, Bet, StatusEnum, ActionEnum

# ── Config ────────────────────────────────────────────────────────────────────
YOUR_WALLET = "0x0000000000000000000000000000000000000001"

NOW   = datetime.now(timezone.utc)
START = NOW - timedelta(days=2)          # started 2 days ago
END   = NOW + timedelta(days=2)          # ends in 2 days

# Same fallback agents as the Q1 seed (used if DB has fewer than 4)
FALLBACK_AGENTS = [
    {
        "name": "Alpha Hawk",
        "personality": "aggressive momentum trader focused on high-volatility breakouts",
        "strategy_type": "momentum",
        "stats": {
            "risk_score": 0.85,
            "description": "Aggressive momentum trader that chases breakouts.",
            "config": {
                "temperature": 0.9, "model_name": "gpt-4o-mini",
                "allowed_tokens": ["BTC", "ETH", "SOL", "AVAX"],
                "allowed_tools": ["get_market_price", "execute_trade", "research_token"],
                "max_position_size_pct": 0.30, "min_confidence_threshold": 0.40,
            },
        },
    },
    {
        "name": "Beta Analyst",
        "personality": "conservative fundamentals-driven value investor",
        "strategy_type": "value",
        "stats": {
            "risk_score": 0.35,
            "description": "Patient fundamental analyst.",
            "config": {
                "temperature": 0.4, "model_name": "gpt-4o-mini",
                "allowed_tokens": ["BTC", "ETH"],
                "allowed_tools": ["get_market_price", "execute_trade"],
                "max_position_size_pct": 0.20, "min_confidence_threshold": 0.75,
            },
        },
    },
    {
        "name": "Gamma Quant",
        "personality": "systematic quantitative trader using statistical arbitrage",
        "strategy_type": "quantitative",
        "stats": {
            "risk_score": 0.55,
            "description": "Data-driven systematic trader.",
            "config": {
                "temperature": 0.3, "model_name": "gpt-4o-mini",
                "allowed_tokens": ["BTC", "ETH", "SOL", "LINK"],
                "allowed_tools": ["get_market_price", "execute_trade", "get_technical_indicator"],
                "max_position_size_pct": 0.25, "min_confidence_threshold": 0.60,
            },
        },
    },
    {
        "name": "Delta Fade",
        "personality": "contrarian sentiment trader who fades market euphoria",
        "strategy_type": "contrarian",
        "stats": {
            "risk_score": 0.65,
            "description": "Fades crowded trades and profits from mean reversion.",
            "config": {
                "temperature": 0.7, "model_name": "gpt-4o-mini",
                "allowed_tokens": ["BTC", "ETH", "AVAX", "LINK"],
                "allowed_tools": ["get_market_price", "execute_trade", "get_market_sentiment"],
                "max_position_size_pct": 0.25, "min_confidence_threshold": 0.55,
            },
        },
    },
]

# ── Mid-game prices (recent 2 days, Feb 18–20 2026) ──────────────────────────
# Hour offsets: 0h, 6h, 12h, 18h, 24h, 30h, 36h, 42h (past 2 days)
PRICES = {
    "BTC":  [96200, 97800, 99100, 98400, 101500, 103200, 102600, 104800],
    "ETH":  [3210,  3270,  3340,  3300,  3450,   3520,   3490,   3590],
    "SOL":  [183,   188,   194,   190,   201,    208,    205,    214],
    "AVAX": [38.2,  39.0,  40.1,  39.5,  42.0,   43.5,   42.8,   44.8],
    "LINK": [17.3,  17.6,  17.9,  17.7,  18.6,   19.1,   18.9,   19.5],
}

def price(asset: str, slot: int) -> Decimal:
    return Decimal(str(PRICES[asset][min(slot, 7)]))

def ts(hours_ago: float) -> datetime:
    """Timestamp N hours before now."""
    return NOW - timedelta(hours=hours_ago)


# ── Trade plan: (hours_ago, agent_idx, action, asset, amount, price_slot) ────
# Agent 0 = leading (aggressive, winning)
# Agent 1 = 2nd (conservative, steady gains)
# Agent 2 = 3rd (quant, slightly positive)
# Agent 3 = 4th (contrarian, losing)
TRADE_PLAN = [
    # ── Agent 0 — aggressive momentum, leading ───────────────────────────
    (47, 0, "buy",  "BTC",  0.04, 0),
    (44, 0, "buy",  "ETH",  0.80, 0),
    (40, 0, "buy",  "SOL",  5.0,  1),
    (36, 0, "sell", "ETH",  0.40, 2),
    (34, 0, "buy",  "BTC",  0.03, 2),
    (30, 0, "sell", "SOL",  2.0,  3),
    (28, 0, "buy",  "ETH",  0.90, 3),
    (24, 0, "buy",  "SOL",  4.0,  4),
    (20, 0, "sell", "BTC",  0.03, 5),
    (18, 0, "buy",  "BTC",  0.05, 5),
    (14, 0, "sell", "ETH",  0.50, 6),
    (10, 0, "buy",  "ETH",  1.10, 6),
    ( 6, 0, "sell", "SOL",  6.0,  7),
    ( 3, 0, "buy",  "AVAX", 20.0, 7),
    # ── Agent 1 — conservative, 2nd place ───────────────────────────────
    (46, 1, "buy",  "BTC",  0.03, 0),
    (38, 1, "buy",  "ETH",  1.20, 1),
    (28, 1, "sell", "ETH",  0.50, 3),
    (20, 1, "buy",  "ETH",  0.70, 4),
    (12, 1, "buy",  "BTC",  0.02, 6),
    ( 4, 1, "sell", "ETH",  0.30, 7),
    # ── Agent 2 — quant, 3rd place ───────────────────────────────────────
    (45, 2, "buy",  "BTC",  0.02, 0),
    (39, 2, "buy",  "LINK", 50.0, 1),
    (30, 2, "sell", "LINK", 25.0, 3),
    (22, 2, "buy",  "SOL",  3.0,  4),
    (14, 2, "sell", "BTC",  0.01, 6),
    ( 5, 2, "sell", "SOL",  1.5,  7),
    # ── Agent 3 — contrarian, losing ────────────────────────────────────
    (46, 3, "sell", "BTC",  0.02, 0),  # shorted the rally — bad call
    ( 8, 3, "buy",  "AVAX", 15.0, 6),  # bought late, still down
]

# ── Mid-game portfolio values (out of $1000 start) ───────────────────────────
MID_VALUES = [
    Decimal("2841.65"),   # agent[0] — leading +184%
    Decimal("1734.90"),   # agent[1] — 2nd     +73%
    Decimal("1289.40"),   # agent[2] — 3rd     +29%
    Decimal("672.30"),    # agent[3] — 4th     -33%
]

LAST_DECISIONS = [
    "SOL just broke $214 resistance. Rotated profits into AVAX on momentum — looking very strong.",
    "BTC holding $104k beautifully. Conservative long, keeping 40% cash for any dip opportunities.",
    "Systematic rebalance: trimmed SOL exposure after 17% gain. Watching BTC/LINK ratio signals.",
    "Shorted BTC at $96k but rally continued. Covering short, re-evaluating market structure.",
]

TRADE_COUNTS = [14, 6, 6, 2]
WIN_RATES    = [0.714, 0.667, 0.500, 0.000]
WIN_COUNTS   = [10, 4, 3, 0]
LOSE_COUNTS  = [4,  2, 3, 2]


# ── Main ──────────────────────────────────────────────────────────────────────
async def main():
    async with AsyncSessionLocal() as session:
        # 1. Fetch or create agents
        result = await session.execute(select(Agent))
        existing = list(result.scalars().all())

        if len(existing) >= 4:
            agents = existing[:4]
            print(f"[1/5] Using {len(agents)} existing agents")
        else:
            print(f"[1/5] Only {len(existing)} agents — creating {4 - len(existing)} more")
            agents = list(existing)
            for fa in FALLBACK_AGENTS[len(existing):4]:
                a = Agent(
                    id=uuid4(),
                    name=fa["name"],
                    personality=fa["personality"],
                    strategy_type=fa["strategy_type"],
                    avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={fa['name'].replace(' ','')}",
                    stats=fa["stats"],
                    memory={},
                    created_at=START - timedelta(days=1),
                )
                session.add(a)
                agents.append(a)
            await session.flush()
            for a in agents:
                await session.refresh(a)

        print(f"   Agents: {', '.join(a.name for a in agents)}")

        # 2. Tournament (LIVE)
        print("[2/5] Creating LIVE tournament…")
        agent_mapping = {str(a.id): idx + 1 for idx, a in enumerate(agents)}
        tournament = Tournament(
            id=uuid4(),
            name="Q4 2025 Championship",
            status=StatusEnum.live,
            start_date=START,
            end_date=END,
            prize_pool=Decimal("2500.00"),
            betting_closed=False,
            winner_agent_id=None,           # no winner yet — still live
            contract_tournament_id=None,
            agent_contract_mapping=agent_mapping,
            created_at=START - timedelta(hours=6),
        )
        session.add(tournament)
        await session.flush()
        await session.refresh(tournament)
        print(f"   Tournament ID: {tournament.id}")
        print(f"   Runs: {START.strftime('%b %d %H:%M')} to {END.strftime('%b %d %H:%M')} UTC")

        # 3. Agent states (mid-game)
        print("[3/5] Creating mid-game agent states…")
        for i, agent in enumerate(agents):
            mv = MID_VALUES[i]
            portfolio = {
                "cash": float(mv) * 0.35,
                "holdings": {
                    "BTC":  [0.05, 0.03, 0.01, 0.00][i],
                    "ETH":  [0.60, 0.90, 0.00, 0.00][i],
                    "SOL":  [0.00, 0.00, 1.50, 0.00][i],
                    "AVAX": [20.0, 0.00, 0.00, 15.0][i],
                } if i < 4 else {},
                "holdings_val": float(mv) * 0.65,
                "total_value": float(mv),
                "starting_val": 1000.0,
                "realized_pnl": float(mv) * 0.40,
                "unrealized_pnl": float(mv) * 0.25,
                "roi": (float(mv) - 1000.0) / 1000.0,
                "num_trades": TRADE_COUNTS[i],
                "num_winning_trades": WIN_COUNTS[i],
                "num_losing_trades": LOSE_COUNTS[i],
                "win_rate": WIN_RATES[i],
            }
            state = AgentState(
                agent_id=agent.id,
                tournament_id=tournament.id,
                portfolio=portfolio,
                portfolio_value_usd=mv,
                rank=i + 1,
                trades_count=TRADE_COUNTS[i],
                last_decision=LAST_DECISIONS[i],
                updated_at=NOW - timedelta(minutes=3),
            )
            session.add(state)
            roi_str = f"+{(float(mv)-1000)/10:.1f}%" if mv > 1000 else f"{(float(mv)-1000)/10:.1f}%"
            print(f"   #{i+1} {agent.name}: ${mv:,.2f}  ({roi_str})")

        # 4. Trades
        print(f"[4/5] Inserting {len(TRADE_PLAN)} trades…")
        for (hours_ago, agent_idx, action, asset, amount, pslot) in TRADE_PLAN:
            trade = Trade(
                id=uuid4(),
                agent_id=agents[agent_idx].id,
                tournament_id=tournament.id,
                action=ActionEnum(action),
                asset=asset,
                amount=Decimal(str(amount)),
                price=price(asset, pslot),
                timestamp=ts(hours_ago),
            )
            session.add(trade)

        # 5. Active test bet on the leading agent
        print("[5/5] Creating active test bet…")
        bet = Bet(
            id=uuid4(),
            user_address=YOUR_WALLET,
            agent_id=agents[0].id,
            tournament_id=tournament.id,
            amount=Decimal("0.08"),
            odds=Decimal("1.75"),
            placed_at=START + timedelta(hours=1),
            settled=False,
            payout=None,
        )
        session.add(bet)

        await session.commit()

        print("\n" + "=" * 60)
        print("  DONE — Q4 2025 Championship (LIVE) seeded!")
        print("=" * 60)
        print(f"\n  Tournament ID : {tournament.id}")
        print(f"  Status        : LIVE")
        print(f"  Starts        : {START.strftime('%Y-%m-%d %H:%M UTC')}")
        print(f"  Ends          : {END.strftime('%Y-%m-%d %H:%M UTC')}")
        print(f"\n  Current Leaderboard:")
        for i, a in enumerate(agents):
            roi = (float(MID_VALUES[i]) - 1000.0) / 10.0
            sign = "+" if roi >= 0 else ""
            print(f"    #{i+1}  {a.name:20s}  ${MID_VALUES[i]:>8,.2f}  ({sign}{roi:.1f}%)")
        print(f"\n  Active bet wallet: {YOUR_WALLET}")
        print(f"  Bet on: {agents[0].name} — 0.08 ETH @ 1.75x")
        print(f"\n  To use your real wallet:")
        print(f"    UPDATE bet SET user_address='0xYOUR_ADDRESS'")
        print(f"    WHERE tournament_id='{tournament.id}';")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
