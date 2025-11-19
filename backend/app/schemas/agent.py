from datetime import datetime
from uuid import UUID
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class AgentBase(BaseModel):
    name: str
    personality: str
    strategy_type: str


class AgentCreate(AgentBase):
    avatar_url: Optional[str] = None
    stats: Optional[dict[str, Any]] = None
    memory: Optional[dict[str, Any]] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    personality: Optional[str] = None
    strategy_type: Optional[str] = None
    avatar_url: Optional[str] = None
    stats: Optional[dict[str, Any]] = None
    memory: Optional[dict[str, Any]] = None


class AgentResponse(AgentBase):
    id: UUID
    avatar_url: Optional[str] = None
    stats: dict[str, Any]
    memory: dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

