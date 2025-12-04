from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

# FIXED IMPORT PATHS
from app.db.database import get_db
from app.db.models import Tournament, AgentState, Agent
from app.schemas.tournament import (
    TournamentCreate,
    TournamentUpdate,
    TournamentResponse,
)
from app.schemas.agent_state import AgentStateResponse
from app.api.deps import require_admin
from app.agents.scheduler import (
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
    """GET leaderboard ordered by portfolio value"""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")

    statement = (
        select(AgentState)
        .where(AgentState.tournament_id == tournament_id)
        .order_by(AgentState.portfolio_value_usd.desc())
    )
    result = await session.execute(statement)
    return result.scalars().all()


@router.get("/{tournament_id}/agents", response_model=list[AgentStateResponse])
async def get_tournament_agents(
    tournament_id: UUID, session: AsyncSession = Depends(get_db)
):
    """GET agents participating in tournament"""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")

    statement = select(AgentState).where(AgentState.tournament_id == tournament_id)
    result = await session.execute(statement)
    return result.scalars().all()


@router.post("/", response_model=TournamentResponse, status_code=201)
async def create_tournament(
    tournament_data: TournamentCreate,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """POST create a new tournament"""
    tournament_dict = tournament_data.model_dump(exclude={"agent_ids"})
    tournament = Tournament(**tournament_dict)

    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)

    return tournament


@router.post("/{tournament_id}/start")
async def start_tournament(tournament_id: str):
    initialize_tournament_agents.delay(
        tournament_uuid=tournament_id, agent_uuids=["uuid-1", "uuid-2"]
    )
    return {"message": "Tournament initialization started"}


@router.post("/agents/{agent_id}/force-run")
async def force_agent_run(agent_id: str, tournament_id: str):
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
    """PUT update tournament"""
    db_tournament = await session.get(Tournament, tournament_id)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")

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
    """DELETE tournament"""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")

    await session.delete(tournament)
    await session.commit()

    return {"message": f"Tournament {tournament_id} deleted successfully"}
