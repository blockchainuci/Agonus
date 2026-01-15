import time
import logging
from datetime import datetime, timezone
from typing import List

from ..data_classes import Trade
from ..onchain.ts_swap_wrapper import execute_ts_swap

logger = logging.getLogger(__name__)


class TradeToolError(Exception):
    """Custom exception for TradeTool errors."""

    pass


class TradeTool:
    """Execute on-chain trades and helper calculations."""

    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        logger.info(f"TradeTool initialized for agent_id={agent_id}")

    def execute_trade(
        self,
        action: str,
        token: str,
        qty: float,
        price: float,
        confidence: float,
        summary: str,
    ) -> Trade:
        action = action.upper()
        if action not in ["BUY", "SELL"]:
            logger.error(f"Invalid action: {action}")
            raise TradeToolError(f"Invalid action {action}. Must be 'BUY' or 'SELL'")

        token = token.upper()
        supported_tokens = ["WETH", "CBBTC", "USDC"]
        if token not in supported_tokens:
            logger.error(f"Invalid token: {token}")
            raise TradeToolError(
                f"Invalid token: '{token}'. Must be one of {supported_tokens}"
            )

        token_decimals = {
            "USDC": 6,
            "WETH": 18,
            "CBBTC": 8,
        }

        trade_id = int(time.time() * 1000)
        timestamp = datetime.now(timezone.utc)

        logger.info(
            f"Executing {action} trade: {qty} {token} for agent {self.agent_id}"
        )

        try:
            if action == "BUY":
                logger.debug(f"Swapping {qty} USDC for {token}")
                swap_result = execute_ts_swap(
                    agent_id=self.agent_id,
                    from_token="USDC",
                    to_token=token,
                    amount=qty,
                    slippage=50,
                )
                amount_out_wei = int(swap_result["amount_out"])
                actual_qty = amount_out_wei / (10 ** token_decimals[token])
                actual_price = qty / actual_qty if actual_qty > 0 else 0
                logger.info(
                    f"BUY completed: received {actual_qty} {token} at {actual_price} USDC/{token}"
                )
            else:
                logger.debug(f"Swapping {qty} {token} for USDC")
                swap_result = execute_ts_swap(
                    agent_id=self.agent_id,
                    from_token=token,
                    to_token="USDC",
                    amount=qty,
                    slippage=50,
                )
                amount_out_wei = int(swap_result["amount_out"])
                usdc_received = amount_out_wei / (10 ** token_decimals["USDC"])
                actual_qty = qty
                actual_price = usdc_received / qty if qty > 0 else 0
                logger.info(
                    f"SELL completed: sold {actual_qty} {token} for {usdc_received} USDC at {actual_price} USDC/{token}"
                )

            trade = Trade(
                trade_id=trade_id,
                token=token,
                agent_id=self.agent_id,
                action=action,
                qty=actual_qty,
                price=actual_price,
                confidence=confidence,
                summary=summary,
                timestamp=timestamp,
                tx_hash=swap_result["tx_hash"],
                realized_pnl=None,
                roi=None,
            )

            logger.debug(
                f"Trade created: trade_id={trade_id}, tx_hash={swap_result['tx_hash']}"
            )
            return trade

        except Exception as e:
            error_msg = f"Trade execution failed for {self.agent_id}: {str(e)}"
            logger.error(error_msg)
            raise TradeToolError(error_msg) from e

    def _get_avg_buy_price(self, token: str, trade_history: List[Trade]) -> float:
        buy_trades = [
            t for t in trade_history if t.token == token and t.action == "BUY"
        ]
        if not buy_trades:
            logger.debug(f"No buy trades found for {token}")
            return 0.0
        total_qty = sum(t.qty for t in buy_trades)
        total_cost = sum(t.qty * t.price for t in buy_trades)
        if total_qty == 0:
            return 0.0
        avg_price = total_cost / total_qty
        logger.debug(f"Average buy price for {token}: {avg_price}")
        return avg_price

    def calculate_realized_pnl(
        self, sell_trade: Trade, trade_history: List[Trade]
    ) -> float:
        avg_buy_price = self._get_avg_buy_price(sell_trade.token, trade_history)
        if avg_buy_price == 0:
            return 0.0
        pnl = (sell_trade.price - avg_buy_price) * sell_trade.qty
        logger.debug(f"Realized PnL for {sell_trade.token}: {pnl}")
        return pnl

    def calculate_roi(self, sell_trade: Trade, trade_history: List[Trade]) -> float:
        avg_buy_price = self._get_avg_buy_price(sell_trade.token, trade_history)
        if avg_buy_price == 0:
            return 0.0
        invested_amount = avg_buy_price * sell_trade.qty
        if invested_amount == 0:
            return 0.0
        pnl = (sell_trade.price - avg_buy_price) * sell_trade.qty
        roi = pnl / invested_amount
        logger.debug(f"ROI for {sell_trade.token}: {roi:.4f} ({roi*100:.2f}%)")
        return roi
