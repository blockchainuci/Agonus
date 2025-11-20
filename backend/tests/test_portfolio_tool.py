"""
Integration tests for PortfolioTool.

These tests verify portfolio state updates, PnL metrics, and
holdings value recalculation without any external APIs.

Run: pytest backend/tests/test_portfolio_tool_integration.py -v -s
"""

import pytest
from datetime import datetime

from backend.app.agents.tools.portfolio_tool import PortfolioTool
from backend.app.agents.data_classes import Portfolio, Trade


# ==========================
# Fixtures
# ==========================

@pytest.fixture
def base_portfolio():
    """
    Create a clean Portfolio instance for tests.

    We override starting_val and total_value to be 10_000 so we can
    reason about ROI and PnL more easily.
    """
    return Portfolio(
        agent_id="agent_1",
        cash=10_000.0,
        holdings={},
        starting_val=10_000.0,
        holdings_val=0.0,
        unrealized_pnl=0.0,
        realized_pnl=0.0,
        total_value=10_000.0,
        num_trades=0,
        num_winning_trades=0,
        num_losing_trades=0,
        win_rate=0.0,
        roi=0.0,
    )


@pytest.fixture
def portfolio_tool(base_portfolio):
    """Create PortfolioTool bound to the base portfolio."""
    return PortfolioTool(portfolio=base_portfolio)


# ==========================
# Initialization / Snapshot
# ==========================

@pytest.mark.integration
class TestPortfolioToolInitialization:
    """Test basic initialization and snapshot behavior."""

    def test_initialization_binds_portfolio(self, base_portfolio):
        tool = PortfolioTool(portfolio=base_portfolio)
        assert tool.portfolio is base_portfolio
        assert tool.portfolio.agent_id == "agent_1"

    def test_get_portfolio_snapshot_is_deep_copy(self, portfolio_tool):
        snapshot = portfolio_tool.get_portfolio_snapshot()

        # Should not be the same object
        assert snapshot is not portfolio_tool.portfolio

        # But should have the same values initially
        assert snapshot.agent_id == portfolio_tool.portfolio.agent_id
        assert snapshot.cash == portfolio_tool.portfolio.cash

        # Mutating snapshot should NOT affect original
        snapshot.cash -= 1_000.0
        assert portfolio_tool.portfolio.cash != snapshot.cash


# ==========================
# Trade Updates
# ==========================

@pytest.mark.integration
class TestPortfolioToolTradeUpdates:
    """Test BUY/SELL behavior and agent_id validation."""

    def test_buy_updates_cash_and_holdings(self, portfolio_tool):
        pf = portfolio_tool.portfolio

        trade = Trade(
            trade_id=1,
            token="BTC",
            agent_id="agent_1",
            action="BUY",
            qty=1.0,
            price=1_000.0,
            confidence=0.9,
            summary="Test buy",
            timestamp=datetime.utcnow(),
            realized_pnl=None,
        )

        portfolio_tool.update_after_trade(trade)

        # Cash reduced by trade value
        assert pf.cash == pytest.approx(9_000.0)
        # Holdings increased
        assert pf.holdings["BTC"] == pytest.approx(1.0)
        # Trade count incremented
        assert pf.num_trades == 1
        # holdings_val is still 0 until recalc_holdings_value is called
        assert pf.holdings_val == pytest.approx(0.0)
        # total_value = cash + holdings_val
        assert pf.total_value == pytest.approx(9_000.0)
        # ROI reflects the drop from 10_000 → 9_000
        assert pf.roi == pytest.approx((9_000.0 - 10_000.0) / 10_000.0)

    def test_sell_reduces_holdings_and_closes_position(self, portfolio_tool):
        pf = portfolio_tool.portfolio

        # Seed with a position: 2 ETH (we don't care about holdings_val for this test)
        pf.holdings["ETH"] = 2.0

        sell_trade = Trade(
            trade_id=2,
            token="ETH",
            agent_id="agent_1",
            action="SELL",
            qty=2.0,
            price=500.0,
            confidence=0.8,
            summary="Close ETH position",
            timestamp=datetime.utcnow(),
            realized_pnl=0.0,
        )

        portfolio_tool.update_after_trade(sell_trade)

        # Position should be closed (no ETH key)
        assert "ETH" not in pf.holdings
        # Cash increased by 2 * 500
        assert pf.cash == pytest.approx(10_000.0 + 1_000.0)
        # Trades incremented
        assert pf.num_trades == 1
        # Realized PnL updated
        assert pf.realized_pnl == pytest.approx(0.0)

    def test_sell_partial_position_decrements_holdings(self, portfolio_tool):
        pf = portfolio_tool.portfolio

        pf.holdings["BTC"] = 3.0

        sell_trade = Trade(
            trade_id=3,
            token="BTC",
            agent_id="agent_1",
            action="SELL",
            qty=1.5,
            price=2_000.0,
            confidence=0.7,
            summary="Partial BTC sell",
            timestamp=datetime.utcnow(),
            realized_pnl=100.0,
        )

        portfolio_tool.update_after_trade(sell_trade)

        # Remaining quantity
        assert pf.holdings["BTC"] == pytest.approx(1.5)
        # Cash increased by 1.5 * 2_000
        assert pf.cash == pytest.approx(10_000.0 + 3_000.0)
        # Realized PnL accumulates
        assert pf.realized_pnl == pytest.approx(100.0)
        assert pf.num_trades == 1
        assert pf.num_winning_trades == 1
        assert pf.num_losing_trades == 0

    def test_trade_for_different_agent_is_ignored(self, portfolio_tool):
        pf = portfolio_tool.portfolio

        original_cash = pf.cash
        original_holdings = pf.holdings.copy()
        original_num_trades = pf.num_trades

        trade = Trade(
            trade_id=4,
            token="BTC",
            agent_id="other_agent",
            action="BUY",
            qty=1.0,
            price=1_000.0,
            confidence=0.5,
            summary="Should be ignored",
            timestamp=datetime.utcnow(),
            realized_pnl=None,
        )

        portfolio_tool.update_after_trade(trade)

        # No changes expected
        assert pf.cash == original_cash
        assert pf.holdings == original_holdings
        assert pf.num_trades == original_num_trades


