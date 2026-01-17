"""
AgentMemory - Database-backed memory for AI trading agents.

This module manages agent memory using only database persistence.
No local/in-memory storage - all data goes to the database.
"""

import logging
from typing import List, Optional, Any, TYPE_CHECKING
from uuid import UUID

from .data_classes import Trade

if TYPE_CHECKING:
    from .tools.database_tool import DatabaseTool

logger = logging.getLogger(__name__)


class AgentMemory:
    """
    Database-backed memory for AI trading agents.

    All trade history and state is stored in PostgreSQL via DatabaseTool.
    No local/in-memory caching - database is the single source of truth.

    Attributes:
        agent_id: String agent identifier
        agent_uuid: UUID of agent in database
        tournament_uuid: UUID of tournament in database
        database_tool: DatabaseTool instance for persistence
    """

    def __init__(
        self,
        agent_id: str,
        agent_uuid: Optional[UUID] = None,
        tournament_uuid: Optional[UUID] = None,
        database_tool: Optional["DatabaseTool"] = None,
    ):
        """
        Initialize AgentMemory.

        Args:
            agent_id: String agent identifier (e.g., "agent_1")
            agent_uuid: UUID of agent in database (optional)
            tournament_uuid: UUID of tournament in database (optional)
            database_tool: DatabaseTool instance for persistence
        """
        self.agent_id = agent_id
        self.agent_uuid = agent_uuid
        self.tournament_uuid = tournament_uuid
        self.database_tool = database_tool

        logger.info(
            f"AgentMemory initialized: agent_id={agent_id}, "
            f"db_enabled={database_tool is not None}"
        )

    async def save_trade(self, trade: Trade) -> Optional[UUID]:
        """
        Save a trade to the database.

        Args:
            trade: Trade object to save

        Returns:
            UUID of saved trade, or None if save failed
        """
        if not self.database_tool or not self.agent_uuid or not self.tournament_uuid:
            logger.warning("Database not configured, trade not saved")
            return None

        try:
            trade_uuid = await self.database_tool.save_trade(
                trade=trade,
                agent_uuid=self.agent_uuid,
                tournament_uuid=self.tournament_uuid,
            )
            logger.info(f"Trade saved to database: {trade.action} {trade.token}")
            return trade_uuid

        except Exception as e:
            logger.error(f"Failed to save trade to database: {e}")
            return None

    async def get_trade_history(self, limit: Optional[int] = None) -> List[Trade]:
        """
        Retrieve trade history from database.

        Args:
            limit: Maximum number of trades to fetch (most recent first)

        Returns:
            List of Trade objects from database
        """
        if not self.database_tool or not self.agent_uuid or not self.tournament_uuid:
            logger.warning("Database not configured, returning empty history")
            return []

        try:
            trades = await self.database_tool.load_agent_trades(
                agent_uuid=self.agent_uuid,
                tournament_uuid=self.tournament_uuid,
                limit=limit,
            )
            logger.info(f"Loaded {len(trades)} trades from database")
            return trades

        except Exception as e:
            logger.error(f"Failed to load trade history: {e}")
            return []

    async def get_recent_trades(self, n: int = 10) -> List[Trade]:
        """
        Get the n most recent trades from database.

        Args:
            n: Number of recent trades to fetch

        Returns:
            List of recent Trade objects
        """
        return await self.get_trade_history(limit=n)

    async def save_state(
        self,
        portfolio: Any,
        rank: int = 0,
        last_decision: str = "",
    ) -> bool:
        """
        Save agent state to database.

        Args:
            portfolio: Portfolio object with current state
            rank: Current tournament rank
            last_decision: Last decision made by agent

        Returns:
            True if save successful, False otherwise
        """
        if not self.database_tool or not self.agent_uuid or not self.tournament_uuid:
            logger.warning("Database not configured, state not saved")
            return False

        try:
            await self.database_tool.save_agent_state(
                agent_uuid=self.agent_uuid,
                tournament_uuid=self.tournament_uuid,
                portfolio=portfolio,
                rank=rank,
                last_decision=last_decision,
            )
            logger.info(f"Agent state saved to database")
            return True

        except Exception as e:
            logger.error(f"Failed to save agent state: {e}")
            return False

    async def load_state(self) -> Optional[dict]:
        """
        Load agent state from database.

        Returns:
            Dict with portfolio and state info, or None if not found
        """
        if not self.database_tool or not self.agent_uuid or not self.tournament_uuid:
            logger.warning("Database not configured, cannot load state")
            return None

        try:
            state = await self.database_tool.load_agent_state(
                agent_uuid=self.agent_uuid,
                tournament_uuid=self.tournament_uuid,
            )
            if state:
                logger.info(f"Agent state loaded from database")
            return state

        except Exception as e:
            logger.error(f"Failed to load agent state: {e}")
            return None

    def is_configured(self) -> bool:
        """Check if database is properly configured."""
        return (
            self.database_tool is not None
            and self.agent_uuid is not None
            and self.tournament_uuid is not None
        )
