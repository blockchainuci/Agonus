"""
Unit tests for MakeTradeTool - simulated trade execution.

Run: pytest backend/tests/test_make_trade_tool.py -v
"""

import pytest
from unittest.mock import Mock, AsyncMock
from uuid import uuid4

from backend.app.agents.tools.make_trade_tool import MakeTradeTool, MakeTradeToolError
from backend.app.agents.data_classes import Portfolio


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
def mock_market_tool():
    """Create a mock market data tool with fixed prices."""
    market_tool = Mock()
    market_tool.get_price = Mock(side_effect=lambda token: {
        "WETH": 3000.0,
        "CBBTC": 60000.0,
        "ETH": 3000.0,
        "BTC": 60000.0,
    }.get(token.upper(), None))
    return market_tool


@pytest.fixture
def base_portfolio():
    """Create a base portfolio with $500 starting cash."""
    return Portfolio(
        agent_id="test_agent",
        cash=500.0,
        holdings={},
        starting_val=500.0,
        total_value=500.0,
    )


@pytest.fixture
def portfolio_with_holdings():
    """Create a portfolio with existing holdings."""
    return Portfolio(
        agent_id="test_agent",
        cash=200.0,
        holdings={"WETH": 0.1},  # 0.1 ETH worth ~$300
        starting_val=500.0,
        holdings_val=300.0,
        total_value=500.0,
    )


@pytest.fixture
def make_trade_tool(base_portfolio, mock_market_tool):
    """Create MakeTradeTool with mocked dependencies."""
    return MakeTradeTool(
        agent_id="test_agent",
        portfolio=base_portfolio,
        market_tool=mock_market_tool,
        database_tool=None,  # No DB for unit tests
        agent_uuid=None,
        tournament_uuid=None,
    )


@pytest.fixture
def make_trade_tool_with_holdings(portfolio_with_holdings, mock_market_tool):
    """Create MakeTradeTool with existing holdings."""
    return MakeTradeTool(
        agent_id="test_agent",
        portfolio=portfolio_with_holdings,
        market_tool=mock_market_tool,
        database_tool=None,
        agent_uuid=None,
        tournament_uuid=None,
    )


# ============================================================================
# VALIDATION TESTS
# ============================================================================


class TestValidation:
    """Test trade validation logic."""

    def test_valid_buy_trade(self, make_trade_tool):
        is_valid, reason = make_trade_tool.validate_trade("BUY", "WETH", 100.0)
        assert is_valid is True
        assert reason == "Trade validated"

    def test_valid_sell_trade(self, make_trade_tool_with_holdings):
        is_valid, reason = make_trade_tool_with_holdings.validate_trade("SELL", "WETH", 0.05)
        assert is_valid is True
        assert reason == "Trade validated"

    def test_invalid_action(self, make_trade_tool):
        is_valid, reason = make_trade_tool.validate_trade("HOLD", "WETH", 100.0)
        assert is_valid is False
        assert "Invalid action" in reason

    def test_unsupported_token(self, make_trade_tool):
        is_valid, reason = make_trade_tool.validate_trade("BUY", "DOGE", 100.0)
        assert is_valid is False
        assert "Unsupported token" in reason

    def test_insufficient_cash_for_buy(self, make_trade_tool):
        is_valid, reason = make_trade_tool.validate_trade("BUY", "WETH", 600.0)
        assert is_valid is False
        assert "Insufficient cash" in reason

    def test_insufficient_holdings_for_sell(self, make_trade_tool_with_holdings):
        is_valid, reason = make_trade_tool_with_holdings.validate_trade("SELL", "WETH", 1.0)
        assert is_valid is False
        assert "Insufficient WETH" in reason

    def test_zero_amount(self, make_trade_tool):
        is_valid, reason = make_trade_tool.validate_trade("BUY", "WETH", 0.0)
        assert is_valid is False
        assert "Invalid amount" in reason

    def test_negative_amount(self, make_trade_tool):
        is_valid, reason = make_trade_tool.validate_trade("BUY", "WETH", -100.0)
        assert is_valid is False
        assert "Invalid amount" in reason

    def test_risk_limit_exceeded(self, make_trade_tool):
        # With risk_score=0.5, max trade is 50% of $500 = $250
        is_valid, reason = make_trade_tool.validate_trade("BUY", "WETH", 300.0, risk_score=0.5)
        assert is_valid is False
        assert "exceeds risk limit" in reason

    def test_case_insensitive_action(self, make_trade_tool):
        is_valid, _ = make_trade_tool.validate_trade("buy", "WETH", 100.0)
        assert is_valid is True

    def test_case_insensitive_token(self, make_trade_tool):
        is_valid, _ = make_trade_tool.validate_trade("BUY", "weth", 100.0)
        assert is_valid is True


