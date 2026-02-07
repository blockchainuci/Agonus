# backend/app/scripts/seed_db.py
import os
import sys
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Allow running from anywhere
sys.path.append(str(Path(__file__).resolve().parents[3]))

from backend.app.db.models import Tournament, Agent, AgentState, Trade, Bet, StatusEnum, ActionEnum

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")
_db_url = os.getenv("DATABASE_URL", "").replace("postgresql+asyncpg://", "postgresql+psycopg2://")
sync_engine = create_engine(_db_url)


def seed_database():
    """Seed the database with test data"""

    with Session(sync_engine) as session:
        # Create Tournaments
        tournament1 = Tournament(
            id=uuid4(),
            name="Q4 2025 Championship",
            status=StatusEnum.live,
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=30),
            prize_pool=Decimal("10000.00"),
            created_at=datetime.now(timezone.utc),
        )

        tournament2 = Tournament(
            id=uuid4(),
            name="Spring Series",
            status=StatusEnum.upcoming,
            start_date=datetime.now(timezone.utc) + timedelta(days=7),
            end_date=datetime.now(timezone.utc) + timedelta(days=37),
            prize_pool=Decimal("5000.00"),
            created_at=datetime.now(timezone.utc),
        )

        session.add(tournament1)
        session.add(tournament2)

        # Create Agents
        agent1 = Agent(
            id=uuid4(),
            name="Alpha Trader",
            personality="Aggressive risk-taker",
            strategy_type="momentum",
            avatar_url="https://example.com/avatar1.png",
            stats={"win_rate": 0.65, "total_trades": 150},
            memory={"last_analysis": "Bullish on tech stocks"},
            created_at=datetime.now(timezone.utc),
        )

        agent2 = Agent(
            id=uuid4(),
            name="Beta Analyst",
            personality="Conservative value investor",
            strategy_type="value",
            avatar_url="https://example.com/avatar2.png",
            stats={"win_rate": 0.58, "total_trades": 200},
            memory={"last_analysis": "Focus on fundamentals"},
            created_at=datetime.now(timezone.utc),
        )

        agent3 = Agent(
            id=uuid4(),
            name="Gamma Quant",
            personality="Data-driven algorithmic trader",
            strategy_type="quantitative",
            avatar_url="https://example.com/avatar3.png",
            stats={"win_rate": 0.72, "total_trades": 500},
            memory={"last_analysis": "Pattern detected in BTC"},
            created_at=datetime.now(timezone.utc),
        )

        session.add(agent1)
        session.add(agent2)
        session.add(agent3)

        session.commit()

        # Create Agent States
        agent_state1 = AgentState(
            agent_id=agent1.id,
            tournament_id=tournament1.id,
            portfolio={"USD": 10000.0},
            portfolio_value_usd=Decimal("10000.00"),
            rank=1,
            trades_count=0,
            last_decision="Initial state",
            updated_at=datetime.now(timezone.utc),
        )

        agent_state2 = AgentState(
            agent_id=agent2.id,
            tournament_id=tournament1.id,
            portfolio={"USD": 10000.0},
            portfolio_value_usd=Decimal("10000.00"),
            rank=2,
            trades_count=0,
            last_decision="Initial state",
            updated_at=datetime.now(timezone.utc),
        )

        agent_state3 = AgentState(
            agent_id=agent3.id,
            tournament_id=tournament1.id,
            portfolio={"USD": 10000.0},
            portfolio_value_usd=Decimal("10000.00"),
            rank=3,
            trades_count=0,
            last_decision="Initial state",
            updated_at=datetime.now(timezone.utc),
        )

        session.add(agent_state1)
        session.add(agent_state2)
        session.add(agent_state3)
        session.commit()

        # Create Trades
        trade1 = Trade(
            id=uuid4(),
            agent_id=agent1.id,
            tournament_id=tournament1.id,
            action=ActionEnum.buy,
            asset="BTC",
            amount=Decimal("0.5"),
            price=Decimal("45000.00"),
            timestamp=datetime.now(timezone.utc),
        )

        trade2 = Trade(
            id=uuid4(),
            agent_id=agent2.id,
            tournament_id=tournament1.id,
            action=ActionEnum.buy,
            asset="ETH",
            amount=Decimal("5.0"),
            price=Decimal("3000.00"),
            timestamp=datetime.now(timezone.utc),
        )

        trade3 = Trade(
            id=uuid4(),
            agent_id=agent3.id,
            tournament_id=tournament1.id,
            action=ActionEnum.sell,
            asset="BTC",
            amount=Decimal("0.25"),
            price=Decimal("46000.00"),
            timestamp=datetime.now(timezone.utc),
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
            placed_at=datetime.now(timezone.utc),
            settled=False,
        )

        bet2 = Bet(
            id=uuid4(),
            user_address="0xabcdef1234567890",
            agent_id=agent2.id,
            tournament_id=tournament1.id,
            amount=Decimal("250.00"),
            odds=Decimal("3.0"),
            placed_at=datetime.now(timezone.utc),
            settled=False,
        )

        session.add(bet1)
        session.add(bet2)

        session.commit()

        print("Database seeded successfully!")
        print("   - Created 2 tournaments")
        print("   - Created 3 agents")
        print("   - Created 3 agent states")
        print("   - Created 3 trades")
        print("   - Created 2 bets")


if __name__ == "__main__":
    seed_database()
