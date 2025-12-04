from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ...agents.data_classes import Portfolio
import logging
import asyncio
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta

from celery import Task, group, chain
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ...celery_config import celery_app
from ...db.database import AsyncSessionLocal
from ...db.models import Tournament, Agent, AgentState, StatusEnum
from ...agents.executor import TradingAgent
from ...agents.tools import DatabaseTool

from backend.app.db.database import get_db
from backend.app.db.models import Tournament, AgentState, Agent
from backend.app.schemas.tournament import (
    TournamentCreate,
    TournamentUpdate,
    TournamentResponse,
)
from backend.app.schemas.agent_state import AgentStateResponse
from backend.app.api.deps import require_admin
from backend.app.agents.scheduler import (
    run_agent_decision,
    initialize_tournament_agents,
)

router = APIRouter()


@router.get("/", response_model=list[TournamentResponse])
async def list_tournaments(session: AsyncSession = Depends(get_db)):
    """GET route for list of tournaments"""
    statement = select(Tournament)
    result = await session.execute(statement)
    tournaments = result.scalars().all()
    return tournaments


@router.get("/{tournament_id}", response_model=TournamentResponse)
async def get_tournament(tournament_id: UUID, session: AsyncSession = Depends(get_db)):
    """GET route for tournament by tournament_id"""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")
    return tournament


@router.get("/{tournament_id}/leaderboard", response_model=list[AgentStateResponse])
async def get_tournament_leaderboard(
    tournament_id: UUID, session: AsyncSession = Depends(get_db)
):
    """GET route for tournament leaderboard - agents ranked by portfolio value"""
    # Verify tournament exists
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")

    # Get all agent states for this tournament, ordered by portfolio value
    statement = (
        select(AgentState)
        .where(AgentState.tournament_id == tournament_id)
        .order_by(AgentState.portfolio_value_usd.desc())
    )
    result = await session.execute(statement)
    agent_states = result.scalars().all()

    return agent_states


@router.get("/{tournament_id}/agents", response_model=list[AgentStateResponse])
async def get_tournament_agents(
    tournament_id: UUID, session: AsyncSession = Depends(get_db)
):
    """GET route for all agents in a tournament with their current state"""
    # Verify tournament exists
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")

    # Get all agent states for this tournament
    statement = select(AgentState).where(AgentState.tournament_id == tournament_id)
    result = await session.execute(statement)
    agent_states = result.scalars().all()

    return agent_states


# @router.post("/", response_model=TournamentResponse, status_code=201)
# async def create_tournament(
#     tournament_data: TournamentCreate,
#     session: AsyncSession = Depends(get_db),
#     admin: dict = Depends(require_admin),
# ):
#     pass

# def initialize_tournament_agents(
#     tournament_uuid: str,
#     agent_uuids: List[str]
# ) -> Dict[str, Any]:
#     """
#     Initialize agent states for a new tournament.

#     Args:
#         tournament_uuid: Tournament UUID (as string)
#         agent_uuids: List of agent UUIDs (as strings)

#     Returns:
#         Dict with initialization results
#     """
#     # logger.info(f"Initializing agents for tournament: {tournament_uuid}")
#     try:
#         return asyncio.run(
#             _initialize_tournament_agents_async(
#                 UUID(tournament_uuid),
#                 [UUID(uuid) for uuid in agent_uuids]
#             )
#         )
#     except Exception as e:
#         # logger.error(f"Failed to initialize tournament agents: {e}")
#         raise


# async def _initialize_tournament_agents_async(
#     tournament_uuid: UUID,
#     agent_uuids: List[UUID]
# ) -> Dict[str, Any]:
#     """
#     Async implementation of agent initialization.
#     """
#     async with AsyncSessionLocal() as session:
#         db_tool = DatabaseTool(session)
#         initialized = []

#         for agent_uuid in agent_uuids:
#             # Load agent
#             stmt = select(Agent).where(Agent.id == agent_uuid)
#             result = await session.execute(stmt)
#             agent = result.scalar_one_or_none()

#             if not agent:
#                 # logger.warning(f"Agent not found: {agent_uuid}")
#                 continue

