import asyncio
import os  # <--- 1. Was missing
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine

# 3. Correct Import: 'Bet', not 'Bets'
from ..db.models import Base, Tournament, Agent, AgentState, Trade, Bet

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
DB_DISABLE_SSL = os.getenv("DB_DISABLE_SSL", "false").lower() == "true"


async def reset_database():
    if not DATABASE_URL:
        print("❌ Error: DATABASE_URL not found in environment.")
        return

    print("⚡ Connecting to database...")

    connect_args = {} if DB_DISABLE_SSL else {"ssl": "require"}

    engine = create_async_engine(
        DATABASE_URL,
        echo=True,
        connect_args=connect_args,
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
