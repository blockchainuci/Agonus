from typing import List, Optional, Dict, Any, Union
from app.agents.dataclasses import Trade


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
    """

    def __init__(
        self,
        agent_id: str,
        long_term_db: Optional[Any] = None,
        vector_db: Optional[Any] = None,
        max_short_term: int = 100
    ):
        self.agent_id = agent_id
        self.short_term: List[Trade] = []
        self.long_term_db = long_term_db
        self.vector_db = vector_db
        self.max_short_term = max_short_term
        self.performance_metrics: Dict[str, float] = {}


    def add_trade(self, trade: Trade):
        """
        Add a new trade to the agent's short-term memory.

        Parameters
        ----------
        trade : Trade
            Trade object representing an executed action.
        """
        pass

    def get_short_term_memory(self, n: Optional[int] = None) -> List[Trade]:
        """
        Retrieve the agent's recent trades from short-term memory.

        Parameters
        ----------
        n : int, optional
            Number of most recent trades to return.
            If None, returns the entire short-term memory.

        Returns
        -------
        List[Trade]
            List of recent Trade objects.
        """
        pass

    def reset_short_term_memory(self) -> None:
        """
        Clear all trades from short-term memory.
        Called at the end of a tournament or evaluation cycle.
        """
        pass

    # ==========================================================
    # 💾 LONG-TERM MEMORY METHODS
    # ==========================================================

    def save_to_long_term(self, trade: Trade) -> None:
        """
        Persist a single trade to the long-term database.

        Parameters
        ----------
        trade : Trade
            Trade object to be saved persistently.
        """
        pass

    def load_long_term_history(self, limit: Optional[int] = None) -> List[Trade]:
        """
        Retrieve historical trades from the long-term database.

        Parameters
        ----------
        limit : int, optional
            Maximum number of trades to fetch.

        Returns
        -------
        List[Trade]
            List of historical trades for this agent.
        """
        pass

    def compute_long_term_statistics(self) -> Dict[str, float]:
        """
        Compute performance metrics based on the agent's long-term history.

        Returns
        -------
        Dict[str, float]
            Dictionary containing metrics such as win_rate, avg_profit, ROI, etc.
        """
        pass

    # ==========================================================
    # 🧬 VECTOR MEMORY METHODS
    # ==========================================================

    def store_vector_embedding(self, trade: Trade, embedder: Any) -> None:
        """
        Create an embedding from a trade summary and store it in the vector database.

        Parameters
        ----------
        trade : Trade
            Trade to convert into an embedding.
        embedder : Any
            Embedding tool with a `.embed_text()` or similar method.
        """
        pass

    def query_vector_memory(self, query: str, embedder: Any, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Perform a similarity search over vector memory for semantically related trades.

        Parameters
        ----------
        query : str
            Natural language query describing the current market or trade context.
        embedder : Any
            Embedding model or service used to vectorize the query.
        top_k : int, default=5
            Number of closest results to return.

        Returns
        -------
        List[Dict[str, Any]]
            Ranked list of matching trades and similarity scores.
        """
        pass

    # ==========================================================
    # 🧩 UTILITIES
    # ==========================================================

    def summarize_memory(self) -> Dict[str, Any]:
        """
        Summarize the agent's memory state for debugging or monitoring.

        Returns
        -------
        Dict[str, Any]
            Overview of the number of trades and high-level metrics.
        """
        pass

    

    