# ============================================================================
# BUY TRADE TESTS
# ============================================================================


class TestBuyTrades:
    """Test BUY trade execution."""

    @pytest.mark.asyncio
    async def test_basic_buy(self, make_trade_tool):
        trade = await make_trade_tool.execute_trade(
            action="BUY",
            token="WETH",
            amount=150.0,  # $150 USDC
            confidence=0.8,
            summary="Test buy",
        )

        # Check trade details
        assert trade.action == "BUY"
        assert trade.token == "WETH"
        assert trade.price == 3000.0
        assert trade.qty == pytest.approx(0.05)  # $150 / $3000 = 0.05 ETH
        assert trade.confidence == 0.8
        assert trade.summary == "Test buy"
        assert trade.tx_hash is None  # Simulated - no tx hash

        # Check portfolio updates
        assert make_trade_tool.portfolio.cash == pytest.approx(350.0)  # $500 - $150
        assert make_trade_tool.portfolio.holdings["WETH"] == pytest.approx(0.05)
        assert make_trade_tool.portfolio.num_trades == 1

    @pytest.mark.asyncio
    async def test_buy_adds_to_existing_holdings(self, make_trade_tool_with_holdings):
        await make_trade_tool_with_holdings.execute_trade(
            action="BUY",
            token="WETH",
            amount=60.0,  # $60 USDC = 0.02 ETH
            confidence=0.7,
            summary="Add to position",
        )

        # Should add to existing 0.1 ETH
        assert make_trade_tool_with_holdings.portfolio.holdings["WETH"] == pytest.approx(0.12)
        assert make_trade_tool_with_holdings.portfolio.cash == pytest.approx(140.0)  # $200 - $60

    @pytest.mark.asyncio
    async def test_buy_different_token(self, make_trade_tool_with_holdings):
        await make_trade_tool_with_holdings.execute_trade(
            action="BUY",
            token="CBBTC",
            amount=60.0,  # $60 USDC
            confidence=0.75,
            summary="Diversify into BTC",
        )

        # Should have both tokens
        assert "WETH" in make_trade_tool_with_holdings.portfolio.holdings
        assert "CBBTC" in make_trade_tool_with_holdings.portfolio.holdings
        assert make_trade_tool_with_holdings.portfolio.holdings["CBBTC"] == pytest.approx(0.001)  # $60 / $60000

    @pytest.mark.asyncio
    async def test_buy_updates_metrics(self, make_trade_tool):
        await make_trade_tool.execute_trade(
            action="BUY",
            token="WETH",
            amount=100.0,
            confidence=0.8,
            summary="Test",
        )

        status = make_trade_tool.get_portfolio_status()
        assert status["num_trades"] == 1
        assert status["cash"] == pytest.approx(400.0)
        assert "WETH" in status["holdings"]


# ============================================================================
# SELL TRADE TESTS
# ============================================================================


