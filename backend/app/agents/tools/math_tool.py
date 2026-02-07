from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple, Union, Literal

from cachetools import TTLCache
import requests
import numpy as np

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
TaapiResponse = Dict[str, Any]


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
        taapi_base_url: Optional[str] = None,
        taapi_key_env: str = "TAAPI_API_KEY",
        taapi_key: Optional[str] = None,
        taapi_timeout: int = 15,
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
            taapi_base_url: Base URL for TAAPI indicator endpoints.
            taapi_key_env: Environment variable name used to look up the TAAPI key.
            taapi_key: Optional explicit TAAPI key override. If None, the value
                is pulled from the environment variable.
            taapi_timeout: HTTP timeout (seconds) for TAAPI requests.

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
        self._taapi_base_url = taapi_base_url or "https://api.taapi.io"
        self._taapi_key_env = taapi_key_env
        self._taapi_key = taapi_key or os.getenv(taapi_key_env)
        self._taapi_timeout = taapi_timeout

        logger.info("MathTool initialized")

    def get_indicator(
        self,
        token: str,
        indicator: str,
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
        token_upper = token.upper()
        indicator_lower = indicator.lower()
        timeframe = timeframe or self.default_timeframe

        cache_key = f"indicator:{token_upper}:{indicator_lower}:{timeframe}:{period}:{lookback}:{sorted(params.items())}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached

        local_indicators = {
            "rsi",
            "sma",
            "ema",
            "macd",
            "bbands",
            "atr",
            "volatility",
        }

        if indicator_lower not in local_indicators:
            exchange = params.pop("exchange", "binance")
            symbol = params.pop("symbol", None)
            response = self._fetch_taapi_indicator(
                indicator=indicator_lower,
                token=token_upper,
                exchange=exchange,
                interval=timeframe,
                symbol=symbol,
                **params,
            )
            self._cache_set(cache_key, response, self.cache_ttl_by_timeframe.get(timeframe))
            return response

        timeframe_minutes = {
            "1m": 1,
            "5m": 5,
            "15m": 15,
            "1h": 60,
            "4h": 240,
            "1d": 1440,
        }

        if indicator_lower == "macd":
            fast = int(params.get("fast", self.default_periods["macd_fast"]))
            slow = int(params.get("slow", self.default_periods["macd_slow"]))
            signal = int(params.get("signal", self.default_periods["macd_signal"]))
            required_points = slow + signal
        else:
            default_period = int(self.default_periods.get(indicator_lower, 14))
            period = int(period) if period is not None else default_period
            required_points = period + 1 if indicator_lower in {"rsi", "volatility"} else period

        if lookback:
            required_points = max(required_points, int(lookback))

        hours = max(1, int(np.ceil(required_points * timeframe_minutes[timeframe] / 60)))
        prices = self._get_price_series(token_upper, hours)

        if indicator_lower == "rsi":
            result = self._compute_rsi(prices, period)
        elif indicator_lower == "sma":
            result = self._compute_sma(prices, period)
        elif indicator_lower == "ema":
            result = self._compute_ema(prices, period)
        elif indicator_lower == "macd":
            result = self._compute_macd(prices, fast=fast, slow=slow, signal=signal)
        elif indicator_lower == "bbands":
            stddev = float(params.get("stddev", 2.0))
            result = self._compute_bbands(prices, period=period, stddev=stddev)
        elif indicator_lower == "atr":
            result = self._compute_atr(prices, prices, prices, period=period)
        elif indicator_lower == "volatility":
            result = self._compute_volatility(prices, period=period)
        else:
            raise MathToolError(f"Unsupported indicator: {indicator}")

        self._cache_set(cache_key, result, self.cache_ttl_by_timeframe.get(timeframe))
        return result

    def get_indicators(
        self,
        token: str,
        indicators: Sequence[str],
        timeframe: Optional[Timeframe] = None,
        period_overrides: Optional[Mapping[str, int]] = None,
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
        results: Dict[str, IndicatorValue] = {}
        period_overrides = period_overrides or {}

        for indicator in indicators:
            override_period = period_overrides.get(indicator)
            results[indicator] = self.get_indicator(
                token=token,
                indicator=indicator,
                timeframe=timeframe,
                period=override_period,
                **params,
            )

        return results

    def get_indicator_series(
        self,
        token: str,
        indicator: str,
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
        indicator_lower = indicator.lower()
        timeframe = timeframe or self.default_timeframe

        local_indicators = {
            "rsi",
            "sma",
            "ema",
            "macd",
            "bbands",
            "atr",
            "volatility",
        }
        if indicator_lower not in local_indicators:
            raise MathToolError(
                f"Indicator series not supported for TAAPI fallback: {indicator}"
            )

        timeframe_minutes = {
            "1m": 1,
            "5m": 5,
            "15m": 15,
            "1h": 60,
            "4h": 240,
            "1d": 1440,
        }

        if indicator_lower == "macd":
            fast = int(params.get("fast", self.default_periods["macd_fast"]))
            slow = int(params.get("slow", self.default_periods["macd_slow"]))
            signal = int(params.get("signal", self.default_periods["macd_signal"]))
            required_points = slow + signal
            period = None
        else:
            default_period = int(self.default_periods.get(indicator_lower, 14))
            period = int(period) if period is not None else default_period
            required_points = period + 1 if indicator_lower in {"rsi", "volatility"} else period

        min_points = required_points + lookback - 1
        hours = max(1, int(np.ceil(min_points * timeframe_minutes[timeframe] / 60)))

        history = self.market_tool.get_price_history(token, hours=hours)
        if not history:
            raise MathToolError(f"Price history unavailable for {token}.")

        prices = [float(point["price"]) for point in history if "price" in point]
        timestamps = [float(point["timestamp"]) for point in history if "timestamp" in point]

        if len(prices) < min_points:
            raise MathToolError(
                f"Not enough data to build series. Need {min_points} points, got {len(prices)}."
            )

        series: IndicatorSeries = []
        start_index = len(prices) - lookback
        for idx in range(start_index, len(prices)):
            window = prices[: idx + 1]
            if indicator_lower == "rsi":
                value = self._compute_rsi(window, period)
            elif indicator_lower == "sma":
                value = self._compute_sma(window, period)
            elif indicator_lower == "ema":
                value = self._compute_ema(window, period)
            elif indicator_lower == "macd":
                value = self._compute_macd(window, fast=fast, slow=slow, signal=signal)
                value = value.get("macd", 0.0)
            elif indicator_lower == "bbands":
                stddev = float(params.get("stddev", 2.0))
                value = self._compute_bbands(window, period=period, stddev=stddev)
                value = value.get("middle", 0.0)
            elif indicator_lower == "atr":
                value = self._compute_atr(window, window, window, period=period)
            elif indicator_lower == "volatility":
                value = self._compute_volatility(window, period=period)
            else:
                raise MathToolError(f"Unsupported indicator: {indicator}")

            series.append(
                {
                    "timestamp": timestamps[idx] if idx < len(timestamps) else float(idx),
                    "value": float(value),
                }
            )

        return series

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
        timeframe = timeframe or self.default_timeframe

        rsi = self.get_indicator(token, "rsi", timeframe=timeframe)
        macd = self.get_indicator(token, "macd", timeframe=timeframe)
        ema_fast = self.get_indicator(token, "ema", timeframe=timeframe, period=12)
        ema_slow = self.get_indicator(token, "ema", timeframe=timeframe, period=26)

        reasons: List[str] = []
        score = 0.0

        if isinstance(rsi, float):
            if rsi > 60:
                score += 0.3
                reasons.append("RSI > 60")
            elif rsi < 40:
                score -= 0.3
                reasons.append("RSI < 40")

        macd_hist = 0.0
        if isinstance(macd, dict):
            macd_hist = float(macd.get("histogram", 0.0))
            if macd_hist > 0:
                score += 0.3
                reasons.append("MACD histogram positive")
            elif macd_hist < 0:
                score -= 0.3
                reasons.append("MACD histogram negative")

        if isinstance(ema_fast, float) and isinstance(ema_slow, float):
            if ema_fast > ema_slow:
                score += 0.4
                reasons.append("EMA(12) > EMA(26)")
            elif ema_fast < ema_slow:
                score -= 0.4
                reasons.append("EMA(12) < EMA(26)")

        if score > 0.2:
            bias = "bullish"
        elif score < -0.2:
            bias = "bearish"
        else:
            bias = "neutral"

        return {
            "score": round(score, 3),
            "bias": bias,
            "reasons": reasons,
            "rsi": rsi,
            "macd": macd,
            "ema_fast": ema_fast,
            "ema_slow": ema_slow,
        }

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
        history = self.market_tool.get_price_history(token, hours=hours)
        if not history:
            raise MathToolError(f"Price history unavailable for {token}.")

        try:
            prices = [float(point["price"]) for point in history if "price" in point]
        except (KeyError, TypeError, ValueError) as exc:
            raise MathToolError("Failed to parse price history data.") from exc

        if not prices:
            raise MathToolError("Price history returned no usable data.")

        return prices

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
        if period <= 0:
            raise MathToolError("RSI period must be positive.")
        if len(prices) < period + 1:
            raise MathToolError(
                f"Not enough price data for RSI. Need at least {period + 1} points."
            )

        price_array = np.asarray(prices, dtype=float)
        deltas = np.diff(price_array)
        gains = np.where(deltas > 0, deltas, 0.0)
        losses = np.where(deltas < 0, -deltas, 0.0)

        avg_gain = np.mean(gains[:period])
        avg_loss = np.mean(losses[:period])

        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        if avg_loss == 0:
            return 100.0

        rs = avg_gain / avg_loss
        rsi = 100.0 - (100.0 / (1.0 + rs))
        return float(rsi)

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
        if period <= 0:
            raise MathToolError("SMA period must be positive.")
        if len(prices) < period:
            raise MathToolError(
                f"Not enough price data for SMA. Need at least {period} points."
            )
        window = np.asarray(prices[-period:], dtype=float)
        return float(np.mean(window))
    
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
        if period <= 0:
            raise MathToolError("EMA period must be positive.")
        if len(prices) < period:
            raise MathToolError(
                f"Not enough price data for EMA. Need at least {period} points."
            )

        price_array = np.asarray(prices, dtype=float)
        alpha = 2.0 / (period + 1.0)
        ema = np.mean(price_array[:period])
        for price in price_array[period:]:
            ema = (price - ema) * alpha + ema
        return float(ema)

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
        if fast <= 0 or slow <= 0 or signal <= 0:
            raise MathToolError("MACD periods must be positive.")
        if fast >= slow:
            raise MathToolError("MACD fast period must be less than slow period.")
        if len(prices) < slow + signal:
            raise MathToolError(
                f"Not enough price data for MACD. Need at least {slow + signal} points."
            )

        price_array = np.asarray(prices, dtype=float)

        def _ema_series(values: np.ndarray, period: int) -> np.ndarray:
            alpha = 2.0 / (period + 1.0)
            ema_values = np.zeros_like(values)
            ema_values[:period] = np.mean(values[:period])
            for i in range(period, len(values)):
                ema_values[i] = (values[i] - ema_values[i - 1]) * alpha + ema_values[i - 1]
            return ema_values

        ema_fast = _ema_series(price_array, fast)
        ema_slow = _ema_series(price_array, slow)
        macd_line = ema_fast - ema_slow
        signal_line = _ema_series(macd_line, signal)
        histogram = macd_line[-1] - signal_line[-1]

        return {
            "macd": float(macd_line[-1]),
            "signal": float(signal_line[-1]),
            "histogram": float(histogram),
        }

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
        if period <= 0:
            raise MathToolError("BBands period must be positive.")
        if len(prices) < period:
            raise MathToolError(
                f"Not enough price data for BBands. Need at least {period} points."
            )

        window = np.asarray(prices[-period:], dtype=float)
        middle = float(np.mean(window))
        deviation = float(np.std(window, ddof=0))
        upper = middle + (stddev * deviation)
        lower = middle - (stddev * deviation)
        return {"upper": upper, "middle": middle, "lower": lower}

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
        if period <= 0:
            raise MathToolError("ATR period must be positive.")
        if len(highs) != len(lows) or len(highs) != len(closes):
            raise MathToolError("Highs, lows, and closes must be the same length.")
        if len(highs) < period + 1:
            raise MathToolError(
                f"Not enough data for ATR. Need at least {period + 1} points."
            )

        highs_arr = np.asarray(highs, dtype=float)
        lows_arr = np.asarray(lows, dtype=float)
        closes_arr = np.asarray(closes, dtype=float)

        true_ranges = []
        for i in range(1, len(highs_arr)):
            high = highs_arr[i]
            low = lows_arr[i]
            prev_close = closes_arr[i - 1]
            tr = max(
                high - low,
                abs(high - prev_close),
                abs(low - prev_close),
            )
            true_ranges.append(tr)

        tr_window = np.asarray(true_ranges[-period:], dtype=float)
        return float(np.mean(tr_window))

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
        if period <= 0:
            raise MathToolError("Volatility period must be positive.")
        if len(prices) < period + 1:
            raise MathToolError(
                f"Not enough price data for volatility. Need at least {period + 1} points."
            )

        price_array = np.asarray(prices, dtype=float)
        log_returns = np.diff(np.log(price_array))
        window = log_returns[-period:]
        return float(np.std(window, ddof=0))

    def _ensure_taapi_configured(self) -> None:
        """
        Ensure TAAPI credentials are available before making API calls.

        This method checks whether a TAAPI API key is configured either via
        the provided taapi_key argument or via the environment variable
        specified by taapi_key_env. It raises an error if the key is missing.

        Args:
            None

        Returns:
            None

        Raises:
            MathToolError: If TAAPI credentials are not configured.
        """
        if not self._taapi_key:
            raise MathToolError(
                f"TAAPI API key not configured. Set {self._taapi_key_env} or pass taapi_key."
            )

    def _taapi_endpoint_for_indicator(self, indicator: str) -> str:
        """
        Resolve a user-requested indicator name into a TAAPI endpoint slug.

        This method normalizes user input (case/spacing) and maps common
        indicator names to TAAPI endpoints. If no explicit mapping exists,
        it falls back to a normalized slug based on the input.

        Args:
            indicator: Human-friendly indicator name (e.g., "Relative Strength Index",
                "RSI", "macd", "Bollinger Bands").

        Returns:
            TAAPI endpoint slug (e.g., "rsi", "macd", "bbands").

        Raises:
            MathToolError: If the indicator string is empty.
        """
        normalized = indicator.strip().lower()
        if not normalized:
            raise MathToolError("Indicator name cannot be empty.")

        #dict of common TAAPI indicators that won't be implemented by us in the previous helper methods
        alias_map = {
            "average directional index": "adx",
            "adx": "adx",
            "commodity channel index": "cci",
            "cci": "cci",
            "stochastic oscillator": "stoch",
            "stoch": "stoch",
            "stochastic rsi": "stochrsi",
            "stochrsi": "stochrsi",
            "on balance volume": "obv",
            "obv": "obv",
            "volume weighted average price": "vwap",
            "vwap": "vwap",
            "ichimoku cloud": "ichimoku",
            "ichimoku": "ichimoku",
            "parabolic sar": "sar",
            "sar": "sar",
            "williams %r": "williamsr",
            "williamsr": "williamsr",
            "momentum": "mom",
            "mom": "mom",
            "rate of change": "roc",
            "roc": "roc",
            "trix": "trix",
            "chaikin a/d line": "ad",
            "ad": "ad",
            "chaikin a/d oscillator": "adosc",
            "adosc": "adosc",
            "money flow index": "mfi",
            "mfi": "mfi",
            "supertrend": "supertrend",
            "donchian channels": "donchian",
            "donchian": "donchian",
            "keltner channels": "kc",
            "keltner": "kc",
            "heikin ashi": "heikinashi",
            "heikinashi": "heikinashi",
        }

        if normalized in alias_map:
            return alias_map[normalized]

        slug = normalized.replace(" ", "")
        return slug

    def _taapi_request(self, endpoint: str, params: Mapping[str, Any]) -> TaapiResponse:
        """
        Perform a GET request to a TAAPI endpoint.

        This method adds authentication parameters, sends the HTTP request,
        and returns the parsed JSON response. It centralizes TAAPI request
        logic so individual indicator methods can focus on inputs and outputs.

        Args:
            endpoint: TAAPI endpoint slug (e.g., "rsi", "macd").
            params: Query parameters specific to the endpoint.

        Returns:
            Parsed JSON response from TAAPI as a dictionary.

        Raises:
            MathToolError: If TAAPI is not configured, the request fails,
                or the response cannot be parsed.
        """
        self._ensure_taapi_configured()
        url = f"{self._taapi_base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        query = dict(params)
        query["secret"] = self._taapi_key

        try:
            response = requests.get(url, params=query, timeout=self._taapi_timeout)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            raise MathToolError(f"TAAPI request failed: {exc}") from exc
        except ValueError as exc:
            raise MathToolError("TAAPI response was not valid JSON.") from exc

    def _fetch_taapi_indicator(
        self,
        indicator: str,
        token: str,
        exchange: str,
        interval: Timeframe,
        symbol: Optional[str] = None,
        **params: Any,
    ) -> TaapiResponse:
        """
        Fetch a technical indicator from TAAPI for a given token.

        This method resolves a user-requested indicator name to a TAAPI
        endpoint, builds the required query parameters, and performs the
        API request.

        Args:
            indicator: Indicator name requested by the user (e.g., "rsi").
            token: Token symbol (e.g., "BTC", "ETH").
            exchange: Exchange name recognized by TAAPI (e.g., "binance").
            interval: Candle interval for the indicator (e.g., "1h").
            symbol: Optional trading pair override (e.g., "BTC/USDT"). If not
                provided, a default of "{token}/USDT" is used.
            **params: Additional TAAPI parameters specific to the indicator.

        Returns:
            Parsed JSON response from TAAPI.

        Raises:
            MathToolError: If indicator resolution fails, TAAPI is not
                configured, or the request fails.
        """
        endpoint = self._taapi_endpoint_for_indicator(indicator)
        pair = symbol or f"{token.upper()}/USDT"
        query_params = {
            "exchange": exchange,
            "symbol": pair,
            "interval": interval,
        }
        query_params.update(params)
        return self._taapi_request(endpoint=endpoint, params=query_params)

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
