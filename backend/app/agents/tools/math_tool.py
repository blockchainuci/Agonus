from __future__ import annotations

import logging
from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple, Union, Literal

from cachetools import TTLCache

from .market_data_tool import MarketDataTool

logger = logging.getLogger(__name__)

Timeframe = Literal["1m", "5m", "15m", "1h", "4h", "1d"]

IndicatorName = Literal[
    "rsi",
    "sma",
    "ema",
    "macd",
    "bbands",
    "atr",
    "volatility",
]

IndicatorValue = Union[float, Dict[str, float]]
IndicatorSeriesPoint = Dict[str, float]
IndicatorSeries = List[IndicatorSeriesPoint]
SignalSummary = Dict[str, Any]


class MathToolError(Exception):
    """Custom exception for MathTool errors."""


class MathTool:
    """
    Compute and cache technical indicators for trading agents.

    This tool focuses on math/indicator logic and delegates market data
    retrieval to MarketDataTool. It also provides caching so repeated
    indicator requests do not spam external APIs.
    """

    def __init__(
        self,
        market_tool: MarketDataTool,
        supported_tokens: Optional[Mapping[str, str]] = None,
        default_timeframe: Timeframe = "1h",
        default_periods: Optional[Dict[str, int]] = None,
        cache_maxsize: int = 1024,
        cache_ttl_by_timeframe: Optional[Dict[Timeframe, int]] = None,
    ) -> None:
        """
        Initialize MathTool.

        Args:
            market_tool: MarketDataTool instance used to fetch price history.
            supported_tokens: Optional mapping of supported token symbols
                (e.g., {"BTC": "bitcoin"}). If not provided, the tool will
                attempt to reuse market_tool.supported_tokens.
            default_timeframe: Time bucket used when no timeframe is provided
                (e.g., "1h").
            default_periods: Optional default periods for indicators such as
                RSI, SMA, EMA, MACD, etc. If None, sensible defaults are used.
            cache_maxsize: Max number of cached entries kept in memory.
            cache_ttl_by_timeframe: Mapping of timeframe -> TTL seconds for
                cached indicator results. If None, defaults are used.

        Returns:
            None
        """
        self.market_tool = market_tool
        self.supported_tokens = supported_tokens or getattr(
            market_tool, "supported_tokens", {}
        )
        self.default_timeframe = default_timeframe
        self.default_periods = default_periods or {
            "rsi": 14,
            "sma": 50,
            "ema": 20,
            "macd_fast": 12,
            "macd_slow": 26,
            "macd_signal": 9,
            "bbands": 20,
            "atr": 14,
            "volatility": 20,
        }
        self.cache = TTLCache(maxsize=cache_maxsize, ttl=60)
        self.cache_ttl_by_timeframe = cache_ttl_by_timeframe or {
            "1m": 30,
            "5m": 60,
            "15m": 120,
            "1h": 300,
            "4h": 900,
            "1d": 3600,
        }

        logger.info("MathTool initialized")

    def get_indicator(
        self,
        token: str,
        indicator: IndicatorName,
        timeframe: Optional[Timeframe] = None,
        period: Optional[int] = None,
        lookback: Optional[int] = None,
        **params: Any,
    ) -> IndicatorValue:
        """
        Compute a single indicator value for a token.

        Args:
            token: Token symbol (e.g., "BTC", "ETH").
            indicator: Indicator name (e.g., "rsi", "sma", "macd").
            timeframe: Candle granularity. If None, uses default_timeframe.
            period: Lookback period for the indicator (e.g., 14 for RSI).
                If None, uses default_periods for the chosen indicator.
            lookback: Optional override to request more historical points
                than the bare minimum for the indicator.
            **params: Additional indicator-specific parameters.

        Returns:
            The computed indicator value. Some indicators return a float,
            while others return a dict of values (e.g., MACD).

        Raises:
            MathToolError: If the token or indicator is unsupported, or if
                the calculation fails.
        """
        pass

    def get_indicators(
        self,
        token: str,
        indicators: Sequence[IndicatorName],
        timeframe: Optional[Timeframe] = None,
        period_overrides: Optional[Mapping[IndicatorName, int]] = None,
        **params: Any,
    ) -> Dict[str, IndicatorValue]:
        """
        Compute multiple indicators for a token in one call.

        Args:
            token: Token symbol (e.g., "BTC", "ETH").
            indicators: List of indicator names to compute.
            timeframe: Candle granularity. If None, uses default_timeframe.
            period_overrides: Optional mapping of indicator -> custom period.
                This lets callers override default periods for specific
                indicators.
            **params: Additional indicator-specific parameters.

        Returns:
            Dictionary mapping indicator name -> computed value.

        Raises:
            MathToolError: If any indicator or token is unsupported.
        """
        pass

    def get_indicator_series(
        self,
        token: str,
        indicator: IndicatorName,
        lookback: int,
        timeframe: Optional[Timeframe] = None,
        period: Optional[int] = None,
        **params: Any,
    ) -> IndicatorSeries:
        """
        Compute an indicator series across time.

        Args:
            token: Token symbol (e.g., "BTC", "ETH").
            indicator: Indicator name (e.g., "rsi", "sma").
            lookback: Number of points to return in the series.
            timeframe: Candle granularity. If None, uses default_timeframe.
            period: Lookback period for the indicator; if None, uses defaults.
            **params: Additional indicator-specific parameters.

        Returns:
            List of {timestamp, value} points, ordered from oldest to newest.

        Raises:
            MathToolError: If token or indicator is unsupported.
        """
        pass

    def get_signal_summary(
        self,
        token: str,
        timeframe: Optional[Timeframe] = None,
    ) -> SignalSummary:
        """
        Build a simple signal summary for the agent.

        This method is meant to provide a high-level decision aid by
        combining several indicators (e.g., RSI, trend, MACD) into a compact
        structure the agent can reason about quickly.

        Args:
            token: Token symbol (e.g., "BTC", "ETH").
            timeframe: Candle granularity. If None, uses default_timeframe.

        Returns:
            Dictionary describing the signal, e.g.:
            {
                "score": 0.63,
                "bias": "bullish",
                "reasons": ["RSI > 50", "EMA(20) > EMA(50)"]
            }

        Raises:
            MathToolError: If token is unsupported or calculations fail.
        """
        pass

    def _get_price_series(self, token: str, hours: int) -> List[float]:
        """
        Fetch historical prices for a token and return a numeric list.

        Args:
            token: Token symbol (e.g., "BTC", "ETH").
            hours: Number of hours of history to request.

        Returns:
            List of prices ordered from oldest to newest.

        Raises:
            MathToolError: If price data cannot be fetched or parsed.
        """
        pass

    def _compute_rsi(self, prices: Sequence[float], period: int) -> float:
        """
        Compute the Relative Strength Index (RSI).

        Args:
            prices: Sequence of historical prices ordered oldest -> newest.
            period: RSI lookback period, commonly 14.

        Returns:
            RSI value in the range [0, 100].

        Raises:
            MathToolError: If there is not enough data.
        """
        pass

    def _compute_sma(self, prices: Sequence[float], period: int) -> float:
        """
        Compute the Simple Moving Average (SMA).

        Args:
            prices: Sequence of historical prices ordered oldest -> newest.
            period: Number of points used for the average.

        Returns:
            SMA value as a float.

        Raises:
            MathToolError: If there is not enough data.
        """
        pass
    def _compute_ema(self, prices: Sequence[float], period: int) -> float:
        """
        Compute the Exponential Moving Average (EMA).

        Args:
            prices: Sequence of historical prices ordered oldest -> newest.
            period: EMA lookback period.

        Returns:
            EMA value as a float.

        Raises:
            MathToolError: If there is not enough data.
        """
        pass

    def _compute_macd(
        self,
        prices: Sequence[float],
        fast: int = 12,
        slow: int = 26,
        signal: int = 9,
    ) -> Dict[str, float]:
        """
        Compute MACD (Moving Average Convergence Divergence).

        Args:
            prices: Sequence of historical prices ordered oldest -> newest.
            fast: Fast EMA period (commonly 12).
            slow: Slow EMA period (commonly 26).
            signal: Signal EMA period (commonly 9).

        Returns:
            Dict with keys: "macd", "signal", "histogram".

        Raises:
            MathToolError: If there is not enough data.
        """
        pass

    def _compute_bbands(
        self,
        prices: Sequence[float],
        period: int = 20,
        stddev: float = 2.0,
    ) -> Dict[str, float]:
        """
        Compute Bollinger Bands.

        Args:
            prices: Sequence of historical prices ordered oldest -> newest.
            period: Lookback period for the SMA.
            stddev: Number of standard deviations for band width.

        Returns:
            Dict with keys: "upper", "middle", "lower".

        Raises:
            MathToolError: If there is not enough data.
        """
        pass

    def _compute_atr(
        self,
        highs: Sequence[float],
        lows: Sequence[float],
        closes: Sequence[float],
        period: int = 14,
    ) -> float:
        """
        Compute Average True Range (ATR).

        Args:
            highs: High prices ordered oldest -> newest.
            lows: Low prices ordered oldest -> newest.
            closes: Close prices ordered oldest -> newest.
            period: Lookback period for ATR.

        Returns:
            ATR value as a float.

        Raises:
            MathToolError: If there is not enough data.
        """
        pass

    def _compute_volatility(self, prices: Sequence[float], period: int = 20) -> float:
        """
        Compute rolling volatility using standard deviation of returns.

        Args:
            prices: Sequence of historical prices ordered oldest -> newest.
            period: Lookback period for volatility calculation.

        Returns:
            Volatility value as a float.

        Raises:
            MathToolError: If there is not enough data.
        """
        pass

    def _cache_get(self, key: str) -> Optional[Any]:
        """
        Retrieve a cached value by key.

        Args:
            key: Cache key string.

        Returns:
            Cached value if present and not expired, otherwise None.
        """
        return self.cache.get(key)

    def _cache_set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Store a value in the cache.

        Args:
            key: Cache key string.
            value: Value to store in cache.
            ttl: Optional override for TTL in seconds. If None, the cache's
                default TTL is used.

        Returns:
            None
        """
        if ttl is not None:
            self.cache.ttl = ttl
        self.cache[key] = value
