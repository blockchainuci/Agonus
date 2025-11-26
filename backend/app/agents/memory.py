from typing import List, Optional, Any
from uuid import UUID
from .data_classes import Trade


class AgentMemory:
    """
    Centralized memory module for an AI trading agent.

    The AgentMemory class manages all three memory systems:
        Short-term memory — In-memory list of Trade objects for the current tournament.
        Long-term memory — Persistent database of all trades and performance statistics across tournaments.
        Vector memory — Semantic recall system for embedding-based similarity search of significant trades.

    Attributes:
        agent_id : str
            Unique identifier for the agent.
        short_term : List[Trade]
            List of Trade objects representing all trades made in the current tournament.
        long_term_db : Any
            Handle to the Postgres database client or API wrapper for persistent storage.
        vector_db : Any
            Handle to the vector database client(Chromadb or Pinecone) for semantic recall.
        max_short_term : int 
            Max trades to keep in short-term before pruning
    """

    def __init__(
        self,
        agent_id: str,
        agent_uuid: Optional[UUID] = None,
        tournament_uuid: Optional[UUID] = None,
        database_tool: Optional[Any] = None,
        vector_db: Optional[Any] = None,
        max_short_term: int = 100
    ):
        """
        Initialize AgentMemory.

        Args:
            agent_id: String agent identifier (e.g., "agent_1")
            agent_uuid: UUID of agent in database (optional)
            tournament_uuid: UUID of tournament in database (optional)
            database_tool: DatabaseTool instance for persistence
            vector_db: Vector database client (optional)
            max_short_term: Max trades to keep in short-term memory
        """
        self.agent_id = agent_id
        self.agent_uuid = agent_uuid
        self.tournament_uuid = tournament_uuid
        self.short_term: List[Trade] = []
        self.database_tool = database_tool
        self.vector_db = vector_db
        self.max_short_term = max_short_term

    def add_trade(self, trade: Trade):
        """
        Add a new trade to the agent's short-term memory.

        Args:
            trade : Trade
                Trade object representing an executed action.
        """
        self.short_term.append(trade)

        # Prune if exceeds max
        if len(self.short_term) > self.max_short_term:
            self.short_term = self.short_term[-self.max_short_term:]

    def get_short_term_memory(self, n: Optional[int] = None):
        """
        Retrieve the agent's recent trades from short-term memory.

        Args:
            n : int, optional
                Number of most recent trades to return.
                If None, returns the entire short-term memory.

        Returns:
            List[Trade]
                List of recent Trade objects.
        """
        if n is None:
            return self.short_term.copy()
        return self.short_term[-n:]

    def reset_short_term_memory(self):
        """
            Clear all trades from short-term memory.
            Called at the end of a tournament.
        """
        self.short_term = []


    async def save_to_long_term(self, trade: Trade):
        """
        Save a single trade to the long-term database.

        Args:
            trade : Trade
                Trade object to be saved persistently.
        """
        if self.database_tool and self.agent_uuid and self.tournament_uuid:
            try:
                await self.database_tool.save_trade(
                    trade=trade,
                    agent_uuid=self.agent_uuid,
                    tournament_uuid=self.tournament_uuid
                )
            except Exception as e:
                # Log but don't crash if DB save fails
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to save trade to database: {e}")

    def save_batch_to_long_term(self, trades: List[Trade]):
        """
        Save multiple trades to PostgreSQL in one operation.
        More efficient than saving one by one.

        Args:
            trades: List of trades to save
        """
        # TODO: Implement batch database persistence
        if self.long_term_db:
            # Placeholder for batch DB save
            pass

    async def load_long_term_history(self, limit: Optional[int] = None) -> List[Trade]:
        """
        Retrieve historical trades from the long-term database.

        Args:
            limit : int, optional
                Maximum number of trades to fetch.

        Returns:
            List[Trade]
                List of historical trades for this agent.
        """
        if self.database_tool and self.agent_uuid and self.tournament_uuid:
            try:
                trades = await self.database_tool.load_agent_trades(
                    agent_uuid=self.agent_uuid,
                    tournament_uuid=self.tournament_uuid,
                    limit=limit
                )
                return trades
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to load trade history from database: {e}")
        return []



    def store_vector_embedding(self, trade: Trade, embedder: Any):
        """
        Create an embedding from a trade and store it in the vector database.

        Args:
            trade : Trade
                Trade to convert into an embedding.
            embedder : Any
                Embedding tool with a `.embed_text()` or similar method.
        """
        # TODO: Implement vector embedding storage
        if self.vector_db and embedder:
            # Placeholder for vector DB storage
            pass

    def query_vector_memory(self, query: str, embedder: Any, top_k: int = 5):
        """
        Perform a similarity search over vector memory for semantically related trades.

        Args:
            query : str
                Natural language query describing the current market or trade context.
            embedder : Any
                Embedding model or service used to vectorize the query.
            top_k : int, default=5
                Number of closest results to return.

        Returns:
            List[Dict[str, Any]]
                Ranked list of matching trades and similarity scores.
        """
        # TODO: Implement vector similarity search
        if self.vector_db and embedder:
            # Placeholder for vector search
            pass
        return []



    

    

