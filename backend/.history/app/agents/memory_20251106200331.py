
from .dataclasses import Trade, 




class AgentMemory:
    def __init__(self):
        self.all_trades: List[Trade]
        



'''

class AgentMemory:
    def __init__(self):
        self.trade_history: List[Trade] = []
        self.tournament_stats: dict = {}
        self.performance_metrics: dict = {
            "win_rate": 0.0,
            "avg_profit": 0.0,
            "total_trades": 0,
        }

    def add_trade(self, trade: Trade):
        self.trade_history.append(trade)

    def get_recent_trades(self, n: int = 5) -> List[Trade]:
        return self.trade_history[-n:]'''