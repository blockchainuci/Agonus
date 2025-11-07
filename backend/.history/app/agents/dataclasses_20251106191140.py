from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict


@dataclass
class MarketData:
    '''
        Gives all the market data info for one crytocurrency
    '''

    symbol: str #Crypto symbol: "BTC", "ETH", etc.
    

