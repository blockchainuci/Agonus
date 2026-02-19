"""
One-time migration: Add smart-contract columns to the tournament table.

Run with:  python migrate_add_contract_columns.py
"""

import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Convert SQLAlchemy URL to raw asyncpg URL
# "postgresql+asyncpg://..." → "postgresql://..."
PG_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

STATEMENTS = [
    "ALTER TABLE tournament ADD COLUMN IF NOT EXISTS contract_tournament_id INTEGER;",
    "ALTER TABLE tournament ADD COLUMN IF NOT EXISTS agent_contract_mapping JSONB DEFAULT '{}';",
    "ALTER TABLE tournament ADD COLUMN IF NOT EXISTS betting_closed BOOLEAN DEFAULT FALSE;",
    # Index to match the SQLAlchemy model
    "CREATE INDEX IF NOT EXISTS ix_tournament_contract_tournament_id ON tournament (contract_tournament_id);",
]


async def main():
    print(f"Connecting to database...")
    conn = await asyncpg.connect(PG_URL, ssl="require")
    try:
        for stmt in STATEMENTS:
            print(f"  Running: {stmt}")
            await conn.execute(stmt)
        print("\nMigration complete! All 3 columns added to tournament table.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
