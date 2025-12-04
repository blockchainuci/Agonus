# backend/app/agents/executor.py

"""
Stub TradingAgent + ACTIVE_AGENTS for development.
LangChain is disabled.
"""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
# Dummy Trade object (endpoint-compatible)
# -------------------------------------------------------------------
class DummyTrade:
    def __init__(self, trade_id):
        self.trade_id = trade_id
        self.action = "BUY"
        self.token = "WETH"
        self.qty = 0.5
        self.price = 2300
        self.confidence = 0.85
        self.realized_pnl = 0
        self.roi = 0.02
        self.summary = "Mock trade from stub agent"
        self.timestamp = datetime.utcnow()

# -------------------------------------------------------------------
# Dummy agent
# -------------------------------------------------------------------
class DummyAgent:
    def __init__(self, agent_id: int):
        self.agent_id = agent_id
        self.name = f"Agent-{agent_id}"
        self.personality = "neutral"
        self.risk_score = 0.1

        # Minimal mock portfolio
        self._holdings = {"WETH": 0.5, "CBBTC": 0.02}
        self._cash = 500.0

    def get_holdings(self):
        return self._holdings

    def get_available_cash(self):
        return self._cash

    def get_portfolio_status(self):
        class P:
            starting_val = 500
            realized_pnl = 0
            unrealized_pnl = 0
            total_value = 500
            roi = 0.05
            num_trades = 5
            win_rate = 0.6
            num_winning_trades = 3
            num_losing_trades = 2
        return P()

    def get_short_term_memory(self, n: int = 10):
        return [DummyTrade(i) for i in range(n)]

# -------------------------------------------------------------------
# ACTIVE_AGENTS (Give frontend something to read)
# -------------------------------------------------------------------
ACTIVE_AGENTS = {
    1: DummyAgent(1),
    2: DummyAgent(2),
    3: DummyAgent(3),
}

logger.warning("🔥 Using STUB TradingAgent executor (LangChain disabled).")

# Export a placeholder TradingAgent so imports don't break
class TradingAgent(DummyAgent):
    pass
