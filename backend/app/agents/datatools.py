import requests
import mimetypes
import math
import time
from datetime import datetime, timezone, timedelta
#import copy 
from dotenv import load_dotenv
import os
from typing import Dict, List, Optional
from dataclasses import Trade, MarketData, Portfolio, TweetPost
from data_classes import Trade, MarketData, Portfolio, TweetPost
load_dotenv()
COINGECKO_KEY = os.getenv("COINGECKO_API_KEY")
TWITTER_BEARER = os.getenv("TWITTER_BEARER_TOKEN")

UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024 # 5 MB, suggested chunk size for chunk upload and max size for simple upload

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
            "BNB": "binance", ##binancecoin id for coingecko
            "DOGE": "dogecoin",
            "XRP": "ripple"
        }

    def _convert_prices_to_dict(self, days: int, prices: Dict[str, List[int | float]]) -> List[Dict[str, float]]:
        prices_list = []
        ##days < 1 returns minute granularity, have to convert it to hours dict
        if days <= 1:
            start_index = 0
            total_len = len(prices["prices"])
            while start_index < total_len:
                prices_list.append({"timestamp": str(prices["prices"][start_index][0]),
                                    "price": prices["prices"][start_index][1]})
                start_index += 12 ##simulates approx hour jump in data (12*5)
        else:
            for list_pair in prices["prices"]:
                prices_list.append({"timestamp": str(list_pair[0]), "price": list_pair[1]})
        return prices_list

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
        # headers = {"x-cg-demo-api-key": self.api_key}
        url = self.api_base_url + 'simple/price'
        params = {"symbols": token.lower(), "vs_currencies": "usd"}
        if token.upper() not in self.supported_tokens:
            raise ValueError("Unsupported token provided")
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                return response.json()
            else:
                print(f'Failing status code: {response.status_code}')
                print(f'Error message: {response.text}')
                return None
        except requests.RequestException as e:
            raise(requests.RequestException)

    
    def get_price_history(self, token: str, hours: int = 24) -> List[Dict[str, float]]:
        """
        Retrieve historical price data for a token over the past N hours.

        Parameters
        ----------
        token : str
            The token symbol (e.g., "ETH", "SOL", "BTC").
        hours : int, optional
            Number of hours of history to retrieve (default is 24).

        Returns
        -------
        List[Dict[str, float]]
            A list of dictionaries containing timestamp and price pairs.
            Example: [{"timestamp": 1730827200000, "price": 2350.12}, ...]

        Raises
        ------
        ValueError
            If the token is not supported.
        requests.RequestException
            If the API request fails.
        """
        token_id = self.supported_tokens[token.upper()] if token.upper() != 'BNB' else 'binancecoin'
        # headers = {"x-cg-demo-api-key": self.api_key}
        url = self.api_base_url + f'coins/{token_id}/market_chart'
        days_away = math.ceil(hours / 24)
        params = {"vs_currency": "usd", "days": days_away}
        if token.upper() not in self.supported_tokens:
            raise ValueError("Unsupported token provided")

        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                return self._convert_prices_to_dict(days_away, response.json())
            else:
                print(f'Failing status code: {response.status_code}')
                print(f'Error message: {response.text}')
                return None
        except requests.RequestException as e:
            raise(requests.RequestException)

    ##Note: This slightly lags real-time 24 hour volume due to API
    def get_volume(self, token: str) -> float:
        """
        Retrieve the 24-hour trading volume for a given token.

        Parameters
        ----------
        token : str
            The token symbol (e.g., "ETH", "SOL", "BTC").

        Returns
        -------
        float
            The total 24-hour trading volume in USD.

        Raises
        ------
        ValueError
            If the token is not supported.
        requests.RequestException
            If the API request fails.
        """
        token_id = self.supported_tokens[token.upper()] if token.upper() != 'BNB' else 'binancecoin'
        url = self.api_base_url + f'coins/{token_id}/history'
        # headers = {"x-cg-demo-api-key": self.api_key}
        today = datetime.today()
        today_str = today.strftime('%d-%m-%Y')
        params = {"date": today_str}
        if token.upper() not in self.supported_tokens:
            raise ValueError("Unsupported token provided")
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                return response.json()['market_data']['total_volume']['usd']
            else:
                print(f'Failing status code: {response.status_code}')
                print(f'Error message: {response.text}')
                return None
        except requests.RequestException as e:
            raise(requests.RequestException)
        
    
    def get_market_sentiment(self) -> str:
        """
        Estimate overall market sentiment based on Bitcoin's 24-hour price movement.

        For MVP implementation, sentiment is categorized as:
        - "bullish" if BTC increased > 2% in 24h
        - "bearish" if BTC decreased > 2% in 24h
        - "neutral" otherwise

        Returns
        -------
        str
            One of: "bullish", "bearish", "neutral", or "unknown" (if data unavailable).
        """
        # headers = {"x-cg-demo-api-key": self.api_key}
        url = self.api_base_url + 'simple/price'
        params = {"symbols": 'btc', "vs_currencies": "usd", "include_24hr_change": "true"}
        percent_change = None
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                percent_change = response.json()['btc']['usd_24h_change']
                if percent_change > 2:
                    return "bullish"
                elif percent_change < -2:
                    return "bearish"
                elif not percent_change:
                    return "unknown"
                else:
                    return "neutral"
            else:
                print(f'Failing status code: {response.status_code}')
                print(f'Error message: {response.text}')
                return None
        except requests.RequestException as e:
            raise(requests.RequestException)
    

    def _get_moving_average(self, token: str, days: int) -> float:
        """
        Helper function to calculate 50 & 200 moving day average
        """
        token_id = self.supported_tokens[token.upper()] if token.upper() != 'BNB' else 'binancecoin'
        url = self.api_base_url + f'coins/{token_id}/market_chart'
        params = {"vs_currency": "usd", "days": days}
        if token.upper() not in self.supported_tokens:
            raise ValueError("Unsupported token provided")
        moving_avg = 0
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                price_info = response.json()
                prices_list = price_info["prices"]
                # print(prices_list)
                if days <= 90:
                    start_index = 0
                    while start_index < len(prices_list):
                        moving_avg += prices_list[start_index][1]
                        start_index += 24 ##advance one day
                    moving_avg /= days
                    return moving_avg
                else:
                    for price_amnt in prices_list:
                        moving_avg += price_amnt[1]
                    moving_avg /= days
                    return moving_avg
            else:
                print(f'Failing status code: {response.status_code}')
                print(f'Error message: {response.text}')
                return None
        except requests.RequestException as e:
            raise(requests.RequestException)
        

    def get_market_snapshot(self) -> Dict[str, MarketData]:
        """
        Compile a structured summary of current market conditions
        across all supported tokens and return a MarketData object.

        Returns
        -------
        Dictionary of MarketData objects
            A dictionary where each key is a token's key(e.g. BTC) 
            and the value is a MarketData object representing that coin.
        
        This method is typically used by BaseAgent.get_market_data()
        to provide the agent with its current trading context.
        """
        market_data_dict = {}
        token_id = None
        for token_key, token_value in self.supported_tokens.items():
            token_id = token_value if token_key != 'BNB' else 'binancecoin'
            price = None
            market_cap = None
            volume_24h = None
            rsi_14 = None
            ma_50 = None
            ma_200 = None
            timestamp = datetime.now(timezone.utc)
            # token_key = token_key.lower()
            base_info_url = self.api_base_url + 'simple/price'
            params = {"symbols": token_key.lower(), "vs_currencies": "usd", "include_market_cap": "true",
                      "include_24hr_vol": "true"}
            try:
                response = requests.get(base_info_url, headers=self.headers, params=params)
                if response.status_code == 200:
                    price = response.json()[token_key.lower()]['usd']
                    market_cap = response.json()[token_key.lower()]['usd_market_cap']
                    volume_24h = response.json()[token_key.lower()]['usd_24h_vol']
                else:
                    print(f'Failing status code: {response.status_code}')
                    print(f'Error message: {response.text}')
            except requests.RequestException as e:
                raise(requests.RequestException)
            ma_50 = self._get_moving_average(token_key, 50)
            ma_200 = self._get_moving_average(token_key, 200)
            current_market_object = MarketData(token_key, price, market_cap, volume_24h, rsi_14, ma_50, ma_200, timestamp)
            market_data_dict[token_key] = current_market_object
        return market_data_dict

