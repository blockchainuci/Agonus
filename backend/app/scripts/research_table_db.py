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

    drop_old_sql = """
    DROP TABLE IF EXISTS agent_research_artifact CASCADE
    """

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS agent_research_artifact (
        crypto_token VARCHAR NOT NULL PRIMARY KEY,
        id SERIAL UNIQUE,
        last_researched_by UUID REFERENCES agent(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        query TEXT NOT NULL,
        recency VARCHAR(10),
        provider VARCHAR(50) DEFAULT 'perplexity',
        summary_markdown TEXT NOT NULL,
        citations JSONB DEFAULT '[]'::jsonb,
        raw_results JSONB,
        related_tokens JSONB,
        agent_opinion VARCHAR(20)
    )
    """

    create_index_sql = """
    CREATE INDEX IF NOT EXISTS ix_research_token_updated
    ON agent_research_artifact(crypto_token, updated_at DESC)
    """

    create_fk_index_sql = """
    CREATE INDEX IF NOT EXISTS ix_research_last_researched_by
    ON agent_research_artifact(last_researched_by)
    """

    async with engine.begin() as conn:
        try:
            print("Dropping old agent_research_artifact table...")
            await conn.execute(text(drop_old_sql))
            print("Creating agent_research_artifact table (shared cache schema)...")
            await conn.execute(text(create_table_sql))
            await conn.execute(text(create_index_sql))
            await conn.execute(text(create_fk_index_sql))
            print("Migration completed successfully!")
        except Exception as e:
            print(f"Migration failed: {e}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())