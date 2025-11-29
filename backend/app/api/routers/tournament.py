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
    """GET route for list of tournaments."""
    statement = select(Tournament)
    result = await session.execute(statement)
    tournaments = result.scalars().all()
    return tournaments


@router.get("/{tournament_id}", response_model=TournamentResponse)
async def get_tournament(
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    """GET route for tournament by tournament_id."""
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
    """
    Create tournament in DB AND on contract.

    Flow:
    - Validate agents exist.
    - Create tournament row with agent_contract_mapping.
    - Call create_tournament_on_contract.
    - Save contract_tournament_id and contract_status.
    """
    # 1. Validate agents exist
    agents = await validate_agents(session, tournament_data.agent_ids)

    # 2. Create tournament in DB
    tournament = Tournament(
        name=tournament_data.name,
        status=tournament_data.status,
        start_date=tournament_data.start_date,
        end_date=tournament_data.end_date,
        prize_pool=tournament_data.prize_pool,
    )

    # Map agent UUIDs to 1-based contract indices
    tournament.agent_contract_mapping = {
        str(agent.id): idx + 1 for idx, agent in enumerate(agents)
    }
    tournament.contract_status = "PENDING"

    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)

    # 3. Create on contract
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
    """PUT route for updating a tournament."""
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
    """DELETE route for deleting a tournament."""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")

    await session.delete(tournament)
    await session.commit()

    return {"message": f"Tournament {tournament_id} deleted successfully"}


# New settlement endpoint


async def determine_winner(tournament_id: UUID) -> UUID:
    """
    Placeholder for your winner-selection logic.

    Replace this with real AI / game logic that returns the winning agent UUID.
    """
    raise NotImplementedError("determine_winner logic not implemented yet")


@router.post("/{tournament_id}/settle", response_model=TournamentResponse)
async def settle_tournament(
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """
    Close betting, settle on contract, sync to DB.
    """
    tournament = await session.get(Tournament, tournament_id)
    if not tournament or not tournament.contract_tournament_id:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if tournament.contract_status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Tournament not active")

    # 1. Close betting on contract
    try:
        await contract_service.close_betting(tournament.contract_tournament_id)
    except ContractTransactionError as e:
        raise HTTPException(status_code=500, detail=f"Close betting failed: {e}")

    # 2. Determine winner (from your game logic/AI battles)
    winner_uuid = await determine_winner(tournament_id)

    # 3. Get winner's contract ID from mapping
    if not tournament.agent_contract_mapping:
        raise HTTPException(status_code=500, detail="Agent contract mapping missing")

    try:
        winner_contract_id = tournament.agent_contract_mapping[str(winner_uuid)]
    except KeyError:
        raise HTTPException(
            status_code=500,
            detail="Winner not found in agent_contract_mapping",
        )

    # 4. Settle on contract
    try:
        await contract_service.settle_tournament(
            tournament.contract_tournament_id,
            winner_contract_id,
        )

        # 5. Update DB
        tournament.winner_agent_id = winner_uuid
        tournament.contract_status = "COMPLETED"
        await session.commit()
        await session.refresh(tournament)

        return tournament
    except ContractTransactionError as e:
        raise HTTPException(status_code=500, detail=f"Settlement failed: {e}")


# Cancel endpoint


@router.post("/{tournament_id}/cancel", response_model=TournamentResponse)
async def cancel_tournament(
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """
    Cancel tournament on contract (enables refunds).
    """
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
