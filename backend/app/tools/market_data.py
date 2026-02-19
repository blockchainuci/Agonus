# backend/app/tools/market_data.py

import logging
from datetime import datetime
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class MarketDataTool:
    def __init__(self, api_base: str = None, api_key: str = None):
        self.api_base = api_base or "https://api.coingecko.com/api/v3"
        self.api_key = api_key

        # REQUIRED for our runtime agents
        self.supported_tokens = {
            "BTC": "bitcoin",
            "ETH": "ethereum",
            "WETH": "weth",
            "CBBTC": "bitcoin",
        }

        # cache
        self._price_cache: Dict[str, float] = {}
        self._cache_timestamp: Optional[datetime] = None
        self._cache_ttl_seconds: int = 5

    def _is_cache_valid(self) -> bool:
        if not self._cache_timestamp:
            return False
        age = (datetime.utcnow() - self._cache_timestamp).total_seconds()
        return age < self._cache_ttl_seconds

    # -------------------------------------------------------------------
    # MOCK PRICE FUNCTION for frontend development
    # -------------------------------------------------------------------
    def get_price(self, token: str):
        mock = {
            "btc": {"usd": 42000},
            "eth": {"usd": 2300},
            "weth": {"usd": 2300},
            "cbbtc": {"usd": 42000},
        }
        return mock.get(token.lower(), {"usd": 0})

    def get_all_prices(self) -> Dict[str, float]:
        if self._is_cache_valid():
            return self._price_cache.copy()

        prices = {}
        for token in self.supported_tokens.keys():
            try:
                price_data = self.get_price(token)
                prices[token] = price_data.get("usd", 0)
            except Exception as e:
                logger.error(f"Price fetch fail for {token}: {e}")
                prices[token] = self._price_cache.get(token, 0)

        self._price_cache = prices
        self._cache_timestamp = datetime.utcnow()
        return prices.copy()

    # -------------------------------------------------------------------
    # MOCK SENTIMENT + VOLUME
    # -------------------------------------------------------------------
    def get_market_sentiment(self):
        return {
            "sentiment": "bullish",
            "score": 0.72
        }

    def get_volume(self, token: str) -> float:
        return 10000000.0   # mock volume for frontend usage
