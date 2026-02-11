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
from .make_trade_tool import MakeTradeTool
from .tweet_post_tool import TweetPostTool
from .database_tool import DatabaseTool
from .plan_tool import PlanTool
from .research_tool import ResearchTool

# Deprecated: These tools are kept for backwards compatibility
# Use MakeTradeTool instead for simulated trading
from .trade_tool import TradeTool  # Deprecated: on-chain execution
from .portfolio_tool import PortfolioTool  # Deprecated: use MakeTradeTool

__all__ = [
    "MarketDataTool",
    "MakeTradeTool",
    "TweetPostTool",
    "DatabaseTool",
    "PlanTool",
    "ResearchTool",
    # Deprecated
    "TradeTool",
    "PortfolioTool",
]
