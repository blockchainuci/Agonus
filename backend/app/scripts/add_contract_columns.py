"""
Safely add smart contract columns to the tournament table.

Adds 3 columns without touching existing data:
  - contract_tournament_id (INTEGER, nullable) — links to on-chain tournament
  - agent_contract_mapping (JSONB, default '{}') — maps agent UUIDs to contract IDs
  - betting_closed (BOOLEAN, default false) — whether betting is closed

Uses IF NOT EXISTS so it's safe to run multiple times.
After adding columns, populates mock values for existing tournaments.
"""
import asyncio
import os

from dotenv import load_dotenv
import asyncpg

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
PG_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")


async def migrate():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in environment.")
        return

    conn = await asyncpg.connect(PG_URL, ssl="require")

    try:
        # Step 1: Add columns (safe — IF NOT EXISTS)
        print("Adding contract_tournament_id column...")
        await conn.execute("""
            ALTER TABLE tournament
            ADD COLUMN IF NOT EXISTS contract_tournament_id INTEGER DEFAULT NULL
        """)

        print("Adding agent_contract_mapping column...")
        await conn.execute("""
            ALTER TABLE tournament
            ADD COLUMN IF NOT EXISTS agent_contract_mapping JSONB DEFAULT '{}'::jsonb
        """)

        print("Adding betting_closed column...")
        await conn.execute("""
            ALTER TABLE tournament
            ADD COLUMN IF NOT EXISTS betting_closed BOOLEAN DEFAULT false
        """)

        # Step 2: Add index on contract_tournament_id
        print("Adding index on contract_tournament_id...")
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS ix_tournament_contract_id
            ON tournament(contract_tournament_id)
        """)

        # Step 3: Populate mock values for existing tournaments
        print("\nPopulating mock values for existing tournaments...")
        tournaments = await conn.fetch(
            "SELECT id, name FROM tournament WHERE contract_tournament_id IS NULL"
        )

        for i, t in enumerate(tournaments):
            mock_contract_id = i + 1

            # Get agents in this tournament to build a mock mapping
            agents = await conn.fetch(
                "SELECT agent_id FROM agent_state WHERE tournament_id = $1", t["id"]
            )

            # If no agent_states, try getting all agents as fallback
            if not agents:
                agents = await conn.fetch("SELECT id as agent_id FROM agent")

            mock_mapping = {}
            for j, agent in enumerate(agents):
                mock_mapping[str(agent["agent_id"])] = j + 1

            await conn.execute(
                """
                UPDATE tournament
                SET contract_tournament_id = $1,
                    agent_contract_mapping = $2::jsonb,
                    betting_closed = $3
                WHERE id = $4
                """,
                mock_contract_id,
                str(mock_mapping).replace("'", '"'),
                False,
                t["id"],
            )
            print(f"  {t['name']}: contract_id={mock_contract_id}, {len(mock_mapping)} agents mapped")

        print("\nMigration complete! Verifying...")

        # Step 4: Verify
        rows = await conn.fetch(
            "SELECT name, contract_tournament_id, agent_contract_mapping, betting_closed FROM tournament"
        )
        for row in rows:
            print(f"  {row['name']}: contract_id={row['contract_tournament_id']}, "
                  f"mapping={row['agent_contract_mapping']}, betting_closed={row['betting_closed']}")

    except Exception as e:
        print(f"Migration failed: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(migrate())
