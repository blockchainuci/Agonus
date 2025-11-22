import copy
import logging
from typing import Dict

from ..data_classes import Portfolio, Trade

logger = logging.getLogger(__name__)


class PortfolioTool:
    """Manage portfolio state and metrics."""
    def __init__(self, portfolio: Portfolio):
        self.portfolio = portfolio
        logger.info(f"PortfolioTool initialized for agent_id={portfolio.agent_id}")

    def update_after_trade(self, trade: Trade) -> None:
        pf = self.portfolio
        if pf.agent_id != trade.agent_id:
            logger.warning(f"Trade agent_id {trade.agent_id} doesn't match portfolio agent_id {pf.agent_id}")
            return

        action = trade.action
        token = trade.token
        value = trade.qty * trade.price

        logger.debug(f"Updating portfolio after {action} trade: {trade.qty} {token} at {trade.price}")

        if action == "BUY":
            pf.cash -= value
            pf.holdings[token] = pf.holdings.get(token, 0.0) + trade.qty
            logger.debug(f"BUY: cash reduced by {value}, {token} holdings now {pf.holdings[token]}")
        elif action == "SELL":
            current_qty = pf.holdings.get(token, 0.0)
            new_qty = current_qty - trade.qty
            pf.cash += value
            if new_qty > 0:
                pf.holdings[token] = new_qty
                logger.debug(f"SELL: cash increased by {value}, {token} holdings now {new_qty}")
            else:
                pf.holdings.pop(token, None)
                logger.debug(f"SELL: cash increased by {value}, {token} position closed")

        if trade.realized_pnl is not None:
            pf.realized_pnl += trade.realized_pnl
            if trade.realized_pnl > 0:
                pf.num_winning_trades += 1
                logger.debug(f"Winning trade: PnL={trade.realized_pnl}")
            elif trade.realized_pnl < 0:
                pf.num_losing_trades += 1
                logger.debug(f"Losing trade: PnL={trade.realized_pnl}")

        pf.num_trades += 1
        self._recalculate_portfolio_metrics()
        logger.info(f"Portfolio updated: total_value={pf.total_value}, cash={pf.cash}, num_trades={pf.num_trades}")

    def recalculate_holdings_value(self, market_prices: Dict[str, float]) -> None:
        pf = self.portfolio
        total_holdings = 0.0
        logger.debug("Recalculating holdings value with current market prices")
        for symbol, qty in pf.holdings.items():
            price = market_prices.get(symbol.upper())
            if price is None:
                logger.warning(f"No market price found for {symbol}")
                continue
            holding_value = qty * price
            total_holdings += holding_value
            logger.debug(f"{symbol}: {qty} @ {price} = {holding_value}")
        pf.holdings_val = total_holdings
        self._recalculate_portfolio_metrics()
        logger.info(f"Holdings value recalculated: {total_holdings}")

    def get_portfolio_snapshot(self) -> Portfolio:
        logger.debug("Creating portfolio snapshot")
        return copy.deepcopy(self.portfolio)

    def get_total_value(self) -> float:
        logger.debug(f"Total portfolio value: {self.portfolio.total_value}")
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
        logger.debug(f"Metrics recalculated: ROI={pf.roi:.4f}, win_rate={pf.win_rate:.2f}, unrealized_pnl={pf.unrealized_pnl}")
