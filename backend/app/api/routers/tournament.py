from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from backend.app.db.database import get_db
from backend.app.db.models import Tournament, AgentState, Agent
from backend.app.schemas.tournament import (
    TournamentCreate,
    TournamentUpdate,
    TournamentResponse,
)
from backend.app.schemas.agent_state import AgentStateResponse
from backend.app.api.deps import require_admin

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


@router.post("/", response_model=TournamentResponse, status_code=201)
async def create_tournament(
    tournament_data: TournamentCreate,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """POST route to create a new tournament"""
    # Create tournament from schema, excluding agent_ids (not a Tournament model field)
    tournament_dict = tournament_data.model_dump(exclude={"agent_ids"})
    tournament = Tournament(**tournament_dict)

    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)
    return tournament


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

