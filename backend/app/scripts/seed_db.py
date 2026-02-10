# backend/app/scripts/seed_db.py
import asyncio
import os
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from ..db.models import Tournament, Agent, Trade, Bet, StatusEnum, ActionEnum

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
DB_DISABLE_SSL = os.getenv("DB_DISABLE_SSL", "false").lower() == "true"


async def seed_database():
    """Seed the database with test data"""

    connect_args = {} if DB_DISABLE_SSL else {"ssl": "require"}
    engine = create_async_engine(DATABASE_URL, connect_args=connect_args)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        now = datetime.now(timezone.utc)

        # Create Tournaments
        tournament1 = Tournament(
            id=uuid4(),
            name="Crypto Trading Championship #1",
            status=StatusEnum.live,
            start_date=now,
            end_date=now + timedelta(days=30),
            prize_pool=Decimal("10000.00"),
            created_at=now,
        )

        tournament2 = Tournament(
            id=uuid4(),
            name="Winter Series",
            status=StatusEnum.upcoming,
            start_date=now + timedelta(days=7),
            end_date=now + timedelta(days=37),
            prize_pool=Decimal("5000.00"),
            created_at=now,
        )

        session.add(tournament1)
        session.add(tournament2)

        # Create Agents
        agent1 = Agent(
            id=uuid4(),
            name="AlphaBot",
            personality="aggressive",
            strategy_type="momentum",
            avatar_url="https://example.com/avatar1.png",
            stats={},
            memory={},
            created_at=now,
        )

        agent2 = Agent(
            id=uuid4(),
            name="BetaBot",
            personality="conservative",
            strategy_type="value",
            avatar_url="https://example.com/avatar2.png",
            stats={},
            memory={},
            created_at=now,
        )

        agent3 = Agent(
            id=uuid4(),
            name="GammaBot",
            personality="balanced",
            strategy_type="quantitative",
            avatar_url="https://example.com/avatar3.png",
            stats={},
            memory={},
            created_at=now,
        )

        session.add(agent1)
        session.add(agent2)
        session.add(agent3)

        await session.commit()

        # Create Trades
        trade1 = Trade(
            id=uuid4(),
            agent_id=agent1.id,
            tournament_id=tournament1.id,
            action=ActionEnum.buy,
            asset="BTC",
            amount=Decimal("0.5"),
            price=Decimal("45000.00"),
            timestamp=now,
        )

        trade2 = Trade(
            id=uuid4(),
            agent_id=agent2.id,
            tournament_id=tournament1.id,
            action=ActionEnum.buy,
            asset="ETH",
            amount=Decimal("5.0"),
            price=Decimal("3000.00"),
            timestamp=now,
        )

        trade3 = Trade(
            id=uuid4(),
            agent_id=agent3.id,
            tournament_id=tournament1.id,
            action=ActionEnum.sell,
            asset="BTC",
            amount=Decimal("0.25"),
            price=Decimal("46000.00"),
            timestamp=now,
        )

        session.add(trade1)
        session.add(trade2)
        session.add(trade3)

        # Create Bets
        bet1 = Bet(
            id=uuid4(),
            user_address="0x1234567890abcdef",
            agent_id=agent1.id,
            tournament_id=tournament1.id,
            amount=Decimal("100.00"),
            odds=Decimal("2.5"),
            placed_at=now,
            settled=False,
        )

        bet2 = Bet(
            id=uuid4(),
            user_address="0xabcdef1234567890",
            agent_id=agent2.id,
            tournament_id=tournament1.id,
            amount=Decimal("250.00"),
            odds=Decimal("3.0"),
            placed_at=now,
            settled=False,
        )

        session.add(bet1)
        session.add(bet2)

        await session.commit()

        print("✅ Database seeded successfully!")
        print(f"   - Created 2 tournaments")
        print(f"   - Created 3 agents")
        print(f"   - Created 3 trades")
        print(f"   - Created 2 bets")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
