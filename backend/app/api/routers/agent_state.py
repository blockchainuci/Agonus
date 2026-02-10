"""
Agent State API Router

Provides endpoints for accessing agent performance data in tournaments.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional

from ...db.database import get_db
from ...db.models import Agent, AgentState, Tournament, Trade, StatusEnum
from ...schemas.agent_state import AgentStateResponse

router = APIRouter()


# ============================================================================
# RESPONSE MODELS (extended)
# ============================================================================

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import Any


class AgentInfo(BaseModel):
    """Basic agent info for embedding in responses."""
    id: UUID
    name: str
    personality: str
    strategy_type: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TournamentInfo(BaseModel):
    """Basic tournament info for embedding in responses."""
    id: UUID
    name: str
    status: str
    start_date: datetime
    end_date: datetime
    prize_pool: Decimal

    model_config = ConfigDict(from_attributes=True)


class PortfolioDetails(BaseModel):
    """Detailed portfolio breakdown."""
    cash: float
    holdings: dict[str, float]  # token -> quantity
    holdings_value: float
    total_value: float
    starting_value: float
    realized_pnl: float
    unrealized_pnl: float
    roi_percent: float
    num_trades: int
    num_winning_trades: int
    num_losing_trades: int
    win_rate_percent: float

    model_config = ConfigDict(from_attributes=True)


class AgentStateWithDetails(BaseModel):
    """Agent state with agent and tournament details."""
    agent_id: UUID
    tournament_id: UUID
    portfolio: PortfolioDetails
    portfolio_value_usd: Decimal
    rank: int
    trades_count: int
    last_decision: str
    updated_at: datetime
    agent: AgentInfo
    tournament: Optional[TournamentInfo] = None

    model_config = ConfigDict(from_attributes=True)


class LeaderboardEntry(BaseModel):
    """Leaderboard entry for a tournament."""
    rank: int
    agent_id: UUID
    agent_name: str
    agent_personality: str
    agent_strategy: str
    agent_avatar: Optional[str]
    portfolio_value_usd: Decimal
    portfolio: PortfolioDetails
    trades_count: int
    last_decision: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TradeHistoryEntry(BaseModel):
    """Trade entry for history."""
    id: UUID
    action: str
    asset: str
    amount: Decimal
    price: Decimal
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def build_portfolio_details(portfolio: dict, portfolio_value_usd: float) -> PortfolioDetails:
    """Build a PortfolioDetails object from raw portfolio dict."""
    starting_val = portfolio.get("starting_val", 500.0)
    total_value = portfolio.get("total_value", portfolio_value_usd)
    roi_percent = ((total_value - starting_val) / starting_val) * 100 if starting_val > 0 else 0

    return PortfolioDetails(
        cash=portfolio.get("cash", 0.0),
        holdings=portfolio.get("holdings", {}),
        holdings_value=portfolio.get("holdings_val", 0.0),
        total_value=total_value,
        starting_value=starting_val,
        realized_pnl=portfolio.get("realized_pnl", 0.0),
        unrealized_pnl=portfolio.get("unrealized_pnl", 0.0),
        roi_percent=round(roi_percent, 2),
        num_trades=portfolio.get("num_trades", 0),
        num_winning_trades=portfolio.get("num_winning_trades", 0),
        num_losing_trades=portfolio.get("num_losing_trades", 0),
        win_rate_percent=round(portfolio.get("win_rate", 0.0) * 100, 2),
    )


# ============================================================================
# ENDPOINTS
# ============================================================================


@router.get("/", response_model=list[AgentStateResponse])
async def list_agent_states(
    tournament_id: Optional[UUID] = Query(None, description="Filter by tournament"),
    agent_id: Optional[UUID] = Query(None, description="Filter by agent"),
    session: AsyncSession = Depends(get_db),
):
    """
    List all agent states, optionally filtered by tournament or agent.
    """
    stmt = select(AgentState)

    if tournament_id:
        stmt = stmt.where(AgentState.tournament_id == tournament_id)
    if agent_id:
        stmt = stmt.where(AgentState.agent_id == agent_id)

    stmt = stmt.order_by(AgentState.rank)

    result = await session.execute(stmt)
    states = result.scalars().all()
    return states


@router.get("/leaderboard/{tournament_id}", response_model=list[LeaderboardEntry])
async def get_tournament_leaderboard(
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    """
    Get the leaderboard for a specific tournament.

    Returns agents ranked by portfolio value with performance metrics.
    """
    # Verify tournament exists
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    # Get all agent states for this tournament, ordered by rank
    stmt = (
        select(AgentState, Agent)
        .join(Agent, AgentState.agent_id == Agent.id)
        .where(AgentState.tournament_id == tournament_id)
        .order_by(AgentState.rank)
    )

    result = await session.execute(stmt)
    rows = result.all()

    leaderboard = []
    for agent_state, agent in rows:
        # Extract portfolio data
        portfolio = agent_state.portfolio or {}
        starting_val = portfolio.get("starting_val", 500.0)
        total_value = float(agent_state.portfolio_value_usd)
        roi_percent = ((total_value - starting_val) / starting_val) * 100 if starting_val > 0 else 0

        # Build portfolio details
        portfolio_details = PortfolioDetails(
            cash=portfolio.get("cash", 0.0),
            holdings=portfolio.get("holdings", {}),
            holdings_value=portfolio.get("holdings_val", 0.0),
            total_value=portfolio.get("total_value", total_value),
            starting_value=starting_val,
            realized_pnl=portfolio.get("realized_pnl", 0.0),
            unrealized_pnl=portfolio.get("unrealized_pnl", 0.0),
            roi_percent=round(roi_percent, 2),
            num_trades=portfolio.get("num_trades", agent_state.trades_count),
            num_winning_trades=portfolio.get("num_winning_trades", 0),
            num_losing_trades=portfolio.get("num_losing_trades", 0),
            win_rate_percent=round(portfolio.get("win_rate", 0.0) * 100, 2),
        )

        leaderboard.append(LeaderboardEntry(
            rank=agent_state.rank,
            agent_id=agent.id,
            agent_name=agent.name,
            agent_personality=agent.personality,
            agent_strategy=agent.strategy_type,
            agent_avatar=agent.avatar_url,
            portfolio_value_usd=agent_state.portfolio_value_usd,
            portfolio=portfolio_details,
            trades_count=agent_state.trades_count,
            last_decision=agent_state.last_decision or "",
            updated_at=agent_state.updated_at,
        ))

    return leaderboard


@router.get("/agent/{agent_id}", response_model=list[AgentStateWithDetails])
async def get_agent_all_states(
    agent_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    """
    Get all tournament states for a specific agent.

    Returns the agent's performance across all tournaments.
    """
    # Verify agent exists
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Get all states for this agent
    stmt = (
        select(AgentState, Tournament)
        .join(Tournament, AgentState.tournament_id == Tournament.id)
        .where(AgentState.agent_id == agent_id)
        .order_by(Tournament.start_date.desc())
    )

    result = await session.execute(stmt)
    rows = result.all()

    states = []
    for agent_state, tournament in rows:
        portfolio = agent_state.portfolio or {}
        states.append(AgentStateWithDetails(
            agent_id=agent_state.agent_id,
            tournament_id=agent_state.tournament_id,
            portfolio=build_portfolio_details(portfolio, float(agent_state.portfolio_value_usd)),
            portfolio_value_usd=agent_state.portfolio_value_usd,
            rank=agent_state.rank,
            trades_count=agent_state.trades_count,
            last_decision=agent_state.last_decision or "",
            updated_at=agent_state.updated_at,
            agent=AgentInfo(
                id=agent.id,
                name=agent.name,
                personality=agent.personality,
                strategy_type=agent.strategy_type,
                avatar_url=agent.avatar_url,
            ),
            tournament=TournamentInfo(
                id=tournament.id,
                name=tournament.name,
                status=tournament.status.value,
                start_date=tournament.start_date,
                end_date=tournament.end_date,
                prize_pool=tournament.prize_pool,
            ),
        ))

    return states


@router.get("/agent/{agent_id}/tournament/{tournament_id}", response_model=AgentStateWithDetails)
async def get_agent_tournament_state(
    agent_id: UUID,
    tournament_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    """
    Get a specific agent's state in a specific tournament.
    """
    # Get agent
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Get tournament
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    # Get agent state
    stmt = select(AgentState).where(
        AgentState.agent_id == agent_id,
        AgentState.tournament_id == tournament_id,
    )
    result = await session.execute(stmt)
    agent_state = result.scalar_one_or_none()

    if not agent_state:
        raise HTTPException(status_code=404, detail="Agent not enrolled in this tournament")

    portfolio = agent_state.portfolio or {}
    return AgentStateWithDetails(
        agent_id=agent_state.agent_id,
        tournament_id=agent_state.tournament_id,
        portfolio=build_portfolio_details(portfolio, float(agent_state.portfolio_value_usd)),
        portfolio_value_usd=agent_state.portfolio_value_usd,
        rank=agent_state.rank,
        trades_count=agent_state.trades_count,
        last_decision=agent_state.last_decision or "",
        updated_at=agent_state.updated_at,
        agent=AgentInfo(
            id=agent.id,
            name=agent.name,
            personality=agent.personality,
            strategy_type=agent.strategy_type,
            avatar_url=agent.avatar_url,
        ),
        tournament=TournamentInfo(
            id=tournament.id,
            name=tournament.name,
            status=tournament.status.value,
            start_date=tournament.start_date,
            end_date=tournament.end_date,
            prize_pool=tournament.prize_pool,
        ),
    )


@router.get("/agent/{agent_id}/tournament/{tournament_id}/trades", response_model=list[TradeHistoryEntry])
async def get_agent_tournament_trades(
    agent_id: UUID,
    tournament_id: UUID,
    limit: int = Query(50, ge=1, le=500, description="Max trades to return"),
    session: AsyncSession = Depends(get_db),
):
    """
    Get an agent's trade history for a specific tournament.
    """
    # Verify agent and tournament exist
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    # Get trades
    stmt = (
        select(Trade)
        .where(Trade.agent_id == agent_id, Trade.tournament_id == tournament_id)
        .order_by(Trade.timestamp.desc())
        .limit(limit)
    )

    result = await session.execute(stmt)
    trades = result.scalars().all()

    return [
        TradeHistoryEntry(
            id=trade.id,
            action=trade.action.value,
            asset=trade.asset,
            amount=trade.amount,
            price=trade.price,
            timestamp=trade.timestamp,
        )
        for trade in trades
    ]


@router.get("/live", response_model=list[AgentStateWithDetails])
async def get_live_agent_states(
    session: AsyncSession = Depends(get_db),
):
    """
    Get all agent states from currently live tournaments.

    Useful for dashboards showing real-time competition status.
    """
    # Get all live tournaments
    stmt = (
        select(AgentState, Agent, Tournament)
        .join(Agent, AgentState.agent_id == Agent.id)
        .join(Tournament, AgentState.tournament_id == Tournament.id)
        .where(Tournament.status == StatusEnum.live)
        .order_by(Tournament.id, AgentState.rank)
    )

    result = await session.execute(stmt)
    rows = result.all()

    states = []
    for agent_state, agent, tournament in rows:
        portfolio = agent_state.portfolio or {}
        states.append(AgentStateWithDetails(
            agent_id=agent_state.agent_id,
            tournament_id=agent_state.tournament_id,
            portfolio=build_portfolio_details(portfolio, float(agent_state.portfolio_value_usd)),
            portfolio_value_usd=agent_state.portfolio_value_usd,
            rank=agent_state.rank,
            trades_count=agent_state.trades_count,
            last_decision=agent_state.last_decision or "",
            updated_at=agent_state.updated_at,
            agent=AgentInfo(
                id=agent.id,
                name=agent.name,
                personality=agent.personality,
                strategy_type=agent.strategy_type,
                avatar_url=agent.avatar_url,
            ),
            tournament=TournamentInfo(
                id=tournament.id,
                name=tournament.name,
                status=tournament.status.value,
                start_date=tournament.start_date,
                end_date=tournament.end_date,
                prize_pool=tournament.prize_pool,
            ),
        ))

    return states
