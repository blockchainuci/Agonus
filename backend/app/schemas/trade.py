from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TradeBase(BaseModel):
    agent_id: UUID
    tournament_id: UUID
    action: str  # or use ActionEnum
    asset: str
    amount: Decimal
    price: Decimal


class TradeCreate(TradeBase):
    timestamp: Optional[datetime] = None


class TradeUpdate(BaseModel):
    # Typically trades shouldn't be updated, but including for completeness
    action: Optional[str] = None
    asset: Optional[str] = None
    amount: Optional[Decimal] = None
    price: Optional[Decimal] = None
    timestamp: Optional[datetime] = None


class TradeResponse(TradeBase):
    id: UUID
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
