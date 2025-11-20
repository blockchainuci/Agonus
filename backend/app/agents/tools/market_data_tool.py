import requests
import math
import os
from datetime import datetime, timezone
from typing import Dict, List
from dotenv import load_dotenv

from ..data_classes import MarketData

load_dotenv()
COINGECKO_KEY = os.getenv("COINGECKO_API_KEY")


class MarketDataError(Exception):
    pass


class MarketDataTool:
    """Utility class to fetch real-time and historical cryptocurrency market data.

    Minimal, self-contained implementation extracted from the original datatools.
    """

    def __init__(self, api_base: str = None, api_key: str = None):
        if COINGECKO_KEY:
            api_key = COINGECKO_KEY
            api_base = "https://api.coingecko.com/api/v3/"
        self.api_base_url = api_base
        self.api_key = api_key
        self.headers = {"x-cg-demo-api-key": self.api_key}
        self.supported_tokens = {
            "ETH": "ethereum",
            "SOL": "solana",
            "BTC": "bitcoin",
            "BNB": "binance",  # binancecoin id for coingecko
            "DOGE": "dogecoin",
            "XRP": "ripple",
        }

    def _convert_prices_to_dict(self, days: int, prices: Dict[str, List[int | float]]) -> List[Dict[str, float]]:
        prices_list = []
        # days < 1 returns minute granularity, have to convert it to hours dict
        if days <= 1:
            start_index = 0
            total_len = len(prices["prices"])
            while start_index < total_len:
                prices_list.append({"timestamp": str(prices["prices"][start_index][0]),
                                    "price": prices["prices"][start_index][1]})
                start_index += 12
        else:
            for list_pair in prices["prices"]:
                prices_list.append({"timestamp": str(list_pair[0]), "price": list_pair[1]})
        return prices_list

    def get_price(self, token: str) -> float:
        if token.upper() not in self.supported_tokens:
            raise MarketDataError("Unsupported token provided")
        url = self.api_base_url + "simple/price"
        params = {"symbols": token.lower(), "vs_currencies": "usd"}
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failing status code: {response.status_code}")
                print(f"Error message: {response.text}")
                return None
        except requests.RequestException as e:
            raise MarketDataError(f"Request failed: {e}")

    def get_price_history(self, token: str, hours: int = 24) -> List[Dict[str, float]]:
        token_id = self.supported_tokens[token.upper()] if token.upper() != "BNB" else "binancecoin"
        url = self.api_base_url + f"coins/{token_id}/market_chart"
        days_away = math.ceil(hours / 24)
        params = {"vs_currency": "usd", "days": days_away}
        if token.upper() not in self.supported_tokens:
            raise MarketDataError("Unsupported token provided")

        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                return self._convert_prices_to_dict(days_away, response.json())
            else:
                print(f"Failing status code: {response.status_code}")
                print(f"Error message: {response.text}")
                return None
        except requests.RequestException as e:
            raise MarketDataError(f"Request failed: {e}")

    def get_volume(self, token: str) -> float:
        token_id = self.supported_tokens[token.upper()] if token.upper() != "BNB" else "binancecoin"
        url = self.api_base_url + f"coins/{token_id}/history"
        today = datetime.today()
        today_str = today.strftime("%d-%m-%Y")
        params = {"date": today_str}
        if token.upper() not in self.supported_tokens:
            raise MarketDataError("Unsupported token provided")
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                return response.json()["market_data"]["total_volume"]["usd"]
            else:
                print(f"Failing status code: {response.status_code}")
                print(f"Error message: {response.text}")
                return None
        except requests.RequestException as e:
            raise MarketDataError(f"Request failed: {e}")

    def get_market_sentiment(self) -> str:
        url = self.api_base_url + "simple/price"
        params = {"symbols": "btc", "vs_currencies": "usd", "include_24hr_change": "true"}
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                percent_change = response.json()["btc"]["usd_24h_change"]
                if percent_change > 2:
                    return "bullish"
                elif percent_change < -2:
                    return "bearish"
                elif not percent_change:
                    return "unknown"
                else:
                    return "neutral"
            else:
                print(f"Failing status code: {response.status_code}")
                print(f"Error message: {response.text}")
                return None
        except requests.RequestException as e:
            raise MarketDataError(f"Request failed: {e}")

    def _get_moving_average(self, token: str, days: int) -> float:
        token_id = self.supported_tokens[token.upper()] if token.upper() != "BNB" else "binancecoin"
        url = self.api_base_url + f"coins/{token_id}/market_chart"
        params = {"vs_currency": "usd", "days": days}
        if token.upper() not in self.supported_tokens:
            raise MarketDataError("Unsupported token provided")
        moving_avg = 0
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                price_info = response.json()
                prices_list = price_info["prices"]
                if days <= 90:
                    start_index = 0
                    while start_index < len(prices_list):
                        moving_avg += prices_list[start_index][1]
                        start_index += 24
                    moving_avg /= days
                    return moving_avg
                else:
                    for price_amnt in prices_list:
                        moving_avg += price_amnt[1]
                    moving_avg /= days
                    return moving_avg
            else:
                print(f"Failing status code: {response.status_code}")
                print(f"Error message: {response.text}")
                return None
        except requests.RequestException as e:
            raise MarketDataError(f"Request failed: {e}")

    def get_market_snapshot(self) -> Dict[str, MarketData]:
        market_data_dict = {}
        for token_key, token_value in self.supported_tokens.items():
            token_id = token_value if token_key != "BNB" else "binancecoin"
            price = None
            market_cap = None
            volume_24h = None
            rsi_14 = None
            ma_50 = None
            ma_200 = None
            timestamp = datetime.now(timezone.utc)
            base_info_url = self.api_base_url + "simple/price"
            params = {"symbols": token_key.lower(), "vs_currencies": "usd", "include_market_cap": "true",
                      "include_24hr_vol": "true"}
            try:
                response = requests.get(base_info_url, headers=self.headers, params=params)
                if response.status_code == 200:
                    price = response.json()[token_key.lower()]["usd"]
                    market_cap = response.json()[token_key.lower()]["usd_market_cap"]
                    volume_24h = response.json()[token_key.lower()]["usd_24h_vol"]
                else:
                    print(f"Failing status code: {response.status_code}")
                    print(f"Error message: {response.text}")
            except requests.RequestException as e:
                raise MarketDataError(f"Request failed: {e}")
            ma_50 = self._get_moving_average(token_key, 50)
            ma_200 = self._get_moving_average(token_key, 200)
            current_market_object = MarketData(token_key, price, market_cap, volume_24h, rsi_14, ma_50, ma_200, timestamp)
            market_data_dict[token_key] = current_market_object
        return market_data_dict


if __name__ == '__main__':
    test = MarketDataTool()
    for key, obj in test.get_market_snapshot().items():
        print(f'Token: {key}')
        print(f'Obj: {obj}')
