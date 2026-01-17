"""
Test script to manually run a single agent decision and see detailed output.
"""
import asyncio
import os
import logging
from uuid import UUID
from dotenv import load_dotenv

# Set up logging to see everything
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

load_dotenv()

from app.db.database import AsyncSessionLocal
from app.db.models import Agent, Tournament, StatusEnum
from app.agents.executor import TradingAgent
from app.agents.tools.database_tool import DatabaseTool
from sqlalchemy import select

async def test_agent_run():
    """Run a single agent decision manually to see what happens."""

    async with AsyncSessionLocal() as session:
        # Get a live tournament
        stmt = select(Tournament).where(Tournament.status == StatusEnum.live)
        result = await session.execute(stmt)
        tournament = result.scalar_one_or_none()

        if not tournament:
            print("No live tournament found!")
            return

        print(f"\n{'='*60}")
        print(f"Tournament: {tournament.name}")
        print(f"Tournament ID: {tournament.id}")
        print(f"{'='*60}\n")

        # Get first agent
        stmt = select(Agent).limit(1)
        result = await session.execute(stmt)
        agent_model = result.scalar_one_or_none()

        if not agent_model:
            print("No agent found!")
            return

        print(f"Agent: {agent_model.name}")
        print(f"Agent ID: {agent_model.id}")
        print(f"Personality: {agent_model.personality}")
        print(f"\n{'='*60}\n")

        # Create database tool
        db_tool = DatabaseTool(session)

        # Initialize trading agent
        print("Initializing TradingAgent...")
        agent = TradingAgent(
            agent_id=agent_model.name,
            personality=agent_model.personality,
            risk_score=0.5,
            agent_uuid=agent_model.id,
            tournament_uuid=tournament.id,
            database_tool=db_tool,
            recover_from_crash=False,
        )
        print("✓ Agent initialized\n")

        # Check if executor exists
        print(f"Executor type: {type(agent.executor)}")
        print(f"Executor: {agent.executor}\n")

        # Make decision
        print("Making decision...")
        print(f"{'='*60}\n")

        decision_result = agent.make_decision()

        print(f"\n{'='*60}")
        print("DECISION RESULT:")
        print(f"{'='*60}")
        print(decision_result)
        print(f"{'='*60}\n")

        # Save state
        print("Saving state to database...")
        last_decision = decision_result.get("output", "")
        await agent.save_state(last_decision=last_decision)
        print("✓ State saved\n")

        # Show performance
        performance = agent.evaluate_performance()
        print(f"{'='*60}")
        print("PERFORMANCE:")
        print(f"{'='*60}")
        for key, value in performance.items():
            print(f"  {key}: {value}")
        print(f"{'='*60}\n")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("TESTING AGENT EXECUTION")
    print("="*60 + "\n")

    try:
        asyncio.run(test_agent_run())
        print("\n✓ Test completed successfully!\n")
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}\n")
        import traceback
        traceback.print_exc()
