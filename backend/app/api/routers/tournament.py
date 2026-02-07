import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.db.database import get_db
from app.db.models import Tournament, AgentState, Agent
from app.schemas.tournament import (
    TournamentCreate,
    TournamentUpdate,
    TournamentResponse,
    TournamentContractLink,
    TournamentOnchainCreate,
    TournamentOnchainSettle,
)
from app.schemas.agent_state import AgentStateResponse
from app.api.deps import require_admin
from app.agents.scheduler import (
    run_agent_decision,
    _initialize_tournament_agents_async,
)
from app.onchain.agonus_betting import get_agonus_client

logger = logging.getLogger(__name__)


def _extract_revert_reason(exc: Exception) -> str | None:
    """Extract a human-readable revert reason from a web3 exception."""
    msg = str(exc)
    # web3 ContractLogicError includes the revert reason string
    if "execution reverted" in msg.lower():
        return msg
    # Some providers include the reason in a nested dict
    if hasattr(exc, "args") and exc.args:
        for arg in exc.args:
            if isinstance(arg, dict) and "message" in arg:
                return arg["message"]
    return None


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


@router.post(
    "/{tournament_id}/onchain/create",
    response_model=TournamentContractLink,
    status_code=201,
)
async def create_onchain_tournament(
    tournament_id: UUID,
    payload: TournamentOnchainCreate,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Create tournament on-chain and link it to DB record."""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")

    if tournament.contract_tournament_id is not None:
        raise HTTPException(status_code=400, detail="Tournament already linked on-chain")

    if len(payload.agent_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 agents required")

    try:
        client = get_agonus_client()
        result = client.create_tournament(agent_count=len(payload.agent_ids))
    except (ValueError, ConnectionError) as e:
        raise HTTPException(status_code=400, detail=f"Configuration error: {e}")
    except Exception as e:
        logger.exception("On-chain create failed")
        detail = _extract_revert_reason(e) or str(e)
        raise HTTPException(status_code=400, detail=f"On-chain create failed: {detail}")

    # Sort agent IDs deterministically so the mapping is always the same
    sorted_ids = sorted(str(aid) for aid in payload.agent_ids)
    mapping = {agent_id: idx + 1 for idx, agent_id in enumerate(sorted_ids)}
    tournament.contract_tournament_id = result.contract_tournament_id
    tournament.agent_contract_mapping = mapping

    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)

    return TournamentContractLink(
        contract_tournament_id=result.contract_tournament_id or 0,
        tx_hash=result.tx_hash,
    )


@router.post("/{tournament_id}/start")
async def start_tournament(
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Start tournament — initializes agent states via background task."""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")
    if not tournament.agent_contract_mapping:
        raise HTTPException(status_code=400, detail="No agents mapped. Link on-chain first.")

    agent_uuids = list(tournament.agent_contract_mapping.keys())
    await _initialize_tournament_agents_async(
        tournament_id, [UUID(u) for u in agent_uuids]
    )

    # Update agent stats: increment total_tournaments
    for uid in agent_uuids:
        agent = await session.get(Agent, UUID(uid))
        if agent:
            stats = dict(agent.stats or {})
            stats["total_tournaments"] = stats.get("total_tournaments", 0) + 1
            agent.stats = stats
            session.add(agent)

    tournament.status = "live"
    session.add(tournament)
    await session.commit()

    return {"message": "Tournament started", "agents_count": len(agent_uuids)}


@router.post("/{tournament_id}/onchain/close")
async def close_onchain_betting(
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Close betting on-chain."""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")
    if tournament.contract_tournament_id is None:
        raise HTTPException(status_code=400, detail="Tournament not linked on-chain")
    if tournament.status == "completed":
        raise HTTPException(status_code=400, detail="Tournament already completed or cancelled")
    if tournament.betting_closed:
        raise HTTPException(status_code=400, detail="Betting already closed")
    if tournament.winner_agent_id is not None:
        raise HTTPException(status_code=400, detail="Tournament already settled")

    try:
        client = get_agonus_client()
        result = client.close_betting(tournament.contract_tournament_id)
    except (ValueError, ConnectionError) as e:
        raise HTTPException(status_code=400, detail=f"Configuration error: {e}")
    except Exception as e:
        logger.exception("On-chain close failed")
        detail = _extract_revert_reason(e) or str(e)
        raise HTTPException(status_code=400, detail=f"On-chain close failed: {detail}")

    tournament.betting_closed = True
    session.add(tournament)
    await session.commit()

    return {"tx_hash": result.tx_hash}


@router.post("/{tournament_id}/onchain/settle")
async def settle_onchain_tournament(
    tournament_id: UUID,
    payload: TournamentOnchainSettle,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Settle tournament on-chain using winner agent mapping."""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")
    if tournament.contract_tournament_id is None:
        raise HTTPException(status_code=400, detail="Tournament not linked on-chain")
    if not tournament.betting_closed:
        raise HTTPException(status_code=400, detail="Must close betting before settling")
    if tournament.winner_agent_id is not None:
        raise HTTPException(status_code=400, detail="Tournament already settled")

    contract_agent_id = tournament.agent_contract_mapping.get(str(payload.winner_agent_id))
    if not contract_agent_id:
        raise HTTPException(status_code=400, detail="Winner agent not mapped on-chain")

    try:
        client = get_agonus_client()
        result = client.settle_tournament(
            tournament.contract_tournament_id, contract_agent_id
        )
    except (ValueError, ConnectionError) as e:
        raise HTTPException(status_code=400, detail=f"Configuration error: {e}")
    except Exception as e:
        logger.exception("On-chain settle failed")
        detail = _extract_revert_reason(e) or str(e)
        raise HTTPException(status_code=400, detail=f"On-chain settle failed: {detail}")

    tournament.winner_agent_id = payload.winner_agent_id
    tournament.status = "completed"
    session.add(tournament)

    # Update agent stats: increment wins for winner, recalculate win_rate for all
    for uid in (tournament.agent_contract_mapping or {}).keys():
        agent = await session.get(Agent, UUID(uid))
        if not agent:
            continue
        stats = dict(agent.stats or {})
        if UUID(uid) == payload.winner_agent_id:
            stats["wins"] = stats.get("wins", 0) + 1
        total = stats.get("total_tournaments", 0)
        wins = stats.get("wins", 0)
        stats["win_rate"] = wins / total if total > 0 else 0
        agent.stats = stats
        session.add(agent)

    await session.commit()

    return {"tx_hash": result.tx_hash}


@router.post("/{tournament_id}/onchain/cancel")
async def cancel_onchain_tournament(
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Cancel tournament on-chain."""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament Not Found")
    if tournament.contract_tournament_id is None:
        raise HTTPException(status_code=400, detail="Tournament not linked on-chain")
    if tournament.winner_agent_id is not None:
        raise HTTPException(status_code=400, detail="Tournament already settled, cannot cancel")

    try:
        client = get_agonus_client()
        result = client.cancel_tournament(tournament.contract_tournament_id)
    except (ValueError, ConnectionError) as e:
        raise HTTPException(status_code=400, detail=f"Configuration error: {e}")
    except Exception as e:
        logger.exception("On-chain cancel failed")
        detail = _extract_revert_reason(e) or str(e)
        raise HTTPException(status_code=400, detail=f"On-chain cancel failed: {detail}")

    tournament.status = "completed"
    tournament.betting_closed = True
    session.add(tournament)
    await session.commit()

    return {"tx_hash": result.tx_hash}


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
