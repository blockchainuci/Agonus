"""Tools package exports for agents.

This module re-exports tool classes for convenient imports like
`from app.agents.tools import MarketDataTool`.
"""
import logging

# Configure logging for the tools package
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

from .market_data_tool import MarketDataTool
from .trade_tool import TradeTool
from .tweet_post_tool import TweetPostTool
from .database_tool import DatabaseTool
from .plan_tool import PlanTool

# Deprecated: These tools are kept for backwards compatibility
from .make_trade_tool import MakeTradeTool  # Deprecated: use TradeTool for on-chain execution
from .portfolio_tool import PortfolioTool  # Deprecated: use TradeTool

__all__ = [
    "MarketDataTool",
    "TradeTool",
    "TweetPostTool",
    "DatabaseTool",
    "PlanTool",
    # Deprecated
    "MakeTradeTool",
    "PortfolioTool",
]
