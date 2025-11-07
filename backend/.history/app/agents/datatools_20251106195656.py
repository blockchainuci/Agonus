import requests
from datetime import datetime
from typing import Dict, List
from .dataclasses import Trade, MarketData, Portfolio

class MarketDataTool:
    """
    A utility class that provides real-time and historical cryptocurrency market data.
    This tool serves as the 'eyes' of the agent, fetching prices, trading volumes,
    and market sentiment information from external APIs such as CoinGecko.

    Attributes
    ----------
    api_base : str
        The base URL for the API we will be using (TBD).
    supported_tokens : Dict[str, str]
        Maps human-readable token symbols (e.g., "ETH") to API identifiers (e.g., "ethereum").
    """

    def __init__(self):
        self.api_base = "enter api base url"
        self.supported_tokens = {
            "ETH": "ethereum",
            "SOL": "solana",
            "BTC": "bitcoin",
            "BNB": "binance",
            ""
        }

    def get_price() ->