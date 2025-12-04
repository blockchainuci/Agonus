import requests
import math
import os
import logging
from datetime import datetime, timezone
from typing import Dict, List
from dotenv import load_dotenv

from ..data_classes import MarketData

load_dotenv()
COINGECKO_KEY = os.getenv("COINGECKO_API_KEY")

logger = logging.getLogger(__name__)


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
            "WETH": "ethereum",  # Wrapped ETH uses same price as ETH
            "SOL": "solana",
            "BTC": "bitcoin",
            "CBBTC": "bitcoin",  # Coinbase Wrapped BTC uses same price as BTC
            "TBTC": "bitcoin",  # Tokenized BTC uses same price as BTC
            "BNB": "binance",  # binancecoin id for coingecko
            "DOGE": "dogecoin",
            "XRP": "ripple",
        }
        logger.info("MarketDataTool initialized")

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
            logger.error(f"Unsupported token: {token}")
            raise MarketDataError("Unsupported token provided")
        url = self.api_base_url + "simple/price"
        params = {"symbols": token.lower(), "vs_currencies": "usd"}
        logger.debug(f"Fetching price for {token}")
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                data = response.json()
                # Extract price from response dict: {"eth": {"usd": 3850.23}}
                token_key = token.lower()
                if token_key in data and "usd" in data[token_key]:
                    price = float(data[token_key]["usd"])
                    logger.debug(f"Price fetched successfully for {token}: ${price}")
                    return price
                else:
                    logger.error(f"Unexpected API response format: {data}")
                    return 0.0
            else:
                logger.error(f"Failed to fetch price: {response.status_code} {response.text}")
                return 0.0
        except requests.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise MarketDataError(f"Request failed: {e}")

    def get_price_history(self, token: str, hours: int = 24) -> List[Dict[str, float]]:
        token_id = self.supported_tokens[token.upper()] if token.upper() != "BNB" else "binancecoin"
        url = self.api_base_url + f"coins/{token_id}/market_chart"
        days_away = math.ceil(hours / 24)
        params = {"vs_currency": "usd", "days": days_away}
        if token.upper() not in self.supported_tokens:
            logger.error(f"Unsupported token: {token}")
            raise MarketDataError("Unsupported token provided")

        logger.debug(f"Fetching price history for {token}, hours={hours}")
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                logger.debug(f"Price history fetched successfully for {token}")
                return self._convert_prices_to_dict(days_away, response.json())
            else:
                logger.error(f"Failed to fetch price history: {response.status_code} {response.text}")
                return None
        except requests.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise MarketDataError(f"Request failed: {e}")

    def get_volume(self, token: str) -> float:
        token_id = self.supported_tokens[token.upper()] if token.upper() != "BNB" else "binancecoin"
        url = self.api_base_url + f"coins/{token_id}/history"
        today = datetime.today()
        today_str = today.strftime("%d-%m-%Y")
        params = {"date": today_str}
        if token.upper() not in self.supported_tokens:
            logger.error(f"Unsupported token: {token}")
            raise MarketDataError("Unsupported token provided")
        logger.debug(f"Fetching volume for {token}")
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                volume = response.json()["market_data"]["total_volume"]["usd"]
                logger.debug(f"Volume fetched for {token}: {volume}")
                return volume
            else:
                logger.error(f"Failed to fetch volume: {response.status_code} {response.text}")
                return None
        except requests.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise MarketDataError(f"Request failed: {e}")

    def get_market_sentiment(self) -> str:
        url = self.api_base_url + "simple/price"
        params = {"symbols": "btc", "vs_currencies": "usd", "include_24hr_change": "true"}
        logger.debug("Fetching market sentiment")
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                percent_change = response.json()["btc"]["usd_24h_change"]
                if percent_change > 2:
                    sentiment = "bullish"
                elif percent_change < -2:
                    sentiment = "bearish"
                elif not percent_change:
                    sentiment = "unknown"
                else:
                    sentiment = "neutral"
                logger.info(f"Market sentiment: {sentiment} (24h change: {percent_change:.2f}%)")
                return sentiment
            else:
                logger.error(f"Failed to fetch sentiment: {response.status_code} {response.text}")
                return None
        except requests.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise MarketDataError(f"Request failed: {e}")

    def _get_moving_average(self, token: str, days: int) -> float:
        token_id = self.supported_tokens[token.upper()] if token.upper() != "BNB" else "binancecoin"
        url = self.api_base_url + f"coins/{token_id}/market_chart"
        params = {"vs_currency": "usd", "days": days}
        if token.upper() not in self.supported_tokens:
            logger.error(f"Unsupported token: {token}")
            raise MarketDataError("Unsupported token provided")
        moving_avg = 0
        logger.debug(f"Calculating {days}-day moving average for {token}")
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
                    logger.debug(f"{days}-day MA for {token}: {moving_avg}")
                    return moving_avg
                else:
                    for price_amnt in prices_list:
                        moving_avg += price_amnt[1]
                    moving_avg /= days
                    logger.debug(f"{days}-day MA for {token}: {moving_avg}")
                    return moving_avg
            else:
                logger.error(f"Failed to fetch moving average: {response.status_code} {response.text}")
                return None
        except requests.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise MarketDataError(f"Request failed: {e}")

    def get_market_snapshot(self) -> Dict[str, MarketData]:
        logger.info("Fetching market snapshot for all supported tokens")
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
                logger.debug(f"Fetching market data for {token_key}")
                response = requests.get(base_info_url, headers=self.headers, params=params)
                if response.status_code == 200:
                    price = response.json()[token_key.lower()]["usd"]
                    market_cap = response.json()[token_key.lower()]["usd_market_cap"]
                    volume_24h = response.json()[token_key.lower()]["usd_24h_vol"]
                    logger.debug(f"{token_key}: price={price}, market_cap={market_cap}, volume={volume_24h}")
                else:
                    logger.error(f"Failed to fetch data for {token_key}: {response.status_code} {response.text}")
            except requests.RequestException as e:
                logger.error(f"Request failed for {token_key}: {e}")
                raise MarketDataError(f"Request failed: {e}")
            ma_50 = self._get_moving_average(token_key, 50)
            ma_200 = self._get_moving_average(token_key, 200)
            current_market_object = MarketData(token_key, price, market_cap, volume_24h, rsi_14, ma_50, ma_200, timestamp)
            market_data_dict[token_key] = current_market_object
        logger.info(f"Market snapshot completed for {len(market_data_dict)} tokens")
        return market_data_dict


if __name__ == '__main__':
    test = MarketDataTool()
    for key, obj in test.get_market_snapshot().items():
        print(f'Token: {key}')
        print(f'Obj: {obj}')