class TestSellTrades:
    """Test SELL trade execution."""

    @pytest.mark.asyncio
    async def test_basic_sell(self, make_trade_tool_with_holdings):
        trade = await make_trade_tool_with_holdings.execute_trade(
            action="SELL",
            token="WETH",
            amount=0.05,  # Sell half (0.05 of 0.1 ETH)
            confidence=0.75,
            summary="Take profit",
        )

        # Check trade details
        assert trade.action == "SELL"
        assert trade.token == "WETH"
        assert trade.qty == 0.05
        assert trade.price == 3000.0

        # Check portfolio updates
        assert make_trade_tool_with_holdings.portfolio.holdings["WETH"] == pytest.approx(0.05)
        assert make_trade_tool_with_holdings.portfolio.cash == pytest.approx(350.0)  # $200 + $150

    @pytest.mark.asyncio
    async def test_sell_all_removes_from_holdings(self, make_trade_tool_with_holdings):
        await make_trade_tool_with_holdings.execute_trade(
            action="SELL",
            token="WETH",
            amount=0.1,  # Sell all
            confidence=0.9,
            summary="Exit position",
        )

        # Holdings should be empty for WETH
        assert "WETH" not in make_trade_tool_with_holdings.portfolio.holdings
        assert make_trade_tool_with_holdings.portfolio.cash == pytest.approx(500.0)  # $200 + $300

    @pytest.mark.asyncio
    async def test_sell_calculates_realized_pnl(self, make_trade_tool):
        # First buy at $3000
        await make_trade_tool.execute_trade(
            action="BUY",
            token="WETH",
            amount=300.0,  # Buy 0.1 ETH at $3000
            confidence=0.8,
            summary="Initial buy",
        )

        # Change price to $3500
        make_trade_tool.market_tool.get_price = Mock(return_value=3500.0)

        # Sell at higher price
        trade = await make_trade_tool.execute_trade(
            action="SELL",
            token="WETH",
            amount=0.1,  # Sell all
            confidence=0.9,
            summary="Take profit",
        )

        # PnL: (3500 - 3000) * 0.1 = $50
        assert trade.realized_pnl == pytest.approx(50.0)
        assert make_trade_tool.portfolio.realized_pnl == pytest.approx(50.0)
        assert make_trade_tool.portfolio.num_winning_trades == 1

    @pytest.mark.asyncio
    async def test_sell_losing_trade(self, make_trade_tool):
        # First buy at $3000
        await make_trade_tool.execute_trade(
            action="BUY",
            token="WETH",
            amount=300.0,
            confidence=0.8,
            summary="Initial buy",
        )

        # Change price to $2500 (price dropped)
        make_trade_tool.market_tool.get_price = Mock(return_value=2500.0)

        # Sell at lower price
        trade = await make_trade_tool.execute_trade(
            action="SELL",
            token="WETH",
            amount=0.1,
            confidence=0.6,
            summary="Cut losses",
        )

        # PnL: (2500 - 3000) * 0.1 = -$50
        assert trade.realized_pnl == pytest.approx(-50.0)
        assert make_trade_tool.portfolio.realized_pnl == pytest.approx(-50.0)
        assert make_trade_tool.portfolio.num_losing_trades == 1


# ============================================================================
# FIFO PNL CALCULATION TESTS
# ============================================================================


class TestFIFOPnL:
    """Test FIFO (First In First Out) PnL calculation."""

    @pytest.mark.asyncio
    async def test_fifo_multiple_buys(self, make_trade_tool):
        # Buy 1: 0.05 ETH at $3000
        await make_trade_tool.execute_trade("BUY", "WETH", 150.0, 0.8, "First buy")

        # Change price to $3200
        make_trade_tool.market_tool.get_price = Mock(return_value=3200.0)

        # Buy 2: 0.05 ETH at $3200
        await make_trade_tool.execute_trade("BUY", "WETH", 160.0, 0.8, "Second buy")

        # Change price to $3500
        make_trade_tool.market_tool.get_price = Mock(return_value=3500.0)

        # Sell first lot (FIFO - should use $3000 cost basis)
        trade = await make_trade_tool.execute_trade("SELL", "WETH", 0.05, 0.9, "Sell first lot")

        # PnL: (3500 - 3000) * 0.05 = $25
        assert trade.realized_pnl == pytest.approx(25.0)

    @pytest.mark.asyncio
    async def test_fifo_partial_lot(self, make_trade_tool):
        # Buy 0.1 ETH at $3000
        await make_trade_tool.execute_trade("BUY", "WETH", 300.0, 0.8, "Initial buy")

        # Change price to $3300
        make_trade_tool.market_tool.get_price = Mock(return_value=3300.0)

        # Sell half
        trade = await make_trade_tool.execute_trade("SELL", "WETH", 0.05, 0.85, "Partial sell")

        # PnL: (3300 - 3000) * 0.05 = $15
        assert trade.realized_pnl == pytest.approx(15.0)

        # Sell remaining half
        trade2 = await make_trade_tool.execute_trade("SELL", "WETH", 0.05, 0.85, "Sell rest")

        # PnL: (3300 - 3000) * 0.05 = $15
        assert trade2.realized_pnl == pytest.approx(15.0)


# ============================================================================
# PORTFOLIO METRICS TESTS
# ============================================================================


class TestPortfolioMetrics:
    """Test portfolio metrics calculations."""

    @pytest.mark.asyncio
    async def test_roi_calculation(self, make_trade_tool):
        # Buy some ETH
        await make_trade_tool.execute_trade("BUY", "WETH", 250.0, 0.8, "Buy")

        # Price goes up 10%
        make_trade_tool.market_tool.get_price = Mock(return_value=3300.0)
        make_trade_tool.recalculate_holdings_value()

        # Holdings now worth: 0.0833 * 3300 = ~$275
        # Total value: $250 + $275 = ~$525
        # ROI: (525 - 500) / 500 = 5%
        assert make_trade_tool.portfolio.roi == pytest.approx(0.05, rel=0.01)

    @pytest.mark.asyncio
    async def test_win_rate_calculation(self, make_trade_tool):
        # Execute trades
        await make_trade_tool.execute_trade("BUY", "WETH", 150.0, 0.8, "Buy 1")

        make_trade_tool.market_tool.get_price = Mock(return_value=3500.0)
        await make_trade_tool.execute_trade("SELL", "WETH", 0.025, 0.9, "Win")  # Winner

        make_trade_tool.market_tool.get_price = Mock(return_value=2800.0)
        await make_trade_tool.execute_trade("SELL", "WETH", 0.025, 0.6, "Loss")  # Loser

        # 1 win, 1 loss out of 3 trades (1 buy + 2 sells)
        # But win_rate is based on winning vs losing trades only
        assert make_trade_tool.portfolio.num_winning_trades == 1
        assert make_trade_tool.portfolio.num_losing_trades == 1
        assert make_trade_tool.portfolio.win_rate == pytest.approx(1/3)  # 1 win / 3 total trades

    def test_get_portfolio_status(self, make_trade_tool_with_holdings):
        status = make_trade_tool_with_holdings.get_portfolio_status()

        assert "cash" in status
        assert "holdings" in status
        assert "total_value" in status
        assert "roi" in status
        assert "num_trades" in status
        assert "win_rate" in status

        assert status["cash"] == 200.0
        assert status["holdings"]["WETH"] == 0.1


# ============================================================================
# ERROR HANDLING TESTS
# ============================================================================


class TestErrorHandling:
    """Test error handling scenarios."""

    @pytest.mark.asyncio
    async def test_validation_error_raises_exception(self, make_trade_tool):
        with pytest.raises(MakeTradeToolError) as exc_info:
            await make_trade_tool.execute_trade(
                action="BUY",
                token="WETH",
                amount=1000.0,  # More than available
                confidence=0.8,
                summary="Should fail",
            )
        assert "Insufficient cash" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_price_fetch_error(self, make_trade_tool):
        make_trade_tool.market_tool.get_price = Mock(return_value=None)

        with pytest.raises(MakeTradeToolError) as exc_info:
            await make_trade_tool.execute_trade(
                action="BUY",
                token="WETH",
                amount=100.0,
                confidence=0.8,
                summary="Should fail",
            )
        assert "Could not fetch price" in str(exc_info.value)


# ============================================================================
# DATABASE INTEGRATION TESTS
# ============================================================================


class TestDatabaseIntegration:
    """Test database save functionality."""

    @pytest.mark.asyncio
    async def test_trade_saved_to_database(self, base_portfolio, mock_market_tool):
        # Create mock database tool
        mock_db = AsyncMock()
        mock_db.save_trade = AsyncMock(return_value=uuid4())

        tool = MakeTradeTool(
            agent_id="test_agent",
            portfolio=base_portfolio,
            market_tool=mock_market_tool,
            database_tool=mock_db,
            agent_uuid=uuid4(),
            tournament_uuid=uuid4(),
        )

        await tool.execute_trade("BUY", "WETH", 100.0, 0.8, "Test")

        # Verify database was called
        mock_db.save_trade.assert_called_once()

    @pytest.mark.asyncio
    async def test_database_error_doesnt_fail_trade(self, base_portfolio, mock_market_tool):
        # Create mock database tool that raises an error
        mock_db = AsyncMock()
        mock_db.save_trade = AsyncMock(side_effect=Exception("DB connection failed"))

        tool = MakeTradeTool(
            agent_id="test_agent",
            portfolio=base_portfolio,
            market_tool=mock_market_tool,
            database_tool=mock_db,
            agent_uuid=uuid4(),
            tournament_uuid=uuid4(),
        )

        # Trade should still succeed even if DB fails
        trade = await tool.execute_trade("BUY", "WETH", 100.0, 0.8, "Test")
        assert trade is not None
        assert tool.portfolio.cash == pytest.approx(400.0)
