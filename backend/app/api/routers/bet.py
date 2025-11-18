from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from backend.app.db.database import get_db
from backend.app.db.models import Bet
from backend.app.schemas.bet import BetCreate, BetUpdate, BetResponse
from backend.app.api.deps import get_current_user

router = APIRouter()


@router.get("/", response_model=list[BetResponse])
async def list_bets(session: AsyncSession = Depends(get_db)):
    """GET route for list of all bets"""
    statement = select(Bet)
    result = await session.execute(statement)
    bets = result.scalars().all()
    return bets


# IMPORTANT: This route must come BEFORE /{bet_id} to avoid path conflicts
@router.get("/my-bets", response_model=list[BetResponse])
async def get_user_bets(
    session: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)
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
    # Override user_address with authenticated user's address
    bet_dict = bet_data.model_dump()
    bet_dict["user_address"] = user[
        "address"
    ]  # Ensure user can only bet for themselves

    bet = Bet(**bet_dict)

    session.add(bet)
    await session.commit()
    await session.refresh(bet)
    return bet


@router.patch("/{bet_id}/settle", response_model=BetResponse)
async def settle_bet(
    bet_id: UUID, payout: float, session: AsyncSession = Depends(get_db)
):
    """PATCH route for settling a bet (admin/system use)"""
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
    bet_id: UUID, bet_data: BetUpdate, session: AsyncSession = Depends(get_db)
):
    """PUT route for updating a bet (typically only for settling)"""
    db_bet = await session.get(Bet, bet_id)
    if not db_bet:
        raise HTTPException(status_code=404, detail="Bet Not Found")

    # Update only provided fields
    update_data = bet_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_bet, key, value)

    session.add(db_bet)
    await session.commit()
    await session.refresh(db_bet)

    return db_bet


@router.delete("/{bet_id}")
async def delete_bet(bet_id: UUID, session: AsyncSession = Depends(get_db)):
    """DELETE route for deleting a bet (use with caution - breaks audit trail)"""
    bet = await session.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet Not Found")

    await session.delete(bet)
    await session.commit()

    return {"message": f"Bet {bet_id} deleted successfully"}
