import requests #needed for future API call implementation
import copy #needed for making portfolio copies
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import Trade, MarketData, Portfolio, TweetPost


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
        self.api_base_url = api_base
        self.api_key = api_key
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
    
    def get_price_history(self, token: str, hours: int = 20) -> List[Dict[str, float]]:
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
        pass
    
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

        pass
    
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
        pass

    def get_market_snapshot(self) -> MarketData:
        """
        Compile a structured summary of current market conditions
        across all supported tokens and return a MarketData object.

        Returns
        -------
        MarketData object
            A MarketData object summarizing the current state of the market
        
        This method is typically used by BaseAgent.get_market_data()
        to provide the agent with its current trading context.
        """
        pass

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
    api_base_url : str
        Base URL for Twitter/X API endpoints (default: 'https://api.twitter.com/2').
    api_key : str
        The API key we provide when calling the necessary api (specific API TBD).
    
    """
    def __init__(self, agent_id: int, api_base_url: str = None, api_key: str = None):
        self.agent_id = agent_id
        self.api_base_url = api_base_url
        self.api_key = api_key

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
        pass