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
from __future__ import annotations
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from typing import List, Optional, Any
import enum

from sqlmodel import SQLModel, Field, Column, JSON, Enum as SQLEnum, Relationship
from pydantic import ConfigDict


#ENUMS
class StatusEnum(enum.Enum):
    upcoming = "upcoming"
    live = "live"
    completed = "completed"


class ActionEnum(enum.Enum):
    buy = "buy"
    sell = "sell"
    hold = "hold"


#MODELS
class Tournament(SQLModel, table=True):
    __tablename__ = "tournament"

    id: Optional[UUID] = Field(default=None, primary_key=True)
    name: str
    status: StatusEnum = Field(sa_column=Column(SQLEnum(StatusEnum)))
    start_date: datetime
    end_date: datetime
    prize_pool: Decimal
    created_at: datetime = Field(default_factory=datetime.utcnow)
    winner_agent_id: Optional[UUID] = Field(default=None, foreign_key="agent.id")

    trades: List[Trade] = Relationship(back_populates="tournament")
    bets: List[Bet] = Relationship(back_populates="tournament")

    # ✅ Allow arbitrary SQLAlchemy types
    model_config = ConfigDict(arbitrary_types_allowed=True)


class Agent(SQLModel, table=True):
    __tablename__ = "agent"

    id: Optional[UUID] = Field(default=None, primary_key=True)
    name: str
    personality: str
    strategy_type: str
    avatar_url: Optional[str] = None
    stats: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    memory: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    trades: List[Trade] = Relationship(back_populates="agent")
    bets: List[Bet] = Relationship(back_populates="agent")

    model_config = ConfigDict(arbitrary_types_allowed=True)


class AgentState(SQLModel, table=True):
    __tablename__ = "agent_state"

    agent_id: UUID = Field(foreign_key="agent.id", primary_key=True)
    tournament_id: UUID = Field(foreign_key="tournament.id", primary_key=True)
    portfolio: Any = Field(sa_column=Column(JSON))
    portfolio_value_usd: Decimal
    rank: int
    trades_count: int
    last_decision: str
    updated_at: datetime

    model_config = ConfigDict(arbitrary_types_allowed=True)


class Trade(SQLModel, table=True):
    __tablename__ = "trade"

    id: Optional[UUID] = Field(default=None, primary_key=True)
    agent_id: UUID = Field(foreign_key="agent.id")
    tournament_id: UUID = Field(foreign_key="tournament.id")
    action: ActionEnum = Field(sa_column=Column(SQLEnum(ActionEnum)))
    asset: str
    amount: Decimal
    price: Decimal
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    tournament: Optional[Tournament] = Relationship(back_populates="trades")
    agent: Optional[Agent] = Relationship(back_populates="trades")

    model_config = ConfigDict(arbitrary_types_allowed=True)


class Bet(SQLModel, table=True):
    __tablename__ = "bet"

    id: UUID = Field(primary_key=True)
    user_address: str
    agent_id: UUID = Field(foreign_key="agent.id")
    tournament_id: UUID = Field(foreign_key="tournament.id")
    amount: Decimal
    odds: Decimal
    placed_at: datetime = Field(default_factory=datetime.utcnow())
    settled: bool
    payout: Optional[Decimal] = None

    tournament: Optional[Tournament] = Relationship(back_populates="bets")
    agent: Optional[Agent] = Relationship(back_populates="bets")

    model_config = ConfigDict(arbitrary_types_allowed=True)

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