#             # Create initial portfolio
#             from ...agents.data_classes import Portfolio

#             portfolio = Portfolio(
#                 agent_id=agent.name,
#                 cash=500.0,
#                 holdings={},
#                 starting_val=500.0,
#                 total_value=500.0
#             )

#             # Save initial state
#             await db_tool.save_agent_state(
#                 agent_uuid=agent_uuid,
#                 tournament_uuid=tournament_uuid,
#                 portfolio=portfolio,
#                 rank=0,
#                 last_decision="Tournament initialized"
#             )

#             initialized.append(str(agent_uuid))
#             # logger.info(f"Initialized agent: {agent.name}")

#         return {
#             "tournament_id": str(tournament_uuid),
#             "agents_initialized": len(initialized),
#             "agent_ids": initialized,
#             "timestamp": datetime.now(timezone.utc).isoformat()
#         }

#     """POST route to create a new tournament"""
#     # Create tournament from schema, excluding agent_ids (not a Tournament model field)
#     tournament_dict = tournament_data.model_dump(exclude={"agent_ids"})
#     tournament = Tournament(**tournament_dict)

#     session.add(tournament)
#     await session.commit()
#     await session.refresh(tournament)

#     return tournament


# @router.post("/{tournament_id}/start")
# async def start_tournament(tournament_id: str):
#     initialize_tournament_agents.delay(
#         tournament_uuid=tournament_id, agent_uuids=["uuid-1", "uuid-2"]
#     )
#     return {"message": "Tournament initialization started"}


async def initialize_agents_for_tournament(
    session: AsyncSession,
    tournament_id: UUID,
    agent_ids: list[UUID],
):
    db = DatabaseTool(session)

    for agent_id in agent_ids:

        # Load the agent
        result = await session.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()

        if not agent:
            raise ValueError(f"Agent not found: {agent_id}")

        # Create initial portfolio
        portfolio = Portfolio(
            agent_id=str(agent_id),
            cash=500.0,
            holdings={},
            starting_val=500.0,
            total_value=500.0,
        )

        # Save agent-state entry in DB
        await db.save_agent_state(
            agent_uuid=agent_id,
            tournament_uuid=tournament_id,
            portfolio=portfolio,
            rank=0,
            last_decision="Tournament initialized",
        )


@router.post("/", response_model=TournamentResponse, status_code=201)
async def create_tournament(
    data: TournamentCreate,
    session: AsyncSession = Depends(get_db),
):
    # 1️⃣ Create the tournament row
    tournament = Tournament(
        name=data.name,
        start_date=data.start_date,
        end_date=data.end_date,
        prize_pool=data.prize_pool,
        status=StatusEnum.upcoming,
    )

    session.add(tournament)
    await session.flush()  # ensures tournament.id exists without commit

    # 2️⃣ Initialize agent states
    await initialize_agents_for_tournament(
        session=session,
        tournament_id=tournament.id,
        agent_ids=data.agent_ids,
    )

    # 3️⃣ Commit the whole transaction atomically
    await session.commit()
    await session.refresh(tournament)

    return tournament


@router.post("/agents/{agent_id}/force-run")
async def force_agent_run(agent_id: str, tournament_id: str):
    # 2. Force a single agent to think NOW
    task = run_agent_decision.delay(
        agent_uuid=agent_id, tournament_uuid=tournament_id, recover_from_crash=True
    )

    return {"task_id": task.id, "status": "Queued"}


@router.put("/{tournament_id}", response_model=TournamentResponse)
async def update_tournament(
    tournament_id: UUID,
    tournament_data: TournamentUpdate,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """PUT route for updating a tournament"""
    db_tournament = await session.get(Tournament, tournament_id)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")

    # Update only provided fields
    update_data = tournament_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_tournament, key, value)

    session.add(db_tournament)
    await session.commit()
    await session.refresh(db_tournament)

    return db_tournament


@router.delete("/{tournament_id}")
async def delete_tournament(
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """DELETE route for deleting a tournament"""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")

    await session.delete(tournament)
    await session.commit()

    return {"message": f"Tournament {tournament_id} deleted successfully"}
