import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


async def migrate():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in environment.")
        return

    print("Connecting to database...")

    engine = create_async_engine(
        DATABASE_URL,
        echo=True,
        connect_args={"ssl": "require"},
    )

    migration_sql = """
    CREATE TABLE IF NOT EXISTS agent_research_artifact (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES agent(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        query TEXT NOT NULL,
        recency VARCHAR(10),
        provider VARCHAR(50) DEFAULT 'perplexity',
        summary_markdown TEXT NOT NULL,
        citations JSONB DEFAULT '[]'::jsonb,
        raw_results JSONB,
        related_tokens JSONB
    );

    -- Index for fast "recent memory" lookup by agent
    CREATE INDEX IF NOT EXISTS ix_research_agent_created 
    ON agent_research_artifact(agent_id, created_at DESC);
    """

    async with engine.begin() as conn:
        try:
            print("🏗️  Creating agent_research_artifact table...")
            await conn.execute(text(migration_sql))
            print(" Migration completed successfully!")
        except Exception as e:
            print(f" Migration failed: {e}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())