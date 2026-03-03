#!/usr/bin/env python3
"""
Seed script to populate the database with agents and tournaments.

Usage:
    cd backend
    python seed_data.py

This will create:
- 6 AI trading agents with different personalities/strategies
- 1 live tournament with all agents enrolled
"""

import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from uuid import uuid4

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import select, delete
from app.db.database import AsyncSessionLocal
from app.db.models import Agent, Tournament, AgentState, Trade, StatusEnum


# ============================================================================
# AGENT DEFINITIONS
# ============================================================================

# Basic trading tools (conservative agents)
BASIC_TOOLS = [
    "get_market_price",
    "get_portfolio_status",
    "execute_trade",
]

# Standard tools (balanced agents)
STANDARD_TOOLS = [
    "get_market_price",
    "get_market_sentiment",
    "get_technical_indicator",
    "get_portfolio_status",
    "execute_trade",
    "create_plan_step",
    "list_plan_steps",
    "cancel_plan_step",
    "reschedule_plan_step",
]

# Full toolkit (aggressive/research agents)
FULL_TOOLS = STANDARD_TOOLS + ["research_token"]

# Major cap tokens only (conservative)
MAJOR_TOKENS = ["ETH", "BTC", "WETH", "CBBTC"]

# Altcoin focus (momentum/trend)
ALTCOIN_TOKENS = ["SOL", "AVAX", "SUI", "LINK"]

# All tokens (balanced)
ALL_TOKENS = MAJOR_TOKENS + ALTCOIN_TOKENS + ["BNB", "DOGE", "XRP", "TRX", "TBTC"]


AGENTS = [
    {
        "name": "AlphaBot",
        "personality": "aggressive",
        "strategy_type": "momentum",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=alpha",
        "stats": {
            "risk_score": 0.8,
            "description": "High-risk momentum trader. Chases trends aggressively.",
            "config": {
                "temperature": 0.85,
                "model_name": "gpt-4o-mini",
                "allowed_tokens": ["ETH", "SOL", "AVAX", "SUI", "LINK"],
                "allowed_tools": FULL_TOOLS,
                "max_position_size_pct": 0.25,
                "min_confidence_threshold": 0.45,
            },
        },
    },
    {
        "name": "SafeHaven",
        "personality": "conservative",
        "strategy_type": "value",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=safe",
        "stats": {
            "risk_score": 0.2,
            "description": "Conservative value investor. Prioritizes capital preservation.",
            "config": {
                "temperature": 0.2,
                "model_name": "gpt-4o-mini",
                "allowed_tokens": ["ETH", "BTC"],
                "allowed_tools": BASIC_TOOLS,
                "max_position_size_pct": 0.05,
                "min_confidence_threshold": 0.8,
            },
        },
    },
    {
        "name": "SwingKing",
        "personality": "balanced",
        "strategy_type": "swing",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=swing",
        "stats": {
            "risk_score": 0.5,
            "description": "Balanced swing trader. Captures medium-term moves.",
            "config": {
                "temperature": 0.6,
                "model_name": "gpt-4o-mini",
                "allowed_tokens": ALL_TOKENS,
                "allowed_tools": STANDARD_TOOLS,
                "max_position_size_pct": 0.18,
                "min_confidence_threshold": 0.6,
            },
        },
    },
    {
        "name": "TrendRider",
        "personality": "aggressive",
        "strategy_type": "trend_following",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=trend",
        "stats": {
            "risk_score": 0.7,
            "description": "Trend follower. Rides momentum until reversal signals.",
            "config": {
                "temperature": 0.9,
                "model_name": "gpt-4o-mini",
                "allowed_tokens": ["SOL", "AVAX", "SUI", "LINK", "ETH"],
                "allowed_tools": FULL_TOOLS,
                "max_position_size_pct": 0.30,
                "min_confidence_threshold": 0.4,
            },
        },
    },
    {
        "name": "DipBuyer",
        "personality": "contrarian",
        "strategy_type": "mean_reversion",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=dip",
        "stats": {
            "risk_score": 0.6,
            "description": "Contrarian trader. Buys dips and sells rips.",
            "config": {
                "temperature": 0.35,
                "model_name": "gpt-4o-mini",
                "allowed_tokens": ALL_TOKENS,
                "allowed_tools": BASIC_TOOLS,
                "max_position_size_pct": 0.15,
                "min_confidence_threshold": 0.75,
            },
        },
    },
    {
        "name": "SentimentBot",
        "personality": "analytical",
        "strategy_type": "sentiment",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=sentiment",
        "stats": {
            "risk_score": 0.5,
            "description": "Sentiment analyzer. Trades based on market mood.",
            "config": {
                "temperature": 0.7,
                "model_name": "gpt-4o-mini",
                "allowed_tokens": ALL_TOKENS,
                "allowed_tools": FULL_TOOLS,
                "max_position_size_pct": 0.20,
                "min_confidence_threshold": 0.6,
            },
        },
    },
]


# ============================================================================
# SEED FUNCTIONS
# ============================================================================


async def clear_existing_data(session):
    """Clear existing data (optional - for clean slate)."""
    print("\n[1/4] Clearing existing data...")

    # Delete in order due to foreign keys
    await session.execute(delete(Trade))
    await session.execute(delete(AgentState))
    await session.execute(delete(Tournament))
    await session.execute(delete(Agent))
    await session.commit()

    print("  ✓ Cleared all existing data")


async def create_agents(session) -> list:
    """Create all agents and return their UUIDs."""
    print("\n[2/4] Creating agents...")

    agents = []
    for agent_def in AGENTS:
        agent = Agent(
            id=uuid4(),
            name=agent_def["name"],
            personality=agent_def["personality"],
            strategy_type=agent_def["strategy_type"],
            avatar_url=agent_def["avatar_url"],
            stats=agent_def["stats"],
            memory={},
        )
        session.add(agent)
        agents.append(agent)
        print(f"  ✓ Created agent: {agent.name} ({agent.personality})")

    await session.commit()

    # Refresh to get IDs
    for agent in agents:
        await session.refresh(agent)

    return agents


async def create_tournament(session, agents: list) -> Tournament:
    """Create a live tournament with all agents enrolled."""
    print("\n[3/4] Creating tournament...")

    # Tournament runs for 24 hours starting now
    now = datetime.now(timezone.utc)

    # Create agent_contract_mapping (agent_uuid -> contract_id)
    agent_mapping = {str(agent.id): idx + 1 for idx, agent in enumerate(agents)}

    tournament = Tournament(
        id=uuid4(),
        name="Crypto Trading Championship #1",
        status=StatusEnum.live,  # Start as live immediately
        start_date=now,
        end_date=now + timedelta(hours=24),
        prize_pool=Decimal("1000.00"),
        agent_contract_mapping=agent_mapping,
    )
    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)

    print(f"  ✓ Created tournament: {tournament.name}")
    print(f"    Status: {tournament.status.value}")
    print(f"    Start: {tournament.start_date}")
    print(f"    End: {tournament.end_date}")
    print(f"    Prize Pool: ${tournament.prize_pool}")
    print(f"    Agents enrolled: {len(agent_mapping)}")

    return tournament


async def initialize_agent_states(session, tournament: Tournament, agents: list):
    """Create initial AgentState records for each agent in the tournament."""
    print("\n[4/4] Initializing agent states...")

    now = datetime.now(timezone.utc)

    for idx, agent in enumerate(agents):
        # Initial portfolio: $500 cash, no holdings
        initial_portfolio = {
            "cash": 500.0,
            "holdings": {},
            "holdings_val": 0.0,
            "total_value": 500.0,
            "realized_pnl": 0.0,
            "unrealized_pnl": 0.0,
            "roi": 0.0,
            "num_trades": 0,
            "num_winning_trades": 0,
            "num_losing_trades": 0,
            "win_rate": 0.0,
        }

        agent_state = AgentState(
            agent_id=agent.id,
            tournament_id=tournament.id,
            portfolio=initial_portfolio,
            portfolio_value_usd=Decimal("500.00"),
            rank=idx + 1,  # Initial rank by order
            trades_count=0,
            last_decision="Awaiting first decision",
            updated_at=now,
        )
        session.add(agent_state)
        print(f"  ✓ Initialized state for: {agent.name} (rank #{idx + 1})")

    await session.commit()


async def seed_database():
    """Main seeding function."""
    print("\n" + "=" * 60)
    print("  AGONUS DATABASE SEEDER")
    print("=" * 60)

    async with AsyncSessionLocal() as session:
        try:
            # Clear existing data
            await clear_existing_data(session)

            # Create agents
            agents = await create_agents(session)

            # Create tournament
            tournament = await create_tournament(session, agents)

            # Initialize agent states
            await initialize_agent_states(session, tournament, agents)

            print("\n" + "=" * 60)
            print("  SEEDING COMPLETE!")
            print("=" * 60)
            print(f"\n  Created {len(agents)} agents")
            print(f"  Created 1 live tournament")
            print(f"  Tournament ID: {tournament.id}")
            print("\n  The Celery scheduler should now pick up these agents")
            print("  and start running decisions every minute.")
            print("\n" + "=" * 60 + "\n")

            return tournament, agents

        except Exception as e:
            await session.rollback()
            print(f"\n  ERROR: {e}")
            raise


async def show_current_state():
    """Show current database state."""
    print("\n" + "=" * 60)
    print("  CURRENT DATABASE STATE")
    print("=" * 60)

    async with AsyncSessionLocal() as session:
        # Count agents
        result = await session.execute(select(Agent))
        agents = result.scalars().all()
        print(f"\n  Agents: {len(agents)}")
        for agent in agents:
            print(f"    - {agent.name} ({agent.personality})")

        # Count tournaments
        result = await session.execute(select(Tournament))
        tournaments = result.scalars().all()
        print(f"\n  Tournaments: {len(tournaments)}")
        for t in tournaments:
            print(f"    - {t.name} [{t.status.value}]")

            # Get agent states for this tournament
            stmt = select(AgentState).where(AgentState.tournament_id == t.id)
            result = await session.execute(stmt)
            states = result.scalars().all()
            print(f"      Agents enrolled: {len(states)}")
            for state in states:
                # Get agent name
                agent_stmt = select(Agent).where(Agent.id == state.agent_id)
                agent_result = await session.execute(agent_stmt)
                agent = agent_result.scalar_one_or_none()
                agent_name = agent.name if agent else "Unknown"
                print(f"        #{state.rank} {agent_name}: ${state.portfolio_value_usd}")

    print("\n" + "=" * 60 + "\n")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed the Agonus database")
    parser.add_argument("--show", action="store_true", help="Show current state only")
    args = parser.parse_args()

    if args.show:
        asyncio.run(show_current_state())
    else:
        asyncio.run(seed_database())
