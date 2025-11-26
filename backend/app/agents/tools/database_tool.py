"""
DatabaseTool for persisting agent state, trades, and memory to PostgreSQL.

This tool enables crash recovery and real-time data streaming to the frontend
by saving all agent context to the database.
"""

import logging
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert

from ...db.models import Agent, AgentState, Trade, Tournament, ActionEnum
from ..data_classes import Trade as TradeData, Portfolio

logger = logging.getLogger(__name__)


class DatabaseTool:
    """
    Tool for persisting agent data to PostgreSQL.

    Handles:
    - Saving trades to database
    - Saving/updating agent state (portfolio, metrics)
    - Loading agent state for crash recovery
    - Updating agent memory
    """

    def __init__(self, db_session: AsyncSession):
        """
        Initialize DatabaseTool.

        Args:
            db_session: Async SQLAlchemy session
        """
        self.session = db_session
        logger.info("DatabaseTool initialized")

    async def save_trade(
        self, trade: TradeData, agent_uuid: UUID, tournament_uuid: UUID
    ) -> UUID:
        """
        Save a trade to the database.

        Args:
            trade: Trade dataclass object
            agent_uuid: Agent UUID from database
            tournament_uuid: Tournament UUID from database

        Returns:
            UUID of saved trade
        """
        try:
            # Map action to enum
            action_map = {
                "BUY": ActionEnum.buy,
                "SELL": ActionEnum.sell,
                "HOLD": ActionEnum.hold,
            }
            action = action_map.get(trade.action.upper(), ActionEnum.hold)

            # Create trade record
            db_trade = Trade(
                agent_id=agent_uuid,
                tournament_id=tournament_uuid,
                action=action,
                asset=trade.token,
                amount=Decimal(str(trade.qty)),
                price=Decimal(str(trade.price)),
                timestamp=trade.timestamp,
            )

            self.session.add(db_trade)
            await self.session.commit()
            await self.session.refresh(db_trade)

            logger.info(
                f"Trade saved to DB: id={db_trade.id}, "
                f"{trade.action} {trade.qty} {trade.token} @ ${trade.price}"
            )

            return db_trade.id

        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to save trade: {e}")
            raise

    async def save_agent_state(
        self,
        agent_uuid: UUID,
        tournament_uuid: UUID,
        portfolio: Portfolio,
        rank: int = 0,
        last_decision: str = "",
    ) -> None:
        """
        Save or update agent state for a tournament.

        Uses UPSERT (INSERT ... ON CONFLICT UPDATE) for atomic updates.

        Args:
            agent_uuid: Agent UUID
            tournament_uuid: Tournament UUID
            portfolio: Portfolio object with current state
            rank: Current tournament rank
            last_decision: Last decision made by agent
        """
        try:
            # Convert portfolio to dict for JSON storage
            portfolio_dict = {
                "cash": float(portfolio.cash),
                "holdings": {k: float(v) for k, v in portfolio.holdings.items()},
                "holdings_val": float(portfolio.holdings_val),
                "total_value": float(portfolio.total_value),
                "realized_pnl": float(portfolio.realized_pnl),
                "unrealized_pnl": float(portfolio.unrealized_pnl),
                "roi": float(portfolio.roi),
                "num_trades": portfolio.num_trades,
                "num_winning_trades": portfolio.num_winning_trades,
                "num_losing_trades": portfolio.num_losing_trades,
                "win_rate": float(portfolio.win_rate),
            }

            # UPSERT statement
            stmt = (
                insert(AgentState)
                .values(
                    agent_id=agent_uuid,
                    tournament_id=tournament_uuid,
                    portfolio=portfolio_dict,
                    portfolio_value_usd=Decimal(str(portfolio.total_value)),
                    rank=rank,
                    trades_count=portfolio.num_trades,
                    last_decision=last_decision,
                    updated_at=datetime.now(timezone.utc),
                )
                .on_conflict_do_update(
                    index_elements=["agent_id", "tournament_id"],
                    set_={
                        "portfolio": portfolio_dict,
                        "portfolio_value_usd": Decimal(str(portfolio.total_value)),
                        "rank": rank,
                        "trades_count": portfolio.num_trades,
                        "last_decision": last_decision,
                        "updated_at": datetime.now(timezone.utc),
                    },
                )
            )

            await self.session.execute(stmt)
            await self.session.commit()

            logger.info(
                f"Agent state saved: agent={agent_uuid}, "
                f"tournament={tournament_uuid}, "
                f"value=${portfolio.total_value:.2f}, "
                f"trades={portfolio.num_trades}"
            )

        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to save agent state: {e}")
            raise

    async def load_agent_state(
        self, agent_uuid: UUID, tournament_uuid: UUID
    ) -> Optional[Dict[str, Any]]:
        """
        Load agent state from database for crash recovery.

        Args:
            agent_uuid: Agent UUID
            tournament_uuid: Tournament UUID

        Returns:
            Dict with portfolio and state info, or None if not found
        """
        try:
            stmt = select(AgentState).where(
                AgentState.agent_id == agent_uuid,
                AgentState.tournament_id == tournament_uuid,
            )

            result = await self.session.execute(stmt)
            agent_state = result.scalar_one_or_none()

            if not agent_state:
                logger.warning(
                    f"No saved state found for agent={agent_uuid}, "
                    f"tournament={tournament_uuid}"
                )
                return None

            state_dict = {
                "portfolio": agent_state.portfolio,
                "portfolio_value_usd": float(agent_state.portfolio_value_usd),
                "rank": agent_state.rank,
                "trades_count": agent_state.trades_count,
                "last_decision": agent_state.last_decision,
                "updated_at": agent_state.updated_at,
            }

            logger.info(
                f"Agent state loaded: agent={agent_uuid}, "
                f"tournament={tournament_uuid}, "
                f"value=${state_dict['portfolio_value_usd']:.2f}"
            )

            return state_dict

        except Exception as e:
            logger.error(f"Failed to load agent state: {e}")
            raise

    async def load_agent_trades(
        self, agent_uuid: UUID, tournament_uuid: UUID, limit: Optional[int] = None
    ) -> List[TradeData]:
        """
        Load agent's trade history from database.

        Args:
            agent_uuid: Agent UUID
            tournament_uuid: Tournament UUID
            limit: Max number of trades to load (most recent first)

        Returns:
            List of Trade dataclass objects
        """
        try:
            stmt = (
                select(Trade)
                .where(
                    Trade.agent_id == agent_uuid, Trade.tournament_id == tournament_uuid
                )
                .order_by(Trade.timestamp.desc())
            )

            if limit:
                stmt = stmt.limit(limit)

            result = await self.session.execute(stmt)
            db_trades = result.scalars().all()

            # Convert to TradeData objects
            trades = []
            for db_trade in db_trades:
                # Generate a trade_id from timestamp
                trade_id = int(db_trade.timestamp.timestamp() * 1000)

                trade = TradeData(
                    trade_id=trade_id,
                    token=db_trade.asset,
                    agent_id=str(agent_uuid),  # Convert UUID to string for agent_id
                    action=db_trade.action.value.upper(),
                    qty=float(db_trade.amount),
                    price=float(db_trade.price),
                    confidence=0.5,  # Default confidence (not stored in DB)
                    summary="",  # Summary not stored in DB
                    timestamp=db_trade.timestamp,
                    tx_hash=None,  # TX hash not in current DB schema
                    realized_pnl=None,
                    roi=None,
                )
                trades.append(trade)

            logger.info(
                f"Loaded {len(trades)} trades for agent={agent_uuid}, "
                f"tournament={tournament_uuid}"
            )

            return trades

        except Exception as e:
            logger.error(f"Failed to load agent trades: {e}")
            raise

    async def update_agent_memory(
        self, agent_uuid: UUID, memory_dict: Dict[str, Any]
    ) -> None:
        """
        Update agent's memory field in database.

        Args:
            agent_uuid: Agent UUID
            memory_dict: Dictionary to store in Agent.memory JSON field
        """
        try:
            stmt = (
                update(Agent).where(Agent.id == agent_uuid).values(memory=memory_dict)
            )

            await self.session.execute(stmt)
            await self.session.commit()

            logger.info(f"Agent memory updated: agent={agent_uuid}")

        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to update agent memory: {e}")
            raise

    async def update_agent_stats(
        self, agent_uuid: UUID, stats_dict: Dict[str, Any]
    ) -> None:
        """
        Update agent's stats field in database.

        Args:
            agent_uuid: Agent UUID
            stats_dict: Dictionary to store in Agent.stats JSON field
        """
        try:
            stmt = update(Agent).where(Agent.id == agent_uuid).values(stats=stats_dict)

            await self.session.execute(stmt)
            await self.session.commit()

            logger.info(f"Agent stats updated: agent={agent_uuid}")

        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to update agent stats: {e}")
            raise

    async def get_agent_by_name(self, agent_name: str) -> Optional[Agent]:
        """
        Get agent by name (for mapping agent_id string to UUID).

        Args:
            agent_name: Agent name/identifier

        Returns:
            Agent model or None
        """
        try:
            stmt = select(Agent).where(Agent.name == agent_name)
            result = await self.session.execute(stmt)
            agent = result.scalar_one_or_none()

            if agent:
                logger.debug(f"Found agent: name={agent_name}, uuid={agent.id}")
            else:
                logger.warning(f"Agent not found: name={agent_name}")

            return agent

        except Exception as e:
            logger.error(f"Failed to get agent by name: {e}")
            raise

    async def create_agent_if_not_exists(
        self,
        agent_name: str,
        personality: str,
        strategy_type: str = "langchain_react",
        avatar_url: Optional[str] = None,
    ) -> Agent:
        """
        Create agent in database if it doesn't exist.

        Args:
            agent_name: Agent name/identifier
            personality: Agent personality
            strategy_type: Strategy type
            avatar_url: Optional avatar URL

        Returns:
            Agent model (existing or newly created)
        """
        try:
            # Check if exists
            agent = await self.get_agent_by_name(agent_name)
            if agent:
                return agent

            # Create new agent
            agent = Agent(
                name=agent_name,
                personality=personality,
                strategy_type=strategy_type,
                avatar_url=avatar_url,
                stats={},
                memory={},
            )

            self.session.add(agent)
            await self.session.commit()
            await self.session.refresh(agent)

            logger.info(f"Created new agent: name={agent_name}, uuid={agent.id}")
            return agent

        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to create agent: {e}")
            raise
