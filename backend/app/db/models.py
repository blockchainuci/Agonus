# from typing import List
# from typing import Optional
# from sqlalchemy import ForeignKey
# from sqlalchemy import String, Numeric, Integer, UUID
# from sqlalchemy import DateTime, func
# from sqlalchemy.orm import DeclarativeBase
# from sqlalchemy.orm import Mapped
# from sqlalchemy.orm import mapped_column
# from sqlalchemy.orm import relationship

##LEAVING SQLACLHEMY STUFF IN CASE WE HAVE TO TRANSITION BACK FOR EFFECTIVE ASYNC SUPPORT
from datetime import datetime
import enum
from sqlalchemy.types import Enum
from uuid import UUID
from decimal import Decimal

from sqlmodel import Column, Field, SQLModel, JSON, Enum as SQLEnum, Relationship

class StatusEnum(enum.Enum):
    upcoming = "upcoming"
    live = "live"
    completed = "completed"

class ActionEnum(enum.Enum):
    buy = 'buy'
    sell = 'sell'
    hold = 'hold'

class Tournament(SQLModel, table=True):
    __tablename__ = 'tournament'

    id: UUID | None = Field(default=None, primary_key = True)
    name: str
    status: StatusEnum = Field(sa_column=Column(SQLEnum(StatusEnum)))
    start_date: datetime
    end_date: datetime
    prize_pool: Decimal
    created_at: datetime
    winner_agent_id: UUID = Field(foreign_key='agent.id')

    trades: list["Trade"] = Relationship(back_populates="tournament")
    bets: list["Bet"] = Relationship(back_populates="tournament")

class Agent(SQLModel, table=True):
    __tablename__ = 'agent'

    id: UUID | None = Field(default=None, primary_key=True)
    name: str
    personality: str
    strategy_type: str
    avatar_url: str = Field(nullable=True)
    stats: JSON
    memory: JSON
    created_at: datetime

    trades: list["Trade"] = Relationship(back_populates='agent')
    bets: list["Bet"] = Relationship(back_populates="agent")

class AgentState(SQLModel, table =True):
    __tablename__ = 'agent_state'

    agent_id: UUID = Field(foreign_key='agent.id', primary_key=True)
    tournament_id: UUID = Field(foreign_key = 'tournament.id', primary_key=True)
    portfolio: JSON
    portfolio_value_usd: Decimal
    rank: int
    trades_count: int
    last_decision: str
    updated_at: datetime

class Trade(SQLModel, table=True):
    id: UUID | None = Field(default=None, primary_key=True)
    agent_id: UUID = Field(foreign_key='agent.id')
    tournament_id: UUID = Field(foreign_key='tournament.id')
    action: ActionEnum = Field(sa_column=Column(SQLEnum(ActionEnum)))
    asset: str
    amount: Decimal
    price: Decimal
    timestamp: datetime

    tournament: Tournament | None = Relationship(back_populates="trades")
    agent: Agent | None = Relationship(back_populates="trades")


class Bet(SQLModel, table=True):
    id: UUID = Field(primary_key=True)
    user_address: str
    agent_id: UUID = Field(foreign_key='agent.id')
    tournament_id: UUID = Field(foreign_key='tournament.id')
    amount: Decimal
    odds: Decimal
    placed_at: datetime
    settled: bool
    payout: Decimal =  Field(nullable = True)

    tournament: Tournament | None = Relationship(back_populates="bets")
    agent: Agent | None = Relationship(back_populates="bets")

# class Tournament(Base):
#     __tablename__ = "tournament"

#     id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
#     name: Mapped[str] = mapped_column(nullable=False)
#     status: Mapped[StatusEnum] = mapped_column(Enum(StatusEnum, native_enum=True), nullable=False)
#     start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
#     end_date : Mapped[datetime] = mapped_column(DateTime, nullable=False)
#     prize_pool: Mapped[Numeric] = mapped_column(Numeric, nullable=False)
#     created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
#     winner_agent_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('agent.id'))

# class Agent(Base):
#     __tablename__ = "agent"

#     id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
#     name: Mapped[str] = mapped_column(String, nullable=False)
#     personality: Mapped[str] = mapped_column(String, nullable=False)
#     strategy_type: Mapped[str] = mapped_column(String, nullable=False)
#     avatar_url: Mapped[str] = mapped_column(String, nullable=True)
#     stats: Mapped[JSON] = mapped_column(JSON, nullable=False)
#     memory: Mapped[JSON] = mapped_column(JSON, nullable=False)
#     created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

# class AgentState(Base):
#     __tablename__ = "agent_state"

#     agent_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('agent.id'), primary_key=True)
#     tournament_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('tournament.id'), primary_key=True)
#     portfolio: Mapped[JSON] = mapped_column(JSON, nullable=False)
#     portfolio_value_usd: Mapped[Numeric] = mapped_column(Numeric, nullable = False)
#     rank: Mapped[Integer] = mapped_column(Integer, nullable=False)
#     trades_count: Mapped[Integer] = mapped_column(Integer, nullable=False)
#     last_decision: Mapped[str] = mapped_column(String, nullable=False)
#     updated_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)

