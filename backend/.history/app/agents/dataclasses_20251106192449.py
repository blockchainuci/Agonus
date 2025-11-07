from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict


@dataclass
class MarketData:
    '''
        Gives all the market data info for one crytocurrency
    '''

    symbol: str          #Crypto symbol: "BTC", "ETH", etc.
    price: float         #current price in USD
    market_cap: float    #total market cap
    volume_24h: float    # 24h volume
    rsi_14: float        # RSI indicator
    ma_50: float         # 50-day MA
    ma_200: float        # 200-day MA
    timestamp: datetime  # When captured

    def to_dict(self) -> dict:
        ''' 
        
        '''

