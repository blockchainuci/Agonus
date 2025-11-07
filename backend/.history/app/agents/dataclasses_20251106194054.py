from dataclasses import dataclass
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
        '''
         Convert the MarketData object into a serializable dictionary.
        Useful for logging, JSON serialization, or passing between services.

        Returns:
            dict: Dictionary representation of the MarketData object.
        '''
        pass
    
    


@dataclass
class Trade:
    '''
    This class represents a trade done by an agent. Holds all information regarding trades.
    '''

    
    
    
