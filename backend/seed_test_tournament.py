#!/usr/bin/env python3
"""
Seed: "Q1 2026 Championship" — a completed tournament for UI/claim testing.

Creates:
  - 1 completed tournament (Jan 6–20, 2026)
  - Uses existing DB agents (or creates 4 new ones if fewer than 4 exist)
  - AgentState with final portfolio values + realistic trade history
  - 44 spread-out trades across the 14-day window
  - 1 test bet on the winning agent (update YOUR_WALLET below)

Usage:
    cd backend
    python seed_test_tournament.py

After running, update the bet's user_address to your wallet so MyBets shows it:
    UPDATE bet SET user_address='0xYOUR_WALLET_HERE'
    WHERE tournament_id='<printed tournament id>';
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
# Set this to your wallet address to test the MyBets / Claim UI.
# You can also update it after running via SQL (see instructions above).
YOUR_WALLET = "0x0000000000000000000000000000000000000001"

# Tournament window (completed)
START = datetime(2026, 1, 6, 0, 0, 0, tzinfo=timezone.utc)
END   = datetime(2026, 1, 20, 23, 59, 59, tzinfo=timezone.utc)

# Fallback agents created if DB has fewer than 4
FALLBACK_AGENTS = [
    {
        "name": "Alpha Hawk",
        "personality": "aggressive momentum trader focused on high-volatility breakouts",
        "strategy_type": "momentum",
        "stats": {
            "risk_score": 0.85,
            "description": "Aggressive momentum trader that chases breakouts aggressively.",
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
            "description": "Patient fundamental analyst. Waits for clear opportunities.",
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
            "description": "Data-driven systematic trader with a statistical edge.",
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

# ── Realistic BTC/ETH/SOL/AVAX prices by day (Jan 6–20, 2026) ───────────────
# Day index 0–14 maps to Jan 6–20
PRICES = {
    "BTC":  [95800, 96400, 98200, 97500, 101000, 103500, 102800, 105000,
             106400, 104200, 108900, 111200, 109800, 112500, 114000],
    "ETH":  [3190,  3230,  3310,  3280,  3420,   3510,   3480,   3580,
             3640,  3560,  3720,  3810,  3750,   3880,   3960],
    "SOL":  [181,   185,   190,   187,   198,    205,    202,    212,
             218,   210,   224,   231,   226,    235,    241],
    "AVAX": [37.8,  38.5,  39.2,  38.8,  41.0,   42.5,   42.0,   44.0,
             45.2,  43.8,  47.0,  48.5,  47.2,   49.8,   51.0],
    "LINK": [17.2,  17.5,  17.8,  17.6,  18.4,   18.9,   18.7,   19.3,
             19.8,  19.2,  20.5,  21.2,  20.8,   21.7,   22.3],
}

def price(asset: str, day: int) -> Decimal:
    return Decimal(str(PRICES[asset][min(day, 14)]))

def ts(day: int, hour: int = 10) -> datetime:
    return START + timedelta(days=day, hours=hour)


# ── Trade plan (day, agent_idx, action, asset, amount, hour) ─────────────────
# Agent 0 = winner (Alpha Hawk / first DB agent)
TRADE_PLAN = [
    # ── Agent 0 — aggressive momentum, wins ──────────────────────────────
    (0,  0, "buy",  "BTC",  0.05,  9),
    (0,  0, "buy",  "ETH",  1.20, 11),
    (1,  0, "buy",  "SOL",  6.0,   9),
    (2,  0, "sell", "ETH",  0.60, 14),
    (2,  0, "buy",  "BTC",  0.03, 16),
    (3,  0, "sell", "SOL",  3.0,  10),
    (3,  0, "buy",  "ETH",  1.0,  13),
    (4,  0, "buy",  "SOL",  4.0,   9),
    (5,  0, "sell", "BTC",  0.04, 11),
    (5,  0, "buy",  "BTC",  0.06, 14),
    (6,  0, "sell", "ETH",  1.0,  10),
    (6,  0, "buy",  "SOL",  3.0,  15),
    (7,  0, "buy",  "ETH",  1.5,   9),
    (8,  0, "sell", "SOL",  7.0,  11),
    (8,  0, "buy",  "BTC",  0.05, 14),
    (9,  0, "buy",  "AVAX", 30.0,  9),
    (10, 0, "sell", "AVAX", 30.0, 10),
    (11, 0, "sell", "ETH",  0.5,  10),
    (11, 0, "buy",  "ETH",  1.0,  14),
    (12, 0, "buy",  "SOL",  4.0,   9),
    (13, 0, "sell", "BTC",  0.08, 11),
    (13, 0, "buy",  "ETH",  0.8,  14),
    (14, 0, "sell", "SOL",  4.0,  10),
    # ── Agent 1 — conservative value, 2nd place ───────────────────────────
    (0,  1, "buy",  "BTC",  0.04,  9),
    (1,  1, "buy",  "ETH",  1.5,  10),
    (3,  1, "sell", "ETH",  0.5,  11),
    (5,  1, "buy",  "ETH",  0.8,  10),
    (7,  1, "buy",  "BTC",  0.03, 11),
    (9,  1, "sell", "BTC",  0.02, 14),
    (10, 1, "buy",  "ETH",  0.6,   9),
    (12, 1, "sell", "ETH",  0.4,  11),
    (14, 1, "buy",  "BTC",  0.02,  9),
    # ── Agent 2 — quant, 3rd place ────────────────────────────────────────
    (0,  2, "buy",  "BTC",  0.03,  9),
    (1,  2, "buy",  "SOL",  5.0,  10),
    (2,  2, "buy",  "LINK", 60.0,  9),
    (4,  2, "sell", "SOL",  3.0,  11),
    (5,  2, "sell", "LINK", 60.0, 14),
    (6,  2, "buy",  "ETH",  0.9,  10),
    (8,  2, "buy",  "BTC",  0.03,  9),
    (10, 2, "sell", "ETH",  0.5,  11),
    (12, 2, "buy",  "SOL",  4.0,  10),
    (14, 2, "sell", "SOL",  2.0,  11),
    # ── Agent 3 — contrarian, last place (bad calls) ──────────────────────
    (0,  3, "sell", "BTC",  0.03,  9),   # shorted the bottom
    (1,  3, "buy",  "AVAX", 35.0, 10),
    (3,  3, "sell", "AVAX", 35.0, 11),   # sold before the pump
    (4,  3, "buy",  "LINK", 50.0,  9),
    (6,  3, "sell", "LINK", 50.0, 14),
    (7,  3, "buy",  "ETH",  0.7,  10),
    (9,  3, "sell", "ETH",  0.7,  11),
    (11, 3, "buy",  "BTC",  0.02,  9),
    (13, 3, "sell", "BTC",  0.01, 14),
]

# Final portfolio values (based on the trade outcomes above)
FINAL_VALUES = [
    Decimal("14823.45"),  # agent[0] WINNER
    Decimal("11204.87"),  # agent[1]
    Decimal("9654.32"),   # agent[2]
    Decimal("6891.19"),   # agent[3]
]

LAST_DECISIONS = [
    "BTC breaking ATH resistance at $114k. Positioned long 25% portfolio. Very high conviction.",
    "ETH holding $3,900 support cleanly. Adding to long position on confirmed bounce signal.",
    "Systematic rebalance: reducing SOL exposure after +18% gain, rotating into BTC for safety.",
    "All momentum metrics still bearish. Moved to 55% cash, awaiting clearer entry signal.",
]

TRADE_COUNTS = [23, 9, 10, 9]
WIN_RATES    = [0.652, 0.556, 0.600, 0.333]
WIN_COUNTS   = [15, 5, 6, 3]
LOSE_COUNTS  = [8,  4, 4, 6]


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
            print(f"[1/5] Only {len(existing)} agents found — creating {4 - len(existing)} more")
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
                    created_at=START - timedelta(days=5),
                )
                session.add(a)
                agents.append(a)
            await session.flush()
            for a in agents:
                await session.refresh(a)

        winner = agents[0]
        print(f"   Winner will be: {winner.name}")

        # 2. Tournament
        print("[2/5] Creating tournament…")
        agent_mapping = {str(a.id): idx + 1 for idx, a in enumerate(agents)}
        tournament = Tournament(
            id=uuid4(),
            name="Q1 2026 Championship",
            status=StatusEnum.completed,
            start_date=START,
            end_date=END,
            prize_pool=Decimal("5000.00"),
            betting_closed=True,
            winner_agent_id=winner.id,
            contract_tournament_id=None,   # set this if you want on-chain claim
            agent_contract_mapping=agent_mapping,
            created_at=START - timedelta(days=3),
        )
        session.add(tournament)
        await session.flush()
        await session.refresh(tournament)
        print(f"   Tournament ID: {tournament.id}")

        # 3. Agent states
        print("[3/5] Creating agent states…")
        for i, agent in enumerate(agents):
            fv = FINAL_VALUES[i]
            portfolio = {
                "cash": float(fv) * 0.28,
                "holdings": {
                    "BTC":  [0.08, 0.06, 0.06, 0.01][i],
                    "ETH":  [0.80, 1.10, 0.40, 0.00][i],
                    "SOL":  [0.00, 0.00, 2.00, 0.00][i],
                } if i < 3 else {},
                "holdings_val": float(fv) * 0.72,
                "total_value": float(fv),
                "starting_val": 10000.0,
                "realized_pnl": float(fv) - 10000.0,
                "unrealized_pnl": 0.0,
                "roi": (float(fv) - 10000.0) / 10000.0,
                "num_trades": TRADE_COUNTS[i],
                "num_winning_trades": WIN_COUNTS[i],
                "num_losing_trades": LOSE_COUNTS[i],
                "win_rate": WIN_RATES[i],
            }
            state = AgentState(
                agent_id=agent.id,
                tournament_id=tournament.id,
                portfolio=portfolio,
                portfolio_value_usd=fv,
                rank=i + 1,
                trades_count=TRADE_COUNTS[i],
                last_decision=LAST_DECISIONS[i],
                updated_at=END,
            )
            session.add(state)
            print(f"   #{i+1} {agent.name}: ${fv:,.2f}")

        # 4. Trades
        print(f"[4/5] Inserting {len(TRADE_PLAN)} trades…")
        for (day, agent_idx, action, asset, amount, hour) in TRADE_PLAN:
            trade = Trade(
                id=uuid4(),
                agent_id=agents[agent_idx].id,
                tournament_id=tournament.id,
                action=ActionEnum(action),
                asset=asset,
                amount=Decimal(str(amount)),
                price=price(asset, day),
                timestamp=ts(day, hour),
            )
            session.add(trade)

        # 5. Test bet — YOUR_WALLET on the winning agent
        print("[5/5] Creating test bet…")
        bet = Bet(
            id=uuid4(),
            user_address=YOUR_WALLET,
            agent_id=winner.id,
            tournament_id=tournament.id,
            amount=Decimal("0.05"),
            odds=Decimal("2.00"),
            placed_at=START + timedelta(hours=3),
            settled=False,
            payout=None,
        )
        session.add(bet)

        await session.commit()

        print("\n" + "=" * 60)
        print("  DONE — Q1 2026 Championship seeded!")
        print("=" * 60)
        print(f"\n  Tournament ID : {tournament.id}")
        print(f"  Winner        : {winner.name} ({winner.id})")
        print(f"\n  Leaderboard:")
        for i, a in enumerate(agents):
            print(f"    #{i+1}  {a.name:20s}  ${FINAL_VALUES[i]:>10,.2f}")
        print(f"\n  Test bet wallet : {YOUR_WALLET}")
        print(f"\n  To link your real wallet, run:")
        print(f"    UPDATE bet SET user_address='0xYOUR_ADDRESS'")
        print(f"    WHERE tournament_id='{tournament.id}';")
        print(f"\n  To test on-chain claim, also set contract_tournament_id:")
        print(f"    UPDATE tournament SET contract_tournament_id=<N>")
        print(f"    WHERE id='{tournament.id}';")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
