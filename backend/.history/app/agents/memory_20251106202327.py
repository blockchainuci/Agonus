from typing import List
from .dataclasses import Trade




class AgentMemory:
    """
Agent_id: unique specifier of each personality
short_term: recent trades/actions 
long_term_db: database connection to postgresql
vector_db: connection to vector db for semantic recall
max_short_term: controls how many trades are remembered in short term memory before older ones are dropped

    """
    agent_id: int
    short_term: List[Trade]
    


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


    def get_recent_trades(self, n: int) -> List[Trade]:
        pass



