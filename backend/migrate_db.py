#!/usr/bin/env python3
"""
Database migration utility for timezone support.

Usage:
    python migrate_db.py --recreate    # Drop all tables and recreate (WARNING: loses all data)
    python migrate_db.py --migrate     # Apply migration to existing database (preserves data)
"""
import asyncio
import argparse
from sqlalchemy import text
from app.db.database import engine
from app.db.models import Base


async def recreate_database():
    """Drop all tables and recreate them with new schema (LOSES ALL DATA!)"""
    print("WARNING: This will delete all data in your database!")
    confirm = input("Type 'yes' to continue: ")
    if confirm.lower() != 'yes':
        print("Aborted.")
        return

    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)

        print("Creating tables with new schema...")
        await conn.run_sync(Base.metadata.create_all)

    print("✓ Database recreated successfully!")


async def migrate_existing_database():
    """Apply migration to existing database (preserves data)"""
    print("Applying timezone migration to existing database...")

    migration_sql = """
    -- Tournament table
    ALTER TABLE tournament
        ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE,
        ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE,
        ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

    -- Agent table
    ALTER TABLE agent
        ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

    -- AgentState table
    ALTER TABLE agent_state
        ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

    -- Trade table
    ALTER TABLE trade
        ALTER COLUMN timestamp TYPE TIMESTAMP WITH TIME ZONE;

    -- Bet table
    ALTER TABLE bet
        ALTER COLUMN placed_at TYPE TIMESTAMP WITH TIME ZONE;
    """

    async with engine.begin() as conn:
        try:
            # Split and execute each ALTER statement
            statements = [s.strip() for s in migration_sql.split(';') if s.strip()]
            for statement in statements:
                await conn.execute(text(statement))
            print("✓ Migration applied successfully!")
        except Exception as e:
            print(f"✗ Migration failed: {e}")
            print("\nNote: If columns already have timezone, this is expected.")
            print("You can safely ignore this error if your database is already up to date.")


async def main():
    parser = argparse.ArgumentParser(description='Database migration utility')
    parser.add_argument('--recreate', action='store_true',
                       help='Drop all tables and recreate (LOSES DATA)')
    parser.add_argument('--migrate', action='store_true',
                       help='Apply migration to existing database (preserves data)')

    args = parser.parse_args()

    if args.recreate:
        await recreate_database()
    elif args.migrate:
        await migrate_existing_database()
    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
