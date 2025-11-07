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
    api_base_url : str
        The base URL for the API we will be using (specific API TBD).
    api_key : str
        The API key we provide when calling the necessary api (specific API TBD).
    supported_tokens : Dict[str, str]
        Maps human-readable token symbols (e.g., "ETH") to API identifiers (e.g., "ethereum").
    """

    def __init__(self):
        self.api_base_url = None
        self.api_key = None
        self.supported_tokens = {
            "ETH": "ethereum",
            "SOL": "solana",
            "BTC": "bitcoin",
            "BNB": "binance",
            "DOGE": "dogecoin",
            "XRP": "ripple"
        }


    def get_price(self, token: str) -> float:
        """
        Retrieve the current USD price for a given token.

        Parameters
        ----------
        token : str
            The token symbol (e.g., "ETH", "SOL", "BTC").

        Returns
        -------
        float
            The current price of the token in USD.

        Raises
        ------
        ValueError
            If the token is not supported.
        requests.RequestException
            If the API request fails.
        """
        pass
    
    def get_price_history(self, token: str, hours: int = 30)
    