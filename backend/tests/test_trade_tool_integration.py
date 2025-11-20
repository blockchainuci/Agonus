"""
Integration tests for TradeTool with real Uniswap swaps on Base blockchain.

Prerequisites:
1. Fund agent wallets using trading-bot/fundWallet.ts
2. Ensure Anvil fork is running: anvil --fork-url <url> --chain-id 8453 --auto-impersonate

Tests execute REAL on-chain transactions and cost gas.

Run: pytest backend/tests/test_trade_tool_integration.py -v -s
"""

import pytest
from app.agents.tools import TradeTool


@pytest.fixture(scope="module")
def trade_tool():
    """Create TradeTool instance for agent_1"""
    return TradeTool(agent_id="agent_1")


@pytest.mark.integration
class TestRealTrades:
    """Execute real trades on Base blockchain"""

    def test_buy_weth_with_usdc(self, trade_tool):
        """Test BUY: USDC → WETH"""

        trade = trade_tool.execute_trade(
            action="BUY",
            token="WETH",
            qty=10.0,
            price=0.0,
            confidence=0.85,
            summary="Test buy WETH"
        )

        assert trade.action == "BUY"
        assert trade.token == "WETH"
        assert trade.agent_id == "agent_1"
        assert trade.qty > 0
        assert trade.price > 0
        assert trade.tx_hash is not None
        assert trade.tx_hash.startswith("0x")
        assert len(trade.tx_hash) == 66

        print(f"\n✅ BUY WETH: Spent 10 USDC, received {trade.qty:.6f} WETH at {trade.price:.2f} USDC/WETH")
        print(f"TX: https://basescan.org/tx/{trade.tx_hash}")

    def test_buy_cbbtc_with_usdc(self, trade_tool):
        """Test BUY: USDC → cbBTC"""

        trade = trade_tool.execute_trade(
            action="BUY",
            token="CBBTC",
            qty=10.0,
            price=0.0,
            confidence=0.8,
            summary="Test buy cbBTC"
        )

        assert trade.action == "BUY"
        assert trade.token == "CBBTC"
        assert trade.qty > 0
        assert trade.price > 0
        assert trade.tx_hash is not None

        print(f"\n✅ BUY CBBTC: Spent 10 USDC, received {trade.qty:.8f} CBBTC at {trade.price:.2f} USDC/CBBTC")
        print(f"TX: https://basescan.org/tx/{trade.tx_hash}")

    def test_sell_weth_for_usdc(self, trade_tool):
        """Test SELL: WETH → USDC"""

        trade = trade_tool.execute_trade(
            action="SELL",
            token="WETH",
            qty=0.003,
            price=0.0,
            confidence=0.75,
            summary="Test sell WETH"
        )

        assert trade.action == "SELL"
        assert trade.token == "WETH"
        assert trade.qty == 0.003
        assert trade.price > 0
        assert trade.tx_hash is not None

        usdc_received = trade.qty * trade.price
        print(f"\n✅ SELL WETH: Sold {trade.qty:.6f} WETH, received ~{usdc_received:.2f} USDC")
        print(f"TX: https://basescan.org/tx/{trade.tx_hash}")

    def test_sell_cbbtc_for_usdc(self, trade_tool):
        """Test SELL: cbBTC → USDC"""

        trade = trade_tool.execute_trade(
            action="SELL",
            token="CBBTC",
            qty=0.0001,
            price=0.0,
            confidence=0.7,
            summary="Test sell cbBTC"
        )

        assert trade.action == "SELL"
        assert trade.token == "CBBTC"
        assert trade.qty == 0.0001
        assert trade.price > 0
        assert trade.tx_hash is not None

        usdc_received = trade.qty * trade.price
        print(f"\n✅ SELL CBBTC: Sold {trade.qty:.8f} CBBTC, received ~{usdc_received:.2f} USDC")
        print(f"TX: https://basescan.org/tx/{trade.tx_hash}")
