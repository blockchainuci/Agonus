import requests #needed for future API call implementation
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