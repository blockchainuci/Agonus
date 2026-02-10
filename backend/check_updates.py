import asyncio
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from app.db.database import AsyncSessionLocal
from app.db.models import AgentState
from sqlalchemy import select

async def check_recent_updates():
    """Check if agent states have been updated recently"""
    async with AsyncSessionLocal() as session:
        stmt = select(AgentState).order_by(AgentState.updated_at.desc()).limit(5)
        result = await session.execute(stmt)
        states = result.scalars().all()

        now = datetime.now(timezone.utc)

        print("Most recent agent state updates:")
        print("=" * 60)
        for state in states:
            time_diff = now - state.updated_at
            minutes_ago = time_diff.total_seconds() / 60
            print(f"Agent: {str(state.agent_id)[:8]}...")
            print(f"  Last updated: {state.updated_at}")
            print(f"  Minutes ago: {minutes_ago:.1f}")
            print(f"  Portfolio value: ${state.portfolio_value_usd}")
            print(f"  Trades: {state.trades_count}")
            if state.last_decision:
                print(f"  Last decision: {state.last_decision[:80]}...")
            print()

asyncio.run(check_recent_updates())
