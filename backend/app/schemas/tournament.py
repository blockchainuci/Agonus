from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, ConfigDict


# Base schema with all possible fields
class TournamentBase(BaseModel):
    name: str
    status: str  # or use StatusEnum
    start_date: datetime
    end_date: datetime
    prize_pool: Decimal


# Schema for creating tournaments (POST)
class TournamentCreate(TournamentBase):
    
    #ids of agents participating in the tournament
    agent_ids: list[UUID]


# Schema for updating tournaments (PUT/PATCH)
class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    prize_pool: Optional[Decimal] = None
    winner_agent_id: Optional[UUID] = None


# Schema for responses (GET)
class TournamentResponse(TournamentBase):
    id: UUID
    created_at: datetime
    winner_agent_id: Optional[UUID] = None
    
    
    #ADDED BY JACOB
    #expose chain id on responses
    contract_tournament_id: Optional[int] = None
    #agent_contract_mapping: Optional[dict[str, int]] = None

    model_config = ConfigDict(from_attributes=True)
