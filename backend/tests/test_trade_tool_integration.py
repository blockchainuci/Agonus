"""
Integration tests for TradeTool with real Uniswap swaps on Base blockchain.

Prerequisites:
1. Run setup_wallets.py first to convert ETH → 500 USDC
2. Wallet needs small ETH balance for gas

Tests execute REAL on-chain transactions and cost gas.

Run: pytest backend/tests/test_trade_tool_integration.py -v -s
"""

import pytest
from app.agents.datatools import TradeTool
from app.agents.onchain import uniswap_client


@pytest.fixture(scope="module")
def trade_tool():
    """Create TradeTool instance for agent_1"""
    return TradeTool(agent_id="agent_1")


@pytest.fixture(scope="module")
def verify_setup():
    """Verify wallet has USDC before running tests"""
    account = uniswap_client.get_account("agent_1")
    usdc_balance = uniswap_client.get_token_balance(
        uniswap_client.TOKEN_ADDRESSES["USDC"],
        account.address
    )

    if usdc_balance < 100:
        pytest.skip(f"Need at least 100 USDC, have {usdc_balance:.2f}. Run setup_wallets.py first.")

    print(f"\nAgent wallet: {account.address}")
    print(f"USDC balance: {usdc_balance:.2f}")
    return usdc_balance


@pytest.mark.integration
class TestRealTrades:
    """Execute real trades on Base blockchain"""

    def test_buy_weth_with_usdc(self, trade_tool, verify_setup):
        """Test BUY: USDC → WETH"""

        trade = trade_tool.execute_trade(
            action="BUY",
            token="WETH",
            qty=10.0,  # Spend 10 USDC
            price=0.0,  # Actual price from Uniswap
            confidence=0.85,
            summary="Test buy WETH"
        )

        # Verify trade executed correctly
        assert trade.action == "BUY"
        assert trade.token == "WETH"
        assert trade.agent_id == "agent_1"
        assert trade.qty > 0  # Received some WETH
        assert trade.price > 0  # Got execution price
        assert trade.tx_hash is not None
        assert trade.tx_hash.startswith("0x")
        assert len(trade.tx_hash) == 66

        print(f"\n✅ BUY WETH: Spent 10 USDC, received {trade.qty:.6f} WETH")
        print(f"TX: https://basescan.org/tx/{trade.tx_hash}")

    def test_buy_cbbtc_with_usdc(self, trade_tool, verify_setup):
        """Test BUY: USDC → cbBTC"""

        trade = trade_tool.execute_trade(
            action="BUY",
            token="cbBTC",
            qty=10.0,  # Spend 10 USDC
            price=0.0,
            confidence=0.8,
            summary="Test buy cbBTC"
        )

        # Verify trade executed correctly
        assert trade.action == "BUY"
        assert trade.token == "cbBTC"
        assert trade.qty > 0  # Received some cbBTC
        assert trade.price > 0
        assert trade.tx_hash is not None

        print(f"\n✅ BUY cbBTC: Spent 10 USDC, received {trade.qty:.8f} cbBTC")
        print(f"TX: https://basescan.org/tx/{trade.tx_hash}")

    def test_sell_weth_for_usdc(self, trade_tool):
        """Test SELL: WETH → USDC"""

        # Check WETH balance first
        account = uniswap_client.get_account("agent_1")
        weth_balance = uniswap_client.get_token_balance(
            uniswap_client.TOKEN_ADDRESSES["WETH"],
            account.address
        )

        if weth_balance < 0.001:
            pytest.skip(f"Need WETH to sell, have {weth_balance:.6f}. Run buy test first.")

        # Sell half of WETH balance
        sell_qty = weth_balance * 0.5

        trade = trade_tool.execute_trade(
            action="SELL",
            token="WETH",
            qty=sell_qty,
            price=0.0,
            confidence=0.75,
            summary="Test sell WETH"
        )

        # Verify trade executed correctly
        assert trade.action == "SELL"
        assert trade.token == "WETH"
        assert trade.qty == sell_qty
        assert trade.price > 0  # USDC per WETH
        assert trade.tx_hash is not None

        usdc_received = sell_qty * trade.price
        print(f"\n✅ SELL WETH: Sold {sell_qty:.6f} WETH, received ~{usdc_received:.2f} USDC")
        print(f"TX: https://basescan.org/tx/{trade.tx_hash}")

    def test_sell_cbbtc_for_usdc(self, trade_tool):
        """Test SELL: cbBTC → USDC"""

        # Check cbBTC balance first
        account = uniswap_client.get_account("agent_1")
        cbbtc_balance = uniswap_client.get_token_balance(
            uniswap_client.TOKEN_ADDRESSES["CBBTC"],
            account.address
        )

        if cbbtc_balance < 0.00001:
            pytest.skip(f"Need cbBTC to sell, have {cbbtc_balance:.8f}. Run buy test first.")

        # Sell half of cbBTC balance
        sell_qty = cbbtc_balance * 0.5

        trade = trade_tool.execute_trade(
            action="SELL",
            token="cbBTC",
            qty=sell_qty,
            price=0.0,
            confidence=0.7,
            summary="Test sell cbBTC"
        )

        # Verify trade executed correctly
        assert trade.action == "SELL"
        assert trade.token == "cbBTC"
        assert trade.qty == sell_qty
        assert trade.price > 0  # USDC per cbBTC
        assert trade.tx_hash is not None

        usdc_received = sell_qty * trade.price
        print(f"\n✅ SELL cbBTC: Sold {sell_qty:.8f} cbBTC, received ~{usdc_received:.2f} USDC")
        print(f"TX: https://basescan.org/tx/{trade.tx_hash}")
