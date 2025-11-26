from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from backend.app.db.database import get_db
from backend.app.db.models import Trade
from backend.app.schemas.trade import TradeCreate, TradeResponse

router = APIRouter()


@router.get("/recent", response_model=list[TradeResponse])
async def get_recent_trades(
    limit: int = Query(20, ge=1, le=100, description="Number of recent trades to return"),
    session: AsyncSession = Depends(get_db),
):
    """GET route for recent trades across all tournaments - for live feed"""
    statement = select(Trade).order_by(Trade.timestamp.desc()).limit(limit)
    result = await session.execute(statement)
    trades = result.scalars().all()
    return trades


@router.get("/", response_model=list[TradeResponse])
async def list_trades_for_tournament(
    tournament_id: UUID | None = Query(
        None, description="Filter trades by tournament ID"
    ),
    session: AsyncSession = Depends(get_db),
):
    """GET route for listing all trades, optionally filtered by tournament_id"""
    statement = select(Trade)
    if tournament_id is not None:
        statement = statement.where(Trade.tournament_id == tournament_id)

    result = await session.execute(statement)
    trades = result.scalars().all()
    return trades


@router.get("/agent/{agent_id}", response_model=list[TradeResponse])
async def list_trades_by_agent(agent_id: UUID, session: AsyncSession = Depends(get_db)):
    """GET route for listing all trades for a specific agent_id"""
    statement = select(Trade).where(Trade.agent_id == agent_id)
    result = await session.execute(statement)
    trades = result.scalars().all()
    return trades


@router.get(
    "/tournament/{tournament_id}/agent/{agent_id}", response_model=list[TradeResponse]
)
async def list_trades_by_agent_and_tournament(
    tournament_id: UUID, agent_id: UUID, session: AsyncSession = Depends(get_db)
):
    """GET route for listing all trades for a specific agent in a specific tournament"""
    statement = select(Trade).where(
        Trade.tournament_id == tournament_id, Trade.agent_id == agent_id
    )
    result = await session.execute(statement)
    trades = result.scalars().all()
    return trades


@router.post("/", response_model=TradeResponse, status_code=201)
async def create_trade(
    trade_data: TradeCreate, session: AsyncSession = Depends(get_db)
):
    """POST route for creating a new trade"""
    # Create Trade model from schema
    trade = Trade(**trade_data.model_dump())

    session.add(trade)
    await session.commit()
    await session.refresh(trade)
    return trade

