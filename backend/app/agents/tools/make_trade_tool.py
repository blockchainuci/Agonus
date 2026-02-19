"""
MakeTradeTool - Simulated trade execution for AI trading agents.

This tool handles simulated trades without on-chain execution:
- Validates trades against portfolio constraints
- Uses current market prices to simulate execution
- Updates portfolio state
- Saves trades to database
"""

import time
import logging
from datetime import datetime, timezone
from typing import Optional, Tuple, List, TYPE_CHECKING
from uuid import UUID

from ..data_classes import Trade, Portfolio

if TYPE_CHECKING:
    from .database_tool import DatabaseTool
    from .market_data_tool import MarketDataTool

logger = logging.getLogger(__name__)


class MakeTradeToolError(Exception):
    """Custom exception for MakeTradeTool errors."""

    pass


class MakeTradeTool:
    """
    Simulated trade execution tool for AI trading agents.

    This tool:
    - Simulates trades without on-chain execution
    - Updates portfolio state (cash, holdings, metrics)
    - Saves trades to database for persistence
    - Tracks realized PnL based on average cost basis
    """

    SUPPORTED_TOKENS = [
        "ETH",
        "BTC",
        "SOL",
        "AVAX",
        "DOGE",
        "XRP",
        "TRX",
        "SUI",
        "LINK",
    ]

    def __init__(
        self,
        agent_id: str,
        portfolio: Portfolio,
        market_tool: "MarketDataTool",
        database_tool: Optional["DatabaseTool"] = None,
        agent_uuid: Optional[UUID] = None,
        tournament_uuid: Optional[UUID] = None,
        allowed_tokens: Optional[List[str]] = None,
        min_cash_reserve_pct: float = 0.0,
        max_position_pct: float = 1.0,
    ):
        """
        Initialize MakeTradeTool.

        Args:
            agent_id: Unique agent identifier
            portfolio: Portfolio object to manage
            market_tool: MarketDataTool for fetching prices
            database_tool: DatabaseTool for persistence (optional)
            agent_uuid: Agent UUID for database operations
            tournament_uuid: Tournament UUID for database operations
        """
        self.agent_id = agent_id
        self.portfolio = portfolio
        self.market_tool = market_tool
        self.database_tool = database_tool
        self.agent_uuid = agent_uuid
        self.tournament_uuid = tournament_uuid
        self.allowed_tokens = [t.upper() for t in allowed_tokens] if allowed_tokens else None
        self.min_cash_reserve_pct = min_cash_reserve_pct
        self.max_position_pct = max_position_pct

        # Track cost basis for realized PnL calculation
        self._cost_basis: dict[str, list[dict]] = {}  # token -> [{qty, price}, ...]

        logger.info(
            f"MakeTradeTool initialized for agent_id={agent_id}, "
            f"db_enabled={database_tool is not None}"
        )

    def validate_trade(
        self,
        action: str,
        token: str,
        amount: float,
        risk_score: float = 1.0,
    ) -> Tuple[bool, str]:
        """
        Validate a proposed trade before execution.

        Args:
            action: BUY or SELL
            token: Token symbol (WETH or CBBTC)
            amount: Trade amount (USDC for BUY, token qty for SELL)
            risk_score: Agent's risk tolerance [0.0, 1.0]

        Returns:
            (is_valid, reason)
        """
        action = action.upper()
        token = token.upper()

        if action not in ["BUY", "SELL"]:
            return False, f"Invalid action: {action}. Must be BUY or SELL"

        token_list = self.allowed_tokens if self.allowed_tokens else self.SUPPORTED_TOKENS
        if token not in token_list:
            return (
                False,
                f"Token {token} not allowed. Permitted: {token_list}",
            )

        if amount <= 0:
            return False, f"Invalid amount: {amount}. Must be positive"

        if action == "BUY":
            # For BUY, amount is USDC to spend
            if amount > self.portfolio.cash:
                return (
                    False,
                    f"Insufficient cash: have ${self.portfolio.cash:.2f}, need ${amount:.2f}",
                )
            # Min cash reserve check
            if self.min_cash_reserve_pct > 0:
                cash_after = self.portfolio.cash - amount
                reserve_required = self.portfolio.total_value * self.min_cash_reserve_pct
                if cash_after < reserve_required:
                    return (
                        False,
                        f"Trade would breach min cash reserve ({self.min_cash_reserve_pct*100:.0f}%): "
                        f"would have ${cash_after:.2f} cash, need ${reserve_required:.2f}",
                    )
            # Max position size check
            if self.max_position_pct < 1.0:
                price = self.market_tool.get_price(token)
                if price and price > 0:
                    current_pos_val = self.portfolio.holdings.get(token, 0.0) * price
                    new_pos_val = current_pos_val + amount
                    max_pos_val = self.portfolio.total_value * self.max_position_pct
                    if new_pos_val > max_pos_val:
                        return (
                            False,
                            f"{token} position would be ${new_pos_val:.2f} "
                            f"({new_pos_val/self.portfolio.total_value*100:.0f}% of portfolio), "
                            f"exceeds max {self.max_position_pct*100:.0f}%",
                        )
            # Risk check: don't spend more than risk_score % of portfolio in one trade
            max_trade_size = self.portfolio.total_value * risk_score
            if amount > max_trade_size:
                return (
                    False,
                    f"Trade size ${amount:.2f} exceeds risk limit ${max_trade_size:.2f}",
                )

        elif action == "SELL":
            # For SELL, amount is quantity of token
            current_holdings = self.portfolio.holdings.get(token, 0.0)
            if amount > current_holdings:
                return (
                    False,
                    f"Insufficient {token}: have {current_holdings:.6f}, trying to sell {amount:.6f}",
                )

        return True, "Trade validated"

    async def execute_trade(
        self,
        action: str,
        token: str,
        amount: float,
        confidence: float,
        summary: str,
        risk_score: float = 1.0,
    ) -> Trade:
        """
        Execute a simulated trade.

        Args:
            action: BUY or SELL
            token: Token symbol (ETH, BTC, SOL, AVAX, DOGE, XRP, TRX, SUI, LINK)
            amount: Trade amount (USDC for BUY, token qty for SELL)
            confidence: Trade confidence [0.0, 1.0]
            summary: Brief explanation for the trade
            risk_score: Agent's risk tolerance for validation

        Returns:
            Trade object representing the executed trade

        Raises:
            MakeTradeToolError: If trade validation fails or execution error
        """
        action = action.upper()
        token = token.upper()

        # Validate trade
        is_valid, reason = self.validate_trade(action, token, amount, risk_score)
        if not is_valid:
            raise MakeTradeToolError(f"Trade validation failed: {reason}")

        # Get current market price
        price = self.market_tool.get_price(token)
        if not price or price <= 0:
            raise MakeTradeToolError(f"Could not fetch price for {token}")

        trade_id = int(time.time() * 1000)
        timestamp = datetime.now(timezone.utc)

        logger.info(
            f"Executing simulated {action} trade: {amount} "
            f"{'USDC worth of' if action == 'BUY' else ''} {token} "
            f"for agent {self.agent_id}"
        )

        # Calculate trade quantities based on action
        if action == "BUY":
            # amount is USDC to spend, calculate token quantity
            usdc_spent = amount
            token_qty = usdc_spent / price
            actual_price = price
            realized_pnl = None

            # Track cost basis
            self._add_to_cost_basis(token, token_qty, actual_price)

            # Update portfolio
            self.portfolio.cash -= usdc_spent
            self.portfolio.holdings[token] = (
                self.portfolio.holdings.get(token, 0.0) + token_qty
            )

            logger.info(
                f"BUY completed: spent ${usdc_spent:.2f}, "
                f"received {token_qty:.6f} {token} at ${actual_price:.2f}"
            )

        else:  # SELL
            # amount is token quantity to sell
            token_qty = amount
            usdc_received = token_qty * price
            actual_price = price

            # Calculate realized PnL
            realized_pnl = self._calculate_realized_pnl(token, token_qty, actual_price)

            # Update portfolio
            self.portfolio.cash += usdc_received
            current_holdings = self.portfolio.holdings.get(token, 0.0)
            new_holdings = current_holdings - token_qty

            if new_holdings > 0.0001:  # Small threshold to handle float precision
                self.portfolio.holdings[token] = new_holdings
            else:
                self.portfolio.holdings.pop(token, None)
                self._cost_basis.pop(
                    token, None
                )  # Clear cost basis when position closed

            logger.info(
                f"SELL completed: sold {token_qty:.6f} {token}, "
                f"received ${usdc_received:.2f} at ${actual_price:.2f}, "
                f"realized_pnl=${realized_pnl or 0:.2f}"
            )

        # Update portfolio metrics
        if realized_pnl is not None:
            self.portfolio.realized_pnl += realized_pnl
            if realized_pnl > 0:
                self.portfolio.num_winning_trades += 1
            elif realized_pnl < 0:
                self.portfolio.num_losing_trades += 1

        self.portfolio.num_trades += 1
        self._recalculate_portfolio_metrics()

        # Create trade object
        trade = Trade(
            trade_id=trade_id,
            token=token,
            agent_id=self.agent_id,
            action=action,
            qty=token_qty,
            price=actual_price,
            confidence=confidence,
            summary=summary,
            timestamp=timestamp,
            tx_hash=None,  # Simulated - no tx hash
            realized_pnl=realized_pnl,
            roi=None,
        )

        # Save to database if configured
        if self.database_tool and self.agent_uuid and self.tournament_uuid:
            try:
                await self.database_tool.save_trade(
                    trade=trade,
                    agent_uuid=self.agent_uuid,
                    tournament_uuid=self.tournament_uuid,
                )
                logger.info(
                    f"Trade saved to database: {action} {token_qty:.6f} {token}"
                )
            except Exception as e:
                logger.error(f"Failed to save trade to database: {e}")
                # Don't fail the trade if DB save fails

        logger.info(
            f"Trade executed: {action} {token_qty:.6f} {token} @ ${actual_price:.2f}. "
            f"Portfolio: cash=${self.portfolio.cash:.2f}, total=${self.portfolio.total_value:.2f}"
        )

        return trade

    def _add_to_cost_basis(self, token: str, qty: float, price: float) -> None:
        """Track cost basis for FIFO PnL calculation."""
        if token not in self._cost_basis:
            self._cost_basis[token] = []
        self._cost_basis[token].append({"qty": qty, "price": price})

    def _calculate_realized_pnl(
        self, token: str, sell_qty: float, sell_price: float
    ) -> float:
        """
        Calculate realized PnL using FIFO (First In, First Out) method.

        Args:
            token: Token being sold
            sell_qty: Quantity being sold
            sell_price: Current sale price

        Returns:
            Realized profit/loss
        """
        if token not in self._cost_basis or not self._cost_basis[token]:
            return 0.0

        remaining_qty = sell_qty
        total_cost = 0.0

        # FIFO: sell oldest positions first
        while remaining_qty > 0 and self._cost_basis[token]:
            lot = self._cost_basis[token][0]

            if lot["qty"] <= remaining_qty:
                # Use entire lot
                total_cost += lot["qty"] * lot["price"]
                remaining_qty -= lot["qty"]
                self._cost_basis[token].pop(0)
            else:
                # Use partial lot
                total_cost += remaining_qty * lot["price"]
                lot["qty"] -= remaining_qty
                remaining_qty = 0

        proceeds = sell_qty * sell_price
        realized_pnl = proceeds - total_cost

        logger.debug(
            f"Realized PnL calculation: sold {sell_qty} {token} @ ${sell_price}, "
            f"cost_basis=${total_cost:.2f}, proceeds=${proceeds:.2f}, pnl=${realized_pnl:.2f}"
        )

        return realized_pnl

    def recalculate_holdings_value(self) -> None:
        """Update market value of all holdings using current prices."""
        total_holdings = 0.0

        for symbol, qty in self.portfolio.holdings.items():
            price = self.market_tool.get_price(symbol)
            if price is None:
                logger.warning(f"No market price found for {symbol}")
                continue
            holding_value = qty * price
            total_holdings += holding_value
            logger.debug(f"{symbol}: {qty} @ ${price} = ${holding_value:.2f}")

        self.portfolio.holdings_val = total_holdings
        self._recalculate_portfolio_metrics()
        logger.info(f"Holdings value recalculated: ${total_holdings:.2f}")

    def _recalculate_portfolio_metrics(self) -> None:
        """Recalculate all portfolio metrics."""
        pf = self.portfolio

        # Recalculate holdings value if we have holdings
        if pf.holdings:
            holdings_val = 0.0
            for symbol, qty in pf.holdings.items():
                price = self.market_tool.get_price(symbol)
                if price:
                    holdings_val += qty * price
            pf.holdings_val = holdings_val

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

        logger.debug(
            f"Portfolio metrics: total=${pf.total_value:.2f}, "
            f"ROI={pf.roi:.4f}, win_rate={pf.win_rate:.2f}"
        )

    def get_portfolio_status(self) -> dict:
        """Get current portfolio status as a dictionary."""
        self.recalculate_holdings_value()
        return {
            "cash": self.portfolio.cash,
            "holdings": self.portfolio.holdings.copy(),
            "holdings_val": self.portfolio.holdings_val,
            "total_value": self.portfolio.total_value,
            "roi": self.portfolio.roi,
            "realized_pnl": self.portfolio.realized_pnl,
            "unrealized_pnl": self.portfolio.unrealized_pnl,
            "num_trades": self.portfolio.num_trades,
            "win_rate": self.portfolio.win_rate,
        }

    def get_portfolio_snapshot(self) -> Portfolio:
        """Return a deep copy of the current portfolio."""
        import copy

        self.recalculate_holdings_value()
        return copy.deepcopy(self.portfolio)