class TradeTool:
    """
    A utility class responsible for executing trades and managing trade-related logic
    such as PnL calculations and trade validation.

    Attributes
    ----------
    agent_id : str
        Unique identifier of the agent using this trade tool.
    portfolio_tool : PortfolioTool
        A reference to the PortfolioTool instance to update agent holdings.
    market_tool : MarketDataTool
        A reference to the MarketDataTool instance for live prices.
    """
    def __init__(self, agent_id: str, portfolio_tool = None, market_tool = None):
        self.agent_id = agent_id
    
    def execute_trade(self, action: str, token: str, qty: float, price: float, confidence: float, summary: str) -> Trade:
        """
        Execute a simulated buy or sell trade and return a Trade object.

        Parameters
        ----------
        action : str
            The trade direction, either "BUY" or "SELL".
        token : str
            The token symbol (e.g., "ETH", "SOL", "BTC").
        qty : float
            The quantity of the token to trade.
        price : float
            The price of the trade, (passed in from Agent's MarketDataTool)
        confidence : float
            Confidence score (0.0 to 1.0) in this decision.
        summary : str
            Short text explanation of the trade reasoning.

        Returns
        -------
        Trade
            A Trade dataclass instance representing the executed trade.

        Raises
        ------
        ValueError
            If invalid action or token is provided.
        """
        pass

    def calculate_realized_pnl(self, buy_price: float, sell_price: float, qty: float) -> float:
        """
        Calculate realized profit or loss for a completed trade.

        Parameters
        ----------
        buy_price : float
            The price at which the asset was purchased.
        sell_price : float
            The price at which the asset was sold.
        qty : float
            Quantity of the asset traded.

        Returns
        -------
        float
            Realized profit or loss (positive = profit, negative = loss).
            Realized PnL formula: PnL = (sell_price - buy_price) * qty
            Return the value calculated by that formula.
        """
        pass

    def calculate_roi(self, realized_pnl: float, buy_price: float, qty: float) -> float:
        """
        Calculate the return on investment (ROI) for a trade.

        Parameters
        ----------
        realized_pnl : float
            Profit or loss from the trade.
        buy_price : float
            The price at which the asset was bought.
        qty : float
            Quantity traded.

        Returns
        -------
        float
            ROI as a decimal (e.g., 0.05 = 5% gain, -0.02 = 2% loss).
            Return realized_pnl / (buy_price * qty) if (buy_price * qty) > 0
            If not return 0.0.
            Invested ammount = (buy_price * qty).
        """
        pass

