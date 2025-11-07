from typing import List
from .dataclasses import Trade




class AgentMemory:
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