# ==========================
# PnL & Metrics
# ==========================

@pytest.mark.integration
class TestPortfolioToolPnLAndMetrics:
    """Test realized/unrealized PnL, ROI, and win/loss counters."""

    def test_realized_pnl_and_win_loss_counts(self, portfolio_tool):
        pf = portfolio_tool.portfolio

        # Winning trade
        win_trade = Trade(
            trade_id=5,
            token="AAPL",
            agent_id="agent_1",
            action="SELL",
            qty=1.0,
            price=150.0,
            confidence=0.9,
            summary="Winning trade",
            timestamp=datetime.utcnow(),
            realized_pnl=50.0,
        )
        portfolio_tool.update_after_trade(win_trade)

        assert pf.realized_pnl == pytest.approx(50.0)
        assert pf.num_winning_trades == 1
        assert pf.num_losing_trades == 0
        assert pf.num_trades == 1
        assert pf.win_rate == pytest.approx(1.0)

        # Losing trade
        lose_trade = Trade(
            trade_id=6,
            token="MSFT",
            agent_id="agent_1",
            action="SELL",
            qty=1.0,
            price=100.0,
            confidence=0.6,
            summary="Losing trade",
            timestamp=datetime.utcnow(),
            realized_pnl=-20.0,
        )
        portfolio_tool.update_after_trade(lose_trade)

        assert pf.realized_pnl == pytest.approx(30.0)  # 50 - 20
        assert pf.num_winning_trades == 1
        assert pf.num_losing_trades == 1
        assert pf.num_trades == 2
        assert pf.win_rate == pytest.approx(0.5)

    def test_unrealized_pnl_and_roi_after_price_update(self, portfolio_tool):
        pf = portfolio_tool.portfolio

        # Buy 1 BTC at 1000
        buy_trade = Trade(
            trade_id=7,
            token="BTC",
            agent_id="agent_1",
            action="BUY",
            qty=1.0,
            price=1_000.0,
            confidence=0.9,
            summary="BTC buy",
            timestamp=datetime.utcnow(),
            realized_pnl=None,
        )
        portfolio_tool.update_after_trade(buy_trade)

        # Recalculate holdings with new market price
        portfolio_tool.recalculate_holdings_value({"BTC": 1_200.0})

        # holdings_val = 1 * 1_200
        assert pf.holdings_val == pytest.approx(1_200.0)

        expected_total = pf.cash + pf.holdings_val
        assert pf.total_value == pytest.approx(expected_total)

        expected_roi = (pf.total_value - pf.starting_val) / pf.starting_val
        assert pf.roi == pytest.approx(expected_roi)

        # All gains are unrealized (no realized_pnl yet)
        expected_unrealized = (pf.total_value - pf.starting_val) - pf.realized_pnl
        assert pf.unrealized_pnl == pytest.approx(expected_unrealized)


# ==========================
# Holdings Recalculation
# ==========================

@pytest.mark.integration
class TestPortfolioToolHoldingsRecalculation:
    """Test recalculation of holdings value with market prices."""

    def test_recalculate_holdings_value_skips_missing_prices(self, portfolio_tool):
        pf = portfolio_tool.portfolio
        pf.holdings = {"BTC": 1.0, "UNKNOWN": 5.0}
        pf.holdings_val = 0.0

        prices = {"BTC": 30_000.0}  # No price for UNKNOWN
        portfolio_tool.recalculate_holdings_value(prices)

        # Only BTC should contribute
        assert pf.holdings_val == pytest.approx(30_000.0)
        # total_value should be updated accordingly
        assert pf.total_value == pytest.approx(pf.cash + 30_000.0)

    def test_recalculate_holdings_value_is_case_insensitive(self, portfolio_tool):
        pf = portfolio_tool.portfolio
        pf.holdings = {"btc": 2.0}  # lower case symbol

        prices = {"BTC": 20_000.0}
        portfolio_tool.recalculate_holdings_value(prices)

        # Should still match via symbol.upper()
        assert pf.holdings_val == pytest.approx(40_000.0)

    def test_get_total_value_accessor(self, portfolio_tool):
        pf = portfolio_tool.portfolio

        # Set some manual state
        pf.cash = 5_000.0
        pf.holdings_val = 2_000.0
        portfolio_tool._recalculate_portfolio_metrics()

        total = portfolio_tool.get_total_value()
        assert total == pytest.approx(7_000.0)
