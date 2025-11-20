import time
from datetime import datetime, timezone
from typing import List

from ..data_classes import Trade
from ..onchain.ts_swap_wrapper import execute_ts_swap


class TradeTool:
    """Execute on-chain trades and helper calculations."""
    def __init__(self, agent_id: str):
        self.agent_id = agent_id

    def execute_trade(self, action: str, token: str, qty: float, price: float, confidence: float, summary: str) -> Trade:
        action = action.upper()
        if action not in ["BUY", "SELL"]:
            raise ValueError(f"Invalid action: {action}. Must be 'BUY' or 'SELL'")

        token = token.upper()
        supported_tokens = ["WETH", "CBBTC"]
        if token not in supported_tokens:
            raise ValueError(f"Invalid token: '{token}'. Must be one of {supported_tokens}")

        token_decimals = {
            "USDC": 6,
            "WETH": 18,
            "CBBTC": 8,
        }

        trade_id = int(time.time() * 1000)
        timestamp = datetime.now(timezone.utc)

        try:
            if action == "BUY":
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
            else:
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

            return trade

        except Exception as e:
            error_msg = f"Trade execution failed for {self.agent_id}: {str(e)}"
            raise Exception(error_msg) from e

    def _get_avg_buy_price(self, token: str, trade_history: List[Trade]) -> float:
        buy_trades = [t for t in trade_history if t.token == token and t.action == "BUY"]
        if not buy_trades:
            return 0.0
        total_qty = sum(t.qty for t in buy_trades)
        total_cost = sum(t.qty * t.price for t in buy_trades)
        if total_qty == 0:
            return 0.0
        return total_cost / total_qty

    def calculate_realized_pnl(self, sell_trade: Trade, trade_history: List[Trade]) -> float:
        avg_buy_price = self._get_avg_buy_price(sell_trade.token, trade_history)
        if avg_buy_price == 0:
            return 0.0
        return (sell_trade.price - avg_buy_price) * sell_trade.qty

    def calculate_roi(self, sell_trade: Trade, trade_history: List[Trade]) -> float:
        avg_buy_price = self._get_avg_buy_price(sell_trade.token, trade_history)
        if avg_buy_price == 0:
            return 0.0
        invested_amount = avg_buy_price * sell_trade.qty
        if invested_amount == 0:
            return 0.0
        pnl = (sell_trade.price - avg_buy_price) * sell_trade.qty
        return pnl / invested_amount
