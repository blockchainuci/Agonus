from datetime import datetime, timedelta
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class MarketDataTool:
    def __init__(self, api_base: str = None, api_key: str = None):
        # ... existing code ...
        self.api_base = api_base or "https://api.coingecko.com/api/v3"
        self.api_key = api_key
        
        # Price caching to avoid hitting rate limits
        self._price_cache: Dict[str, float] = {}
        self._cache_timestamp: Optional[datetime] = None
        self._cache_ttl_seconds: int = 5  # 5-second cache
    
    def _is_cache_valid(self) -> bool:
        """Check if cached prices are still fresh."""
        if not self._cache_timestamp:
            return False
        
        age = (datetime.utcnow() - self._cache_timestamp).total_seconds()
        return age < self._cache_ttl_seconds
    
    def get_all_prices(self) -> Dict[str, float]:
        """
        Get current USD prices for all supported tokens with caching.
        
        Returns:
            Dict[str, float]: {"BTC": 42000.50, "ETH": 2300.25, ...}
        """
        # Return cached prices if still valid
        if self._is_cache_valid():
            return self._price_cache.copy()
        
        # Fetch fresh prices
        prices = {}
        for token in self.supported_tokens.keys():
            try:
                price_data = self.get_price(token)
                prices[token] = price_data[token.lower()]['usd']
            except Exception as e:
                # Fallback to last known price if fetch fails
                if token in self._price_cache:
                    prices[token] = self._price_cache[token]
                    logger.warning(f"Using cached price for {token} due to error: {e}")
                else:
                    logger.error(f"Failed to fetch {token} price: {e}")
        
        # Update cache
        self._price_cache = prices
        self._cache_timestamp = datetime.utcnow()
        
        return prices.copy()