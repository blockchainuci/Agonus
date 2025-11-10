#### app/schemas/agent.py
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class AgentBase(BaseModel):
    name: str
    personality: str
    strategy_type: str

class AgentCreate(AgentBase):
    pass

class AgentRead(AgentBase):
    id: UUID
    stats: dict
    created_at: datetime

    class Config:
        from_attributes = True