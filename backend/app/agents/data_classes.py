from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional, Dict


@dataclass
class MarketData:
    '''
    Gives all the market data info for one crytocurrency

     Attributes:
        symbol (str): Cryptocurrency symbol, e.g. "BTC", "ETH".
        price (float): Current market price in USD.
        market_cap (float): Total market capitalization in USD.
        volume_24h (float): Trading volume over the past 24 hours.
        rsi_14 (float): 14-period Relative Strength Index.
        ma_50 (float): 50-day simple moving average.
        ma_200 (float): 200-day simple moving average.
        timestamp (datetime): UTC timestamp when the data was captured.
    '''

    symbol: str          #Crypto symbol: "BTC", "ETH", etc.
    price: float         #current price in USD
    market_cap: float    #total market cap
    volume_24h: float    # 24h volume
    rsi_14: float        # RSI indicator
    ma_50: float         # 50-day MA
    ma_200: float        # 200-day MA
    timestamp: datetime  # When captured

    def to_dict(self):
        """
        Convert the MarketData object into a serializable dictionary.

        Returns:
            dict: Dictionary representation of all MarketData fields.
        """
        return asdict(self)
    
    


@dataclass
class Trade:
    """
    Represents a single executed trade made by an agent.

    Attributes:
        trade_id (int): Unique identifier for the trade.
        agent_id (str): ID of the agent that executed the trade.
        action (str): 'BUY' or 'SELL' to indicate trade direction.
        qty (float): Quantity of the asset traded.
        price (float): Execution price per unit.
        confidence (float): Confidence level of the agent's decision (0.0 - 1.0).
        summary (str): Short textual explanation of why the trade was made.
        timestamp (datetime): UTC time when the trade occurred.
        tx_hash (Optional[str]): Blockchain transaction hash for this trade.
        realized_pnl (Optional[float]): Realized profit or loss from the trade.
        roi (Optional[float]): Return on investment for this trade.
    """

    trade_id: int
    token: str
    agent_id: str
    action: str
    qty: float
    price: float
    confidence: float
    summary: str
    timestamp: datetime
    tx_hash: Optional[str] = None
    realized_pnl: Optional[float] = None
    roi: Optional[float] = None

    def value(self):
        """
        Compute the total USD value of the trade.
        Returns:
            float: qty * price
        """
        return self.qty * self.price

    def to_dict(self):
        """
        Convert the Trade object into a serializable dictionary.
        Returns:
            dict: Dictionary representation of all Trade fields.
        """
        return asdict(self)


    
@dataclass
class Portfolio:
    """
    Represents an agent's portfolio, tracking its cash, holdings, and performance.

    Attributes:
        agent_id (str): Unique identifier for the agent owning this portfolio.
        cash (float): Available cash balance (USD).
        holdings (Dict[str, float]): Mapping of asset symbol → quantity held.
        starting_val (float): Portfolio starting value (USD).
        holdings_val (float): Current value of all held assets.
        unrealized_pnl (float): Profit/loss from open positions.
        realized_pnl (float): Profit/loss from closed positions.
        total_value (float): Combined total of cash + holdings_val.
        num_trades (int): Total trades executed.
        num_winning_trades (int): Number of profitable trades.
        num_losing_trades (int): Number of losing trades.
        win_rate (float): Ratio of winning to total trades.
        roi (float): Overall return on investment.
    """
    agent_id: str
    cash: float
    holdings: Dict[str, float]
    starting_val: float = 500.00
    holdings_val: float = 0.00
    unrealized_pnl: float = 0.00
    realized_pnl: float = 0.00
    total_value: float = 500.00
    num_trades: int = 0
    num_winning_trades: int = 0
    num_losing_trades: int = 0
    win_rate: float = 0.00
    roi: float = 0.00

    def to_dict(self):
        """
        Convert the Portfolio object into a serializable dictionary.

        Returns:
            dict: Dictionary representation of all Portfolio fields.
        """
        return asdict(self)
    


@dataclass
class TweetPost:
    """
    Represents a post made by an AI trading agent to Twitter (X).

    This dataclass holds the structured content of a tweet — including
    text, metadata, and optional trade context. The BaseAgent or
    personality layer will populate this when broadcasting decisions.

    Attributes:
        agent_id (str): Unique identifier of the posting agent.
        content (str): Main text body of the tweet (max 280 chars recommended).
        trade_id (Optional[int]): ID of the associated trade (if applicable).
        trade_summary (Optional[str]): A concise explanation of the trade decision.
        timestamp (datetime): UTC time when the tweet was created.
        media_url (Optional[str]): Optional image/video/media URL attached to the tweet.
        reply_to_id (Optional[str]): Tweet ID being replied to (for threads).
        metrics (Dict[str, int]): Engagement stats like {"likes": 0, "retweets": 0}.
        personality_signature (Optional[str]): Agent's tone/personality summary (for context or branding).
    """

    agent_id: str
    content: str
    trade_id: Optional[int] = None
    trade_summary: Optional[str] = None
    timestamp: datetime = datetime.utcnow()
    media_url: Optional[str] = None
    reply_to_id: Optional[str] = None
    metrics: Dict[str, int] = None
    personality_signature: Optional[str] = None

    def __post_init__(self):
        """Ensure metrics are initialized properly."""
        if self.metrics is None:
            self.metrics = {"likes": 0, "retweets": 0, "replies": 0}

    def to_dict(self):
        """
        Convert the TweetPost object into a serializable dictionary.

        Returns:
            dict: Dictionary representation of all TweetPost fields.
        """
        return asdict(self)
