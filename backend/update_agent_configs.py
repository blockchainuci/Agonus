#!/usr/bin/env python3
"""
Update existing agents with differentiated configurations.

Usage:
    cd backend
    python update_agent_configs.py

This updates the stats.config field for all existing agents
without touching tournaments, bets, or agent states.
"""

import asyncio
import os
import sys
from uuid import uuid4

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.db.models import Agent


# Agent configurations to apply - MATCH YOUR DATABASE AGENT NAMES
AGENT_CONFIGS = {
    "Alpha Trader": {
        "temperature": 0.85,
        "model_name": "gpt-4o-mini",
        "allowed_tokens": ["ETH", "SOL", "AVAX", "SUI", "LINK"],
        "allowed_tools": [
            "get_market_price", "get_market_sentiment", "get_technical_indicator",
            "get_portfolio_status", "execute_trade", "research_token",
            "create_plan_step", "list_plan_steps", "cancel_plan_step", "reschedule_plan_step"
        ],
        "max_position_size_pct": 0.25,
        "min_confidence_threshold": 0.45,
    },
    "Beta Analyst": {
        "temperature": 0.4,
        "model_name": "gpt-4o-mini",
        "allowed_tokens": ["ETH", "BTC"],
        "allowed_tools": [
            "get_market_price", "get_portfolio_status", "execute_trade"
        ],
        "max_position_size_pct": 0.05,
        "min_confidence_threshold": 0.8,
    },
    "Gamma Quant": {
        "temperature": 0.6,
        "model_name": "gpt-4o-mini",
        "allowed_tokens": ["ETH", "WETH", "BTC", "CBBTC", "TBTC", "SOL", "AVAX", "SUI", "LINK", "BNB", "DOGE", "XRP", "TRX"],
        "allowed_tools": [
            "get_market_price", "get_market_sentiment", "get_technical_indicator",
            "get_portfolio_status", "execute_trade", "create_plan_step",
            "list_plan_steps", "cancel_plan_step", "reschedule_plan_step"
        ],
        "max_position_size_pct": 0.18,
        "min_confidence_threshold": 0.6,
    },
    "Omega Trickster": {
        "temperature": 0.9,
        "model_name": "gpt-4o-mini",
        "allowed_tokens": ["SOL", "AVAX", "SUI", "LINK", "ETH"],
        "allowed_tools": [
            "get_market_price", "get_market_sentiment", "get_technical_indicator",
            "get_portfolio_status", "execute_trade", "research_token",
            "create_plan_step", "list_plan_steps", "cancel_plan_step", "reschedule_plan_step"
        ],
        "max_position_size_pct": 0.30,
        "min_confidence_threshold": 0.4,
    },
    "Wonderful Wimpster": {
        "temperature": 0.35,
        "model_name": "gpt-4o-mini",
        "allowed_tokens": ["ETH", "WETH", "BTC", "CBBTC", "TBTC", "SOL", "AVAX", "SUI", "LINK", "BNB", "DOGE", "XRP", "TRX"],
        "allowed_tools": [
            "get_market_price", "get_portfolio_status", "execute_trade"
        ],
        "max_position_size_pct": 0.15,
        "min_confidence_threshold": 0.75,
    },
}


async def update_agent_configs():
    """Update existing agents with new configs."""
    print("\n" + "=" * 60)
    print("  UPDATING AGENT CONFIGURATIONS")
    print("=" * 60)
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Agent))
        agents = result.scalars().all()
        
        print(f"\nFound {len(agents)} agents to update\n")
        
        updated_count = 0
        for agent in agents:
            if agent.name in AGENT_CONFIGS:
                config = AGENT_CONFIGS[agent.name]
                
                if agent.stats is None:
                    agent.stats = {}
                
                agent.stats["config"] = config
                
                print(f"  ✓ Updated {agent.name}:")
                print(f"    Temperature: {config['temperature']}")
                print(f"    Tokens: {', '.join(config['allowed_tokens'])}")
                print(f"    Tools: {len(config['allowed_tools'])} enabled")
                print(f"    Max Position: {config['max_position_size_pct']*100:.0f}%")
                updated_count += 1
            else:
                print(f"  ⚠ Skipped {agent.name} (no config defined)")
        
        await session.commit()
        
        print("\n" + "=" * 60)
        print(f"  Updated {updated_count} agents successfully!")
        print("=" * 60)
        print("\n  Agents will use new configs on next decision cycle.")
        print("  No restart required.\n")


if __name__ == "__main__":
    asyncio.run(update_agent_configs())
