import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


import asyncio
from uuid import UUID

from app.db.database import AsyncSessionLocal
from app.agents.executor import TradingAgent
from app.agents.tools.database_tool import DatabaseTool

AGENT_UUID = UUID("c067fa4f-8e85-4981-a9d1-a21895cf2d81")
TOURNAMENT_UUID = UUID("f082eee0-39f8-456d-8520-6d1dd2faec38")

async def run():
    async with AsyncSessionLocal() as session:
        agent = TradingAgent(
            agent_id="Gamma Quant",
            personality="aggressive",
            risk_score=0.7,
            agent_uuid=("c067fa4f-8e85-4981-a9d1-a21895cf2d81"),
            tournament_uuid=("f082eee0-39f8-456d-8520-6d1dd2faec38"),
            database_tool=DatabaseTool(session),
        )
        agent.make_decision()

asyncio.run(run())