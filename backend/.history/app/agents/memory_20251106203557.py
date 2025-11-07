from typing import List
from .dataclasses import Trade




class AgentMemory:

    '''
    Centralized memory for an agent, spanning:
      1) Short-term (in-process) memory for the current tournament.
      2) Long-term (Postgres) durable history of trades across tournaments.
      3) Semantic (vector DB) recall for natural-language similarity search.

    ⚠️ Per your constraint, this class only stores the following attributes:
        - agent_id
        - short_term
        - long_term_db
        - vector_db
        - max_short_term

    All embedding needs are passed as parameters to the relevant methods
    (e.g., `embedder: EmbeddingTool`) instead of being stored as attributes.

    Parameters
    ----------
    agent_id : str | int
        Unique identifier for each agent/personality.
    long_term_db : PostgresClient
        Database client for durable storage and retrieval.
    vector_db : VectorIndex
        Vector database/index for semantic recall.
    max_short_term : int, default=100
        Maximum number of trades remembered in short-term memory.

    Attributes
    ----------
    agent_id : str | int
    short_term : deque[Trade]
        Capped ring buffer of recent trades (current tournament).
    long_term_db : PostgresClient
    vector_db : VectorIndex
    max_short_term : int
    '''

    agent_id: int
    short_term: List[Trade]
    long_term_db: str        # type can be changed
    vector_db: str           # type can be changed
    max_short_term: int


    def __init__(self):
        self.all_trades: List[Trade] = []
        self.tournament_stats: dict = {}
        self.performance_metrics: dict = {
            "win_rate": 0.0,
            "avg_profit": 0.0,
            "total_trades": 0
        }


    def add_trade(self, trade: Trade):
        pass


    def get_short_term_memory(self, n: int) -> List[Trade]:
        pass

    def reset_tournament_memory(self):
        pass

    def get_long_term_memory(self) -> List[Trade]:
        pass

    def add_trade():
        pass


