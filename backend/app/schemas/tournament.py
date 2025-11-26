from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, ConfigDict


# Base schema with common fields
class TournamentBase(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime
    prize_pool: Decimal


# Schema for creating tournaments (POST)
class TournamentCreate(TournamentBase):
    agent_ids: list[UUID]  # NEW: Agents participating in this tournament


# Schema for updating tournaments (PUT/PATCH)
class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    prize_pool: Optional[Decimal] = None
    winner_agent_id: Optional[UUID] = None


# NEW: Schema for linking contract after creation
class TournamentContractLink(BaseModel):
    contract_tournament_id: int
    tx_hash: Optional[str] = None  # For verification/tracking


# Schema for responses (GET)
class TournamentResponse(TournamentBase):
    id: UUID
    status: str  # StatusEnum as string
    created_at: datetime
    winner_agent_id: Optional[UUID] = None

    # NEW: Contract integration fields
    contract_tournament_id: Optional[int] = None
    agent_contract_mapping: dict[str, int] = {}  # {"agent-uuid": 1, "agent-uuid2": 2}

    model_config = ConfigDict(from_attributes=True)
