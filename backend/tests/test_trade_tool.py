"""
Unit tests for TradeTool calculation methods.

Run: pytest backend/tests/test_trade_tool.py -v
"""

import pytest
from datetime import datetime, timezone
from backend.app.agents.tools import TradeTool
from backend.app.agents.data_classes import Trade


@pytest.fixture
def trade_tool():
    return TradeTool(agent_id="agent_1")


@pytest.fixture
def sample_history():
    """Sample trade history with multiple buys"""
    return [
        Trade(
            trade_id=1, token="WETH", agent_id="agent_1", action="BUY",
            qty=1.0, price=3000.0, confidence=0.8, summary="First buy",
            timestamp=datetime.now(timezone.utc), tx_hash="0xabc",
            realized_pnl=None, roi=None
        ),
        Trade(
            trade_id=2, token="WETH", agent_id="agent_1", action="BUY",
            qty=2.0, price=3300.0, confidence=0.9, summary="Second buy",
            timestamp=datetime.now(timezone.utc), tx_hash="0xdef",
            realized_pnl=None, roi=None
        ),
        Trade(
            trade_id=3, token="cbBTC", agent_id="agent_1", action="BUY",
            qty=0.5, price=60000.0, confidence=0.85, summary="BTC buy",
            timestamp=datetime.now(timezone.utc), tx_hash="0xghi",
            realized_pnl=None, roi=None
        )
    ]


class TestGetAvgBuyPrice:
    """Test _get_avg_buy_price helper method"""

    def test_single_buy(self, trade_tool, sample_history):
        avg = trade_tool._get_avg_buy_price("cbBTC", sample_history)
        assert avg == 60000.0

    def test_multiple_buys_weighted_average(self, trade_tool, sample_history):
        # WETH: 1.0@3000 + 2.0@3300 = (3000 + 6600) / 3 = 3200
        avg = trade_tool._get_avg_buy_price("WETH", sample_history)
        assert avg == 3200.0

    def test_no_buys(self, trade_tool, sample_history):
        avg = trade_tool._get_avg_buy_price("USDC", sample_history)
        assert avg == 0.0

    def test_empty_history(self, trade_tool):
        avg = trade_tool._get_avg_buy_price("WETH", [])
        assert avg == 0.0


class TestCalculateRealizedPnL:
    """Test PnL calculation for SELL trades"""

    def test_profitable_sell(self, trade_tool, sample_history):
        sell = Trade(
            trade_id=4, token="WETH", agent_id="agent_1", action="SELL",
            qty=1.5, price=3500.0, confidence=0.75, summary="Profit",
            timestamp=datetime.now(timezone.utc), tx_hash="0xjkl",
            realized_pnl=None, roi=None
        )

        pnl = trade_tool.calculate_realized_pnl(sell, sample_history)
        # (3500 - 3200) * 1.5 = 450
        assert pnl == 450.0

    def test_losing_sell(self, trade_tool, sample_history):
        sell = Trade(
            trade_id=4, token="WETH", agent_id="agent_1", action="SELL",
            qty=1.0, price=3000.0, confidence=0.7, summary="Loss",
            timestamp=datetime.now(timezone.utc), tx_hash="0xmno",
            realized_pnl=None, roi=None
        )

        pnl = trade_tool.calculate_realized_pnl(sell, sample_history)
        # (3000 - 3200) * 1.0 = -200
        assert pnl == -200.0

    def test_no_buy_history(self, trade_tool):
        sell = Trade(
            trade_id=1, token="WETH", agent_id="agent_1", action="SELL",
            qty=1.0, price=3500.0, confidence=0.8, summary="Sell",
            timestamp=datetime.now(timezone.utc), tx_hash="0xpqr",
            realized_pnl=None, roi=None
        )

        pnl = trade_tool.calculate_realized_pnl(sell, [])
        assert pnl == 0.0


class TestCalculateROI:
    """Test ROI calculation for SELL trades"""

    def test_positive_roi(self, trade_tool, sample_history):
        sell = Trade(
            trade_id=4, token="WETH", agent_id="agent_1", action="SELL",
            qty=1.5, price=3500.0, confidence=0.75, summary="Profit",
            timestamp=datetime.now(timezone.utc), tx_hash="0xstu",
            realized_pnl=None, roi=None
        )

        roi = trade_tool.calculate_roi(sell, sample_history)
        # Invested: 3200 * 1.5 = 4800
        # PnL: (3500 - 3200) * 1.5 = 450
        # ROI: 450 / 4800 = 0.09375
        assert roi == pytest.approx(0.09375)

    def test_negative_roi(self, trade_tool, sample_history):
        sell = Trade(
            trade_id=4, token="WETH", agent_id="agent_1", action="SELL",
            qty=1.0, price=2880.0, confidence=0.7, summary="Loss",
            timestamp=datetime.now(timezone.utc), tx_hash="0xvwx",
            realized_pnl=None, roi=None
        )

        roi = trade_tool.calculate_roi(sell, sample_history)
        # Invested: 3200 * 1.0 = 3200
        # PnL: (2880 - 3200) * 1.0 = -320
        # ROI: -320 / 3200 = -0.1
        assert roi == pytest.approx(-0.1)

    def test_no_buy_history(self, trade_tool):
        sell = Trade(
            trade_id=1, token="WETH", agent_id="agent_1", action="SELL",
            qty=1.0, price=3500.0, confidence=0.8, summary="Sell",
            timestamp=datetime.now(timezone.utc), tx_hash="0xyza",
            realized_pnl=None, roi=None
        )

        roi = trade_tool.calculate_roi(sell, [])
        assert roi == 0.0


class TestExecuteTradeValidation:
    """Test input validation for execute_trade"""

    def test_case_insensitive_action(self, trade_tool):
        # Lowercase action should be accepted and converted to uppercase
        # Should NOT raise ValueError for invalid action
        try:
            trade_tool.execute_trade("buy", "WETH", 1.0, 0.0, 0.8, "Test")
        except ValueError as e:
            if "Invalid action" in str(e):
                pytest.fail("Should accept lowercase action")
        except Exception:
            # Other exceptions (like swap failures) are acceptable
            pass

    def test_case_insensitive_token(self, trade_tool):
        # Lowercase token should be accepted and converted to uppercase
        # Should NOT raise ValueError for invalid token
        try:
            trade_tool.execute_trade("BUY", "weth", 1.0, 0.0, 0.8, "Test")
        except ValueError as e:
            if "Invalid token" in str(e):
                pytest.fail("Should accept lowercase token")
        except Exception:
            # Other exceptions (like swap failures) are acceptable
            pass
