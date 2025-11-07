import requests
from datetime import datetime
from typing import Dict, List
from .dataclasses import Trade, MarketData, Portfolio

class MarketDataTool:
    def __init__(self):
        self.coingecko_base = "https://api.coingecko.com/api/v3"
        self.supported_tokens = {
            "ETH": "ethereum",
            "SOL": "solana",
            "BTC": "bitcoin"
        }
