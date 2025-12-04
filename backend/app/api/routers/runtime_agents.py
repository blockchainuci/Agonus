from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Dict, Any

from app.tools.market_data import MarketDataTool
from app.agents.executor import ACTIVE_AGENTS

router = APIRouter(prefix="/runtime/agents", tags=["runtime-agents"])

# Shared market tool instance for caching
_market_tool = MarketDataTool()


@router.get("/{agent_id}/portfolio")
async def get_agent_portfolio(agent_id: int) -> Dict[str, Any]:
    """Get the agent's current portfolio with live pricing."""
    if agent_id not in ACTIVE_AGENTS:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    agent = ACTIVE_AGENTS[agent_id]

    holdings = agent.get_holdings()
    cash = agent.get_available_cash()

    all_prices = _market_tool.get_all_prices()

    holdings_value = 0.0
    holdings_enriched = {}

    for token, qty in holdings.items():
        price = all_prices.get(token, 0.0)
        value = qty * price
        holdings_value += value

        holdings_enriched[token] = {
            "quantity": qty,
            "current_price": price,
            "total_value": value,
        }

    total_value = cash + holdings_value

    portfolio = agent.get_portfolio_status()

    return {
        "agent_id": agent_id,
        "cash": cash,
        "holdings": holdings_enriched,
        "holdings_value": holdings_value,
        "total_value": total_value,
        "performance": {
            "starting_value": portfolio.starting_val,
            "realized_pnl": portfolio.realized_pnl,
            "unrealized_pnl": portfolio.unrealized_pnl,
            "total_pnl": portfolio.realized_pnl + portfolio.unrealized_pnl,
            "roi": portfolio.roi,
            "roi_percent": portfolio.roi * 100,
            "num_trades": portfolio.num_trades,
            "win_rate": portfolio.win_rate,
            "num_winning_trades": portfolio.num_winning_trades,
            "num_losing_trades": portfolio.num_losing_trades,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/")
async def list_agents() -> Dict[str, Any]:
    """List all active agents with summaries."""

    agents_list = []

    all_prices = _market_tool.get_all_prices() if ACTIVE_AGENTS else {}

    for agent_id, agent in ACTIVE_AGENTS.items():
        holdings = agent.get_holdings()
        cash = agent.get_available_cash()

        holdings_value = sum(
            qty * all_prices.get(token, 0.0) for token, qty in holdings.items()
        )

        total_value = cash + holdings_value

        portfolio = agent.get_portfolio_status()

        agents_list.append({
            "agent_id": agent_id,
            "name": f"Agent-{agent_id}",
            "type": agent.__class__.__name__,
            "personality": agent.personality,
            "risk_score": agent.risk_score,
            "total_value": total_value,
            "cash": cash,
            "holdings_value": holdings_value,
            "roi": portfolio.roi,
            "roi_percent": portfolio.roi * 100,
            "num_trades": portfolio.num_trades,
            "win_rate": portfolio.win_rate,
        })

    return {
        "agents": agents_list,
        "total_agents": len(agents_list),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/market/prices")
async def get_market_prices() -> Dict[str, Any]:
    """Get current market prices for all supported tokens."""
    prices = _market_tool.get_all_prices()
    sentiment = _market_tool.get_market_sentiment()

    enriched = {}

    for token, price in prices.items():
        try:
            volume = _market_tool.get_volume(token)
            enriched[token] = {
                "symbol": token,
                "price": price,
                "volume_24h": volume,
            }
        except:
            enriched[token] = {
                "symbol": token,
                "price": price,
            }

    return {
        "prices": enriched,
        "market_sentiment": sentiment,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/{agent_id}/trades")
async def get_agent_trades(agent_id: int, limit: int = 20) -> Dict[str, Any]:
    """Get recent trades for an agent."""
    if agent_id not in ACTIVE_AGENTS:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    agent = ACTIVE_AGENTS[agent_id]
    recent_trades = agent.get_short_term_memory(limit)

    trades_list = [
        {
            "trade_id": t.trade_id,
            "action": t.action,
            "token": t.token,
            "quantity": t.qty,
            "price": t.price,
            "total_value": t.qty * t.price,
            "confidence": t.confidence,
            "realized_pnl": t.realized_pnl,
            "roi": t.roi,
            "summary": t.summary,
            "timestamp": t.timestamp.isoformat(),
        }
        for t in recent_trades
    ]

    return {
        "agent_id": agent_id,
        "trades": trades_list,
        "count": len(trades_list),
        "timestamp": datetime.utcnow().isoformat(),
    }