class PortfolioTool:
    """
    A utility class that manages an agent's portfolio — cash, holdings, profit/loss,
    and performance metrics — based on executed trades.

    This tool handles all financial updates after trades and provides
    methods to calculate portfolio statistics such as total value, ROI, and win rate.

    Attributes
    ----------
    portfolio : Portfolio
        The Portfolio dataclass instance representing the agent's current holdings.
    """

    def __init__(self, portfolio: Portfolio):
        self.portfolio = portfolio

    def update_after_trade(self, trade: Trade) -> None:
        """
        Update portfolio holdings, cash, and performance metrics after an executed trade.

        Parameters
        ----------
        trade : Trade
            The Trade object containing details of the executed trade.

        Returns
        -------
        None
        """
        pass

    def recalculate_holdings_value(self, market_prices: Dict[str, float]) -> None:
        """
        Recalculate the total USD value of all current holdings using live market prices.
        Utilizes _recalculate_portfolio_metrics() helper method.

        Parameters
        ----------
        market_prices : Dict[str, float]
            Mapping of token symbol → current price (e.g., {"ETH": 2300.5, "BTC": 40500.0}).

        Returns
        -------
        None
        """
        pass

    def get_portfolio_snapshot(self) -> Portfolio:
        """
        Return a deep copy of the internal Portfolio object representing the agent's
        most recent financial state.

        Notes
        -----
        - For security/caller access reasons, this performs a full deep copy of the Portfolio
        object. Although the cost is minimal for small portfolio objects, it could get more 
        expensive for larger ones. Think about whether we should or shouldn't deepcopy
        the portfolio in the future.
        - If we need a lightweight, serializable form (e.g., for saving or sending
        to an API), use `self.portfolio.to_dict()` instead. This means this method would
        be changed to returning a dictionary rather than a Portfolio object.

        Returns
        -------
        Portfolio
            A deep-copied Portfolio dataclass instance containing the agent’s
            current holdings, cash balance, and performance metrics.
        Dict

        """
        pass
    
    def get_total_value(self) -> float:
        """
        Return the current total portfolio value (cash + holdings).

        Returns
        -------
        float
            The total USD value of the portfolio.
        """
        pass

    # Helper Methods
    def _recalculate_portfolio_metrics(self):
        """
        Internal helper to update key performance metrics (total value, ROI, win rate, etc.).

        Returns
        -------
        None
        """
        pass
    
