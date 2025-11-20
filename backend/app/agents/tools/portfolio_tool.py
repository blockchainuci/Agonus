import copy
from typing import Dict

from ..data_classes import Portfolio, Trade


class PortfolioTool:
    """Manage portfolio state and metrics."""
    def __init__(self, portfolio: Portfolio):
        self.portfolio = portfolio

    def update_after_trade(self, trade: Trade) -> None:
        pf = self.portfolio
        if pf.agent_id != trade.agent_id:
            return

        action = trade.action
        token = trade.token
        value = trade.qty * trade.price

        if action == "BUY":
            pf.cash -= value
            pf.holdings[token] = pf.holdings.get(token, 0.0) + trade.qty
        elif action == "SELL":
            current_qty = pf.holdings.get(token, 0.0)
            new_qty = current_qty - trade.qty
            pf.cash += value
            if new_qty > 0:
                pf.holdings[token] = new_qty
            else:
                pf.holdings.pop(token, None)

        if trade.realized_pnl is not None:
            pf.realized_pnl += trade.realized_pnl
            if trade.realized_pnl > 0:
                pf.num_winning_trades += 1
            elif trade.realized_pnl < 0:
                pf.num_losing_trades += 1

        pf.num_trades += 1
        self._recalculate_portfolio_metrics()

    def recalculate_holdings_value(self, market_prices: Dict[str, float]) -> None:
        pf = self.portfolio
        total_holdings = 0.0
        for symbol, qty in pf.holdings.items():
            price = market_prices.get(symbol.upper())
            if price is None:
                continue
            total_holdings += qty * price
        pf.holdings_val = total_holdings
        self._recalculate_portfolio_metrics()

    def get_portfolio_snapshot(self) -> Portfolio:
        return copy.deepcopy(self.portfolio)

    def get_total_value(self) -> float:
        return self.portfolio.total_value

    def _recalculate_portfolio_metrics(self):
        pf = self.portfolio
        pf.total_value = pf.holdings_val + pf.cash
        if pf.starting_val > 0:
            pf.roi = (pf.total_value - pf.starting_val) / pf.starting_val
        else:
            pf.roi = 0.0
        if pf.num_trades > 0:
            pf.win_rate = pf.num_winning_trades / pf.num_trades
        else:
            pf.win_rate = 0.0
        pf.unrealized_pnl = (pf.total_value - pf.starting_val) - pf.realized_pnl
