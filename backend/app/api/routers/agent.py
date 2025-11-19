from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from backend.app.db.database import get_db
from backend.app.db.models import Agent
from backend.app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from backend.app.api.deps import require_admin

router = APIRouter()


@router.get("/", response_model=list[AgentResponse])
async def list_agents(session: AsyncSession = Depends(get_db)):
    """GET route for list of all agents"""
    statement = select(Agent)
    result = await session.execute(statement)
    agents = result.scalars().all()
    return agents


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: UUID, session: AsyncSession = Depends(get_db)):
    """GET route for agent by agent_id"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")
    return agent


@router.get("/{agent_id}/stats", response_model=dict)
async def get_agent_stats(agent_id: UUID, session: AsyncSession = Depends(get_db)):
    """GET route for agent statistics across all tournaments"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")

    # Return the stats JSON field
    return agent.stats


@router.post("/", response_model=AgentResponse, status_code=201)
async def create_agent(
    agent_data: AgentCreate,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """POST route for creating a new agent (admin only)"""
    # Create Agent model from schema, excluding None values to use model defaults
    agent_dict = agent_data.model_dump(exclude_none=True)

    # Ensure stats and memory have default values if not provided
    if 'stats' not in agent_dict:
        agent_dict['stats'] = {}
    if 'memory' not in agent_dict:
        agent_dict['memory'] = {}

    agent = Agent(**agent_dict)

    session.add(agent)
    await session.commit()
    await session.refresh(agent)
    return agent


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: UUID,
    agent_data: AgentUpdate,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """PUT route for updating an agent (admin only)"""
    db_agent = await session.get(Agent, agent_id)
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")

    # Update only provided fields
    update_data = agent_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_agent, key, value)

    session.add(db_agent)
    await session.commit()
    await session.refresh(db_agent)

    return db_agent


@router.patch("/{agent_id}/stats", response_model=AgentResponse)
async def update_agent_stats(
    agent_id: UUID,
    stats: dict,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """PATCH route for updating agent stats (admin/system only)"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")

    # Merge new stats with existing stats
    agent.stats = {**agent.stats, **stats}

    session.add(agent)
    await session.commit()
    await session.refresh(agent)

    return agent


@router.patch("/{agent_id}/memory", response_model=AgentResponse)
async def update_agent_memory(
    agent_id: UUID,
    memory: dict,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """PATCH route for updating agent memory (admin/system only)"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")

    # Merge new memory with existing memory
    agent.memory = {**agent.memory, **memory}

    session.add(agent)
    await session.commit()
    await session.refresh(agent)

    return agent


@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: UUID,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """DELETE route for deleting an agent (admin only - use with caution)"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")

    # Note: This will fail if agent has related trades/bets due to foreign keys
    # Consider soft delete instead (add 'active' boolean field)
    await session.delete(agent)
    await session.commit()

    return {"message": f"Agent {agent_id} deleted successfully"}

