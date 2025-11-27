import asyncio
import os  # <--- 1. Was missing
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine

# 2. SYS PATH HACK: Allows running script directly from anywhere
import sys
from pathlib import Path

# Add the project root (agonus/) to sys.path
sys.path.append(str(Path(__file__).resolve().parents[3]))

# 3. Correct Import: 'Bet', not 'Bets'
from backend.app.db.models import Base, Tournament, Agent, AgentState, Trade, Bet

load_dotenv()

# 4. Correct Method: os.getenv (not get_env)
DATABASE_URL = os.getenv("DATABASE_URL")


async def reset_database():
    if not DATABASE_URL:
        print("❌ Error: DATABASE_URL not found in environment.")
        return

    print("⚡ Connecting to Neon DB...")

    engine = create_async_engine(
        DATABASE_URL,
        echo=True,
        connect_args={"ssl": "require"},
    )

    async with engine.begin() as conn:
        print("🔥 Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)

        print("🏗️  Creating new tables...")
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Database reset successfully!")
    await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(reset_database())
    except Exception as e:
        print(f"❌ Error: {e}")
