from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class AgentStateBase(BaseModel):
    agent_id: UUID
    tournament_id: UUID
    portfolio_value_usd: Decimal
    rank: int
    last_decision: str


class AgentStateCreate(AgentStateBase):
    portfolio: Optional[dict[str, Any]] = None
    trades_count: Optional[int] = 0
    updated_at: Optional[datetime] = None


class AgentStateUpdate(BaseModel):
    portfolio: Optional[dict[str, Any]] = None
    portfolio_value_usd: Optional[Decimal] = None
    rank: Optional[int] = None
    trades_count: Optional[int] = None
    last_decision: Optional[str] = None
    updated_at: Optional[datetime] = None


class AgentStateResponse(AgentStateBase):
    portfolio: dict[str, Any]
    trades_count: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
