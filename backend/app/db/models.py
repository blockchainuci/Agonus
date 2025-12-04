from __future__ import annotations
from datetime import datetime, timezone
from uuid import UUID, uuid4
from decimal import Decimal
from typing import Optional, Any
import enum

from sqlalchemy import String, Numeric, Integer, Enum as SQLEnum, Index, DateTime
from sqlalchemy import ForeignKey, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# BASE
class Base(DeclarativeBase):
    pass


# ENUMS
class StatusEnum(str, enum.Enum):
    upcoming = "upcoming"
    live = "live"
    completed = "completed"


class ActionEnum(str, enum.Enum):
    buy = "buy"
    sell = "sell"
    hold = "hold"


# MODELS
class Tournament(Base):
    __tablename__ = "tournament"

    __table_args__ = (
        Index("ix_tournament_status", "status"),
        Index("ix_tournament_dates", "start_date", "end_date"),
    )
    contract_tournament_id: Mapped[Optional[int]] = mapped_column(index=True, default=None)
    agent_contract_mapping: Mapped[dict] = mapped_column(JSON, default=dict)  # {"uuid": 1, "uuid2": 2}
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, index=True)
    status: Mapped[StatusEnum] = mapped_column(SQLEnum(StatusEnum, native_enum=False), default=StatusEnum.upcoming)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    prize_pool: Mapped[Decimal] = mapped_column(Numeric(precision=20, scale=2))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    winner_agent_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("agent.id"), index=True, default=None
    )

    # Relationships - clean and simple!
    trades: Mapped[list["Trade"]] = relationship(back_populates="tournament")
    bets: Mapped[list["Bet"]] = relationship(back_populates="tournament")


class Agent(Base):
    __tablename__ = "agent"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, index=True)
    personality: Mapped[str] = mapped_column(String)
    strategy_type: Mapped[str] = mapped_column(String, index=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String, default=None)
    stats: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    memory: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    trades: Mapped[list["Trade"]] = relationship(back_populates="agent")
    bets: Mapped[list["Bet"]] = relationship(back_populates="agent")


class AgentState(Base):
    __tablename__ = "agent_state"

    agent_id: Mapped[UUID] = mapped_column(ForeignKey("agent.id"), primary_key=True)
    tournament_id: Mapped[UUID] = mapped_column(
        ForeignKey("tournament.id"), primary_key=True
    )
    portfolio: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    portfolio_value_usd: Mapped[Decimal] = mapped_column(Numeric(precision=20, scale=2))
    rank: Mapped[int] = mapped_column(Integer)
    trades_count: Mapped[int] = mapped_column(Integer, default=0)
    last_decision: Mapped[str] = mapped_column(String)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Trade(Base):
    __tablename__ = "trade"

    __table_args__ = (
        Index("ix_trade_agent_tournament", "agent_id", "tournament_id"),
        Index("ix_trade_timestamp", "timestamp"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    agent_id: Mapped[UUID] = mapped_column(ForeignKey("agent.id"), index=True)
    tournament_id: Mapped[UUID] = mapped_column(ForeignKey("tournament.id"), index=True)
    action: Mapped[ActionEnum] = mapped_column(SQLEnum(ActionEnum, native_enum=False))
    asset: Mapped[str] = mapped_column(String, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(precision=20, scale=8))
    price: Mapped[Decimal] = mapped_column(Numeric(precision=20, scale=8))
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    tournament: Mapped["Tournament"] = relationship(back_populates="trades")
    agent: Mapped["Agent"] = relationship(back_populates="trades")


class Bet(Base):
    __tablename__ = "bet"

    __table_args__ = (
        Index("ix_bet_user_tournament", "user_address", "tournament_id"),
        Index("ix_bet_settled", "settled"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_address: Mapped[str] = mapped_column(String, index=True)
    agent_id: Mapped[UUID] = mapped_column(ForeignKey("agent.id"), index=True)
    tournament_id: Mapped[UUID] = mapped_column(ForeignKey("tournament.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(precision=20, scale=2))
    odds: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    placed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    settled: Mapped[bool] = mapped_column(default=False)
    payout: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=20, scale=2), default=None
    )

    tournament: Mapped["Tournament"] = relationship(back_populates="bets")
    agent: Mapped["Agent"] = relationship(back_populates="bets")
