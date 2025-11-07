import requests
from datetime import datetime
from typing import Dict, List
from .dataclasses import Trade, MarketData, Portfolio

class MarketDataTool:
    def __init__(self):
        self.api_base = "enter api base url"
        self.supported_tokens = {
            "ETH": "ethereum",
            "SOL": "solana",
            "BTC": "bitcoin"
        }

    def get_price( ->)