"""
Unit tests for MathTool - indicator calculations (non-TAAPI).

Run: pytest backend/tests/test_math_tool.py -v
"""

from typing import List, Dict

import pytest

from backend.app.agents.tools.math_tool import MathTool, MathToolError


class DummyMarketTool:
    """Minimal market tool stub that returns fixed price history."""

    def __init__(self, history: List[Dict[str, float]]):
        self._history = history

    def get_price_history(self, token: str, hours: int = 24):
        return self._history


@pytest.fixture
def price_history():
    prices = [100.0 + i for i in range(200)]
    return [{"timestamp": float(i), "price": price} for i, price in enumerate(prices)]


@pytest.fixture
def math_tool(price_history):
    market_tool = DummyMarketTool(price_history)
    return MathTool(market_tool=market_tool)


def _ema(values: List[float], period: int) -> float:
    alpha = 2.0 / (period + 1.0)
    ema = sum(values[:period]) / period
    for price in values[period:]:
        ema = (price - ema) * alpha + ema
    return float(ema)


class TestIndicators:
    def test_sma(self, math_tool, price_history):
        prices = [p["price"] for p in price_history]
        sma = math_tool.get_indicator("BTC", "sma", period=10)
        expected = sum(prices[-10:]) / 10
        assert sma == pytest.approx(expected)

    def test_ema(self, math_tool, price_history):
        prices = [p["price"] for p in price_history]
        ema = math_tool.get_indicator("BTC", "ema", period=10)
        expected = _ema(prices, 10)
        assert ema == pytest.approx(expected)

    def test_rsi_increasing_series(self, math_tool):
        rsi = math_tool.get_indicator("BTC", "rsi", period=14)
        assert isinstance(rsi, float)
        assert rsi > 70.0

    def test_macd_keys(self, math_tool):
        macd = math_tool.get_indicator("BTC", "macd")
        assert isinstance(macd, dict)
        assert set(macd.keys()) == {"macd", "signal", "histogram"}
        assert all(isinstance(value, float) for value in macd.values())

    def test_bbands_structure(self, math_tool, price_history):
        prices = [p["price"] for p in price_history]
        result = math_tool.get_indicator("BTC", "bbands", period=20, stddev=2.0)
        assert set(result.keys()) == {"upper", "middle", "lower"}
        expected_middle = sum(prices[-20:]) / 20
        assert result["middle"] == pytest.approx(expected_middle)
        assert result["upper"] > result["middle"]
        assert result["lower"] < result["middle"]

    def test_atr_linear_prices(self, math_tool):
        atr = math_tool.get_indicator("BTC", "atr", period=14)
        assert atr == pytest.approx(1.0)

    def test_volatility(self, math_tool):
        vol = math_tool.get_indicator("BTC", "volatility", period=20)
        assert isinstance(vol, float)
        assert vol >= 0.0

    def test_unsupported_indicator_raises(self, math_tool):
        with pytest.raises(MathToolError):
            math_tool.get_indicator("BTC", "adx")


class TestIndicatorSeries:
    def test_series_length_and_last_value(self, math_tool, price_history):
        prices = [p["price"] for p in price_history]
        series = math_tool.get_indicator_series("BTC", "sma", lookback=5, period=10)
        assert len(series) == 5
        expected_last = sum(prices[-10:]) / 10
        assert series[-1]["value"] == pytest.approx(expected_last)


class TestSignalSummary:
    def test_signal_summary_structure(self, math_tool):
        summary = math_tool.get_signal_summary("BTC")
        assert "score" in summary
        assert "bias" in summary
        assert "reasons" in summary
        assert summary["bias"] in {"bullish", "bearish", "neutral"}
