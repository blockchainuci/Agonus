from fastapi import APIRouter, Depends, HTTPException
from datetime import timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ...db.database import get_db
from ...db.models import Bet
from ...schemas.bet import BetCreate, BetUpdate, BetResponse
from ..deps import get_current_user

router = APIRouter()


@router.get("/", response_model=list[BetResponse])
async def list_bets(session: AsyncSession = Depends(get_db)):
    """GET route for list of all bets"""
    statement = select(Bet)
    result = await session.execute(statement)
    bets = result.scalars().all()
    return bets


# IMPORTANT: This route must come BEFORE /{bet_id}
@router.get("/my-bets", response_model=list[BetResponse])
async def get_user_bets(
    session: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """GET route for current user's bets"""
    statement = select(Bet).where(Bet.user_address == user["address"])
    result = await session.execute(statement)
    bets = result.scalars().all()
    return bets


@router.get("/{bet_id}", response_model=BetResponse)
async def get_bet(bet_id: UUID, session: AsyncSession = Depends(get_db)):
    """GET route for bet by bet_id"""
    bet = await session.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet Not Found")
    return bet


@router.post("/", response_model=BetResponse, status_code=201)
async def create_bet(
    bet_data: BetCreate,
    session: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """POST route for creating a new bet"""
    bet_dict = bet_data.model_dump(exclude_unset=True)
    bet_dict["user_address"] = user["address"]  # Force bet ownership

    # Remove fields not in the database model
    bet_dict.pop("tx_hash", None)
    # Store naive UTC if DB column is TIMESTAMP WITHOUT TIME ZONE
    if "placed_at" in bet_dict and bet_dict["placed_at"] is not None:
        bet_dict["placed_at"] = bet_dict["placed_at"].replace(tzinfo=None)

    bet = Bet(**bet_dict)

    session.add(bet)
    await session.commit()
    await session.refresh(bet)
    return bet


@router.patch("/{bet_id}/settle", response_model=BetResponse)
async def settle_bet(
    bet_id: UUID,
    payout: float,
    session: AsyncSession = Depends(get_db),
):
    """PATCH route for settling a bet"""
    bet = await session.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet Not Found")

    if bet.settled:
        raise HTTPException(status_code=400, detail="Bet already settled")

    bet.settled = True
    bet.payout = payout

    session.add(bet)
    await session.commit()
    await session.refresh(bet)
    return bet


@router.put("/{bet_id}", response_model=BetResponse)
async def update_bet(
    bet_id: UUID,
    bet_data: BetUpdate,
    session: AsyncSession = Depends(get_db),
):
    """PUT route for updating a bet"""
    db_bet = await session.get(Bet, bet_id)
    if not db_bet:
        raise HTTPException(status_code=404, detail="Bet Not Found")

    update_data = bet_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_bet, key, value)

    session.add(db_bet)
    await session.commit()
    await session.refresh(db_bet)
    return db_bet


@router.delete("/{bet_id}")
async def delete_bet(bet_id: UUID, session: AsyncSession = Depends(get_db)):
    """DELETE route for deleting a bet"""
    bet = await session.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet Not Found")

    await session.delete(bet)
    await session.commit()

    return {"message": f"Bet {bet_id} deleted successfully"}