class TweetPostTool:
    """
    A utility class that publishes AI agent tweets to Twitter/X in real time.

    This tool always connects directly to the Twitter/X API using an authenticated
    API key. It constructs structured TweetPost objects for recordkeeping
    and posts them to the live Twitter feed.

    Attributes
    ----------
    agent_id : str
        Unique identifier of the agent posting tweets.
    api_bearer : str
        The bearer token we provide for authentication when calling the Twitter API.
    post_api_base : str
        API Base url for the POST Twitter API.
    upload_url : str
        API URL for Media UPLOAD Twitter API.
    post_headers : Dict[str, str]
        Headers for POST Twitter API call.
    """
    def __init__(self, agent_id: int, api_bearer: str = None):
        self.agent_id = agent_id

        if TWITTER_BEARER:
            api_bearer = TWITTER_BEARER
        
        self.post_api_base = "https://api.twitter.com/2"
        self.api_bearer = api_bearer

        self.upload_url = "https://upload.twitter.com/1.1/media/upload.json"

        self.post_headers = {
            "Authorization": f"Bearer {self.api_bearer}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def post_tweet(
        self,
        content: str,
        trade_id: Optional[int] = None,
        trade_summary: Optional[str] = None,
        media_url: Optional[str] = None,
        reply_to_id: Optional[str] = None,
        personality_signature: Optional[str] = None
    ) -> TweetPost:
        """
        Create and publish a tweet via the Twitter/X API.

        Parameters
        ----------
        content : str
            Text content of the tweet (≤ 280 characters recommended).
        trade_id : Optional[int], default=None
            Associated trade ID if tweet refers to a trade.
        trade_summary : Optional[str], default=None
            Short explanation of the trade action.
        media_url : Optional[str], default=None
            URL of media (image/video) to attach to the tweet.
        reply_to_id : Optional[str], default=None
            ID of the tweet being replied to (for threads).
        personality_signature : Optional[str], default=None
            Tone or tagline of the agent’s personality.

        Returns
        -------
        TweetPost
            A TweetPost object containing full post metadata and content.

        Raises
        ------
        requests.HTTPError
            If the Twitter/X API request fails.
        """

        if not self.api_bearer:
            raise requests.HTTPError("Twitter bearer token is missing, unable to authenticate the API request.")

        if not content:
            raise ValueError("Tweet content cannot be empty.")
        
        #building Twitter POST API endpoint
        url = f"{self.post_api_base}/tweets"

        #building the payload
        payload = {"text": content}

        #if trade summary was provided, add it to the tweet content
        if trade_summary:
            payload["text"] += f"\n\nSummary: {trade_summary}"

        #add personality signature to tweet content
        if personality_signature:
            payload["text"] += f"\n\n— {personality_signature}"
        
        #if media url was provided, upload media and obtain media id string
        if media_url:
            try:
                media_id = self._upload_media(media_url)
                payload["media"] = {"media_ids": [media_id]}
            except Exception as e:
                raise requests.HTTPError(f"Media upload failed: {str(e)}")

        if reply_to_id:
            payload["reply"] = {"in_reply_to_tweet_id": reply_to_id}
        
        try:
            response = requests.post(url, json = payload, headers = self.post_headers)

            #expect 201 status code for successfull creation of tweet
            if response.status_code != 201:
                raise requests.HTTPError(
                    f"Error occured when attempting to connect with Twitter API: {response.status_code} {response.text}"
                )
            
            #access data field safely, if data field does not exist data defaults to an empty dictionary
            data = response.json().get("data", {})

            # Construct TweetPost object
            return TweetPost(
                agent_id = self.agent_id,
                content = payload["text"],
                timestamp = datetime.now(timezone.utc),
                twitter_id = data.get("id"),
                trade_id = trade_id,
                trade_summary = trade_summary,
                media_url = media_url,
                reply_to_id = reply_to_id,
                personality_signature = personality_signature
            )

        except requests.RequestException as e:
            raise requests.HTTPError(f"Failed to connect to the Twitter API due to {str(e)}")
        
    def _upload_media(self, media_url: str) -> str:
        """ Helper function that downloads media file from provided media url,
            uploads that media file to Twitter via Twitter media upload endpoint,
            extracts media_id from Twitter's response and returns that media_id
            to be specified in tweet payload. 
            Assumes post tweet already validated bearer token authentication.
            Raises HTTPError if unable to connect to Twitter media upload endpoint."""
        
        #downloads media from the url
        try:
            
            file_response = requests.get(media_url)
            if file_response.status_code != 200:
                raise requests.HTTPError(f"Failed to download media from provided URL: {media_url}")
            
        except requests.RequestException as e:
            raise requests.HTTPError(f"Error occured while trying to download media due to: {str(e)}")
        
        file_bytes = file_response.content
        file_size = len(file_bytes)

        #Utilize mimetypes module to guess mime type of the media from the provided media url
        #Mime type required by Twitter UPLOAD API

        #guess_type returns a tuple where the second value is the encoding, which is not needed for Twitter UPLOAD API
        mime_type, _ = mimetypes.guess_type(media_url)
        
        if not mime_type:
            # if python's mimtypes module wasn't able to guess the mime type of the media because it was unusual,
            # assign it to the universal mime type for raw binary data, treat it as arbitrary bytes
            mime_type = "application/octet-stream"

        #decide whether to use simple or chunked upload method
        if file_size <= UPLOAD_CHUNK_SIZE:
            return self._simple_upload(file_bytes, mime_type)
        else:
            return self._chunked_upload(file_bytes, mime_type)
    
    def _simple_upload(self, file_bytes: bytes, mime_type: str) -> str:
        """ Helper function for simple upload of images, gifs, and small videos.
            Returns media_id string."""
        try:
            response = requests.post(
                self.upload_url,
                # different headers for Media UPLOAD Twitter API vs. POST Twitter API
                headers = {"Authorization": f"Bearer {self.api_bearer}"},
                files = {"media": ("file", file_bytes, mime_type)}
            )

            if response.status_code != 200:
                raise requests.HTTPError(f"Simple upload failed due to: {response.text}")

            return response.json().get("media_id_string")
        
        except requests.RequestException as e:
            raise requests.HTTPError(f"Simple upload failed due to: {str(e)}")
    
    def _chunked_upload(self, file_bytes: bytes, mime_type: str) -> str:
        """ Helper function for chunked upload of large videos (file sizes > 5 MB).
            Returns media_id string."""
        media_id = self._init_chunked_upload(file_bytes, mime_type)
        self._append_chunked_upload(file_bytes, media_id)
        self._finalize_chunked_upload(media_id)
        return media_id
    
    def _init_chunked_upload(self, file_bytes: bytes, mime_type: str) -> str:
        """Performs INIT step of Chunked upload."""
        try:
            # ensure mime_type is a video type
            if not mime_type.startswith("video/"):
                raise requests.HTTPError("Chunked upload only supported for video types.")
            
            params = {
                "command": "INIT",
                "media_type": mime_type,
                "total_bytes": len(file_bytes),
                "media_category": "tweet_video"
            }

            response = requests.post(
                self.upload_url,
                headers = {"Authorization": f"Bearer {self.api_bearer}"},
                data = params
            )

            if response.status_code != 200:
                raise requests.HTTPError(f"INIT failed: {response.status_code} {response.text}")
            
            media_id = response.json().get("media_id_string")
            if not media_id:
                raise requests.HTTPError("INIT response missing media id string.")
            
            return media_id
        
        except requests.RequestException as e:
            raise requests.HTTPError(f"INIT request failed: {str(e)}")
    
    def _append_chunked_upload(self, file_bytes: bytes, media_id: str) -> None:
        """Performs append step of Chunked upload."""
        segment_index = 0

        for i in range(0, len(file_bytes), UPLOAD_CHUNK_SIZE):
            chunk = file_bytes[i : i + UPLOAD_CHUNK_SIZE]
            params = {
                "command": "APPEND",
                "media_id": media_id,
                "segment_index": segment_index
            }

            try:
                response = requests.post(
                    self.upload_url,
                    headers = {"Authorization": f"Bearer {self.api_bearer}"},
                    data = params,
                    files = {"media": ("chunk", chunk, "application/octet-stream")}
                )

                #append success is 204 (no content) or 202 (accepted)
                if response.status_code not in (204, 202):
                    raise requests.HTTPError(
                        f"APPEND failed at segment {segment_index}: "
                        f"{response.status_code} {response.text}"
                    )
                
            except requests.RequestException as e:
                raise requests.HTTPError(f"APPEND request failed: {str(e)}")
            
            segment_index += 1

    def _finalize_chunked_upload(self, media_id: str) -> None:
        """Performs Finalize step of Chunked upload."""
        params = {
            "command": "FINALIZE",
            "media_id": media_id
        }

        try:
            response = requests.post(
                self.upload_url,
                headers = {"Authorization": f"Bearer {self.api_bearer}"},
                data=params
            )

            #200 is OK, 201 is Created, 202 is processing started
            if response.status_code not in (200, 201, 202):
                raise requests.HTTPError(f"FINALIZE failed: {response.status_code} {response.text}")
            
            #if the response contains processing info, use it
            processing_info = response.json().get("processing_info")

            #no processing means the upload done
            if not processing_info:
                return
            
            state = processing_info.get("state")

            #if processing is already done
            if state == "succeeded":
                return
            elif state == "failed":
                raise requests.HTTPError("Video processing failed after FINALIZE.")

            #otherwise: state is "pending" or "in_progress"
            check_after = processing_info.get("check_after_secs", 1)

            #poll STATUS until video is ready or failed
            self._poll_status(media_id, check_after)

        except requests.RequestException as e:
            raise requests.HTTPError(f"FINALIZE request failed: {str(e)}")
        
    def _poll_status(self, media_id: str, initial_delay: int = 1) -> None:
        """ Polls Twitter STATUS endpoint until video processing completes.
            Used to keep checking Twitter until a response of "succeeded", "failed", 
            or timeout is provided. Required because can't attach video to tweet
            before Twitter finishes processing it."""
        
        delay = initial_delay
        max_attempts = 20  #arbitrary number of attempts I chose, can change later.

        for i in range(max_attempts):
            time.sleep(delay)

            params = {
                "command": "STATUS",
                "media_id": media_id
            }

            try:
                response = requests.post(
                    self.upload_url,
                    headers = {"Authorization": f"Bearer {self.api_bearer}"},
                    data = params
                )

                if response.status_code != 200:
                    raise requests.HTTPError(
                        f"STATUS failed: {response.status_code} {response.text}"
                    )
                
                processing_info = response.json().get("processing_info", {})
                state = processing_info.get("state")

                if state == "succeeded":
                    return
                elif state == "failed":
                    raise requests.HTTPError("Video processing failed during STATUS polling.")

                # If still processing, wait again
                delay = processing_info.get("check_after_secs", delay)

            except requests.RequestException as e:
                raise requests.HTTPError(f"STATUS request failed: {str(e)}")
        
        raise requests.HTTPError("Video processing timed out during STATUS polling.")

if __name__ == '__main__':
    test = MarketDataTool()
    for key, obj in test.get_market_snapshot().items():
        print(f'Token: {key}')
        print(f'Obj: {obj}')
