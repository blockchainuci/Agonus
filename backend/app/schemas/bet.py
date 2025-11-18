from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, ConfigDict


class BetBase(BaseModel):
    user_address: str
    agent_id: UUID
    tournament_id: UUID
    amount: Decimal
    odds: Decimal


class BetCreate(BetBase):
    placed_at: Optional[datetime] = None
    settled: Optional[bool] = False
    payout: Optional[Decimal] = None


class BetUpdate(BaseModel):
    amount: Optional[Decimal] = None
    odds: Optional[Decimal] = None
    settled: Optional[bool] = None
    payout: Optional[Decimal] = None


class BetResponse(BetBase):
    id: UUID
    placed_at: datetime
    settled: bool
    payout: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)
