import os
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.database import get_db
from backend.app.db.models import Tournament, Agent
from backend.app.schemas.tournament import (
    TournamentCreate,
    TournamentUpdate,
    TournamentResponse,
)
from backend.app.api.deps import require_admin
from backend.app.services import contract_service
from backend.app.services.contract_service import ContractTransactionError

router = APIRouter()

async def validate_agents(session: AsyncSession, agent_ids: list[UUID]) -> list[Agent]:
    """Validate that all provided agent_ids exist in the DB."""
    if not agent_ids:
        raise HTTPException(status_code=400, detail="At least one agent is required")

    stmt = select(Agent).where(Agent.id.in_(agent_ids))
    result = await session.execute(stmt)
    agents = result.scalars().all()

    if len(agents) != len(agent_ids):
        raise HTTPException(status_code=400, detail="One or more agents not found")

    return agents

@router.get("/", response_model=list[TournamentResponse])
async def list_tournaments(session: AsyncSession = Depends(get_db)):
    statement = select(Tournament)
    result = await session.execute(statement)
    tournaments = result.scalars().all()
    return tournaments

@router.get("/{tournament_id}", response_model=TournamentResponse)
async def get_tournament(
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")
    return tournament

@router.post("/", response_model=TournamentResponse, status_code=201)
async def create_tournament(
    tournament_data: TournamentCreate,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    agents = await validate_agents(session, tournament_data.agent_ids)

    tournament = Tournament(
        name=tournament_data.name,
        status=tournament_data.status,
        start_date=tournament_data.start_date,
        end_date=tournament_data.end_date,
        prize_pool=tournament_data.prize_pool,
    )

    tournament.agent_contract_mapping = {
        str(agent.id): idx + 1 for idx, agent in enumerate(agents)
    }
    tournament.contract_status = "PENDING"

    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)

    use_contract = os.getenv("USE_CONTRACT", "true").lower() == "true"

    if use_contract:
        try:
            contract_id = await contract_service.create_tournament_on_contract(
                agent_count=len(agents)
            )
            tournament.contract_tournament_id = contract_id
            tournament.contract_status = "ACTIVE"
            await session.commit()
            await session.refresh(tournament)
        except ContractTransactionError as e:
            tournament.contract_status = "FAILED"
            await session.commit()
            raise HTTPException(
                status_code=500,
                detail=f"Contract creation failed: {e}",
            )

    return tournament

@router.put("/{tournament_id}", response_model=TournamentResponse)
async def update_tournament(
    tournament_id: UUID,
    tournament_data: TournamentUpdate,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
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
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")

    await session.delete(tournament)
    await session.commit()

    return {"message": f"Tournament {tournament_id} deleted successfully"}

# Settlement logic
async def determine_winner(tournament_id: UUID) -> UUID:
    raise NotImplementedError("determine_winner logic not implemented yet")

@router.post("/{tournament_id}/settle", response_model=TournamentResponse)
async def settle_tournament(
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    tournament = await session.get(Tournament, tournament_id)
    if not tournament or not tournament.contract_tournament_id:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if tournament.contract_status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Tournament not active")

    try:
        await contract_service.close_betting(tournament.contract_tournament_id)
    except ContractTransactionError as e:
        raise HTTPException(status_code=500, detail=f"Close betting failed: {e}")

    winner_uuid = await determine_winner(tournament_id)
    if not tournament.agent_contract_mapping:
        raise HTTPException(status_code=500, detail="Agent contract mapping missing")

    try:
        winner_contract_id = tournament.agent_contract_mapping[str(winner_uuid)]
    except KeyError:
        raise HTTPException(
            status_code=500,
            detail="Winner not found in agent_contract_mapping",
        )

    try:
        await contract_service.settle_tournament(
            tournament.contract_tournament_id,
            winner_contract_id,
        )

        tournament.winner_agent_id = winner_uuid
        tournament.contract_status = "COMPLETED"
        await session.commit()
        await session.refresh(tournament)
        return tournament
    except ContractTransactionError as e:
        raise HTTPException(status_code=500, detail=f"Settlement failed: {e}")

@router.post("/{tournament_id}/cancel", response_model=TournamentResponse)
async def cancel_tournament(
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    tournament = await session.get(Tournament, tournament_id)
    if not tournament or not tournament.contract_tournament_id:
        raise HTTPException(status_code=404, detail="Tournament not found")

    try:
        await contract_service.cancel_tournament(tournament.contract_tournament_id)
    except ContractTransactionError as e:
        raise HTTPException(status_code=500, detail=f"Cancel failed: {e}")

    tournament.contract_status = "CANCELLED"
    await session.commit()
    await session.refresh(tournament)

    return tournament
