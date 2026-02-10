#!/usr/bin/env python3
"""
Demo script for the Trading Agent with simulated trades.

This script demonstrates how the agent works without needing:
- Database connection
- On-chain execution
- Full Celery setup

Usage:
    cd backend
    python demo_agent.py

Requirements:
    - OPENAI_API_KEY environment variable set
    - pip install langchain langchain-openai requests
"""

import os
import sys
import asyncio

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.agents.data_classes import Portfolio
from app.agents.tools.market_data_tool import MarketDataTool
from app.agents.tools.make_trade_tool import MakeTradeTool
from app.agents.tools.math_tool import MathTool


def print_header(text: str):
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_portfolio(portfolio: Portfolio):
    print(f"\n  Cash:           ${portfolio.cash:.2f}")
    print(f"  Holdings:       {portfolio.holdings}")
    print(f"  Holdings Value: ${portfolio.holdings_val:.2f}")
    print(f"  Total Value:    ${portfolio.total_value:.2f}")
    print(f"  ROI:            {portfolio.roi * 100:.2f}%")
    print(f"  Trades:         {portfolio.num_trades}")
    print(f"  Win Rate:       {portfolio.win_rate * 100:.1f}%")


async def demo_make_trade_tool():
    """Demo the MakeTradeTool directly (no LLM needed)."""
    print_header("Demo: MakeTradeTool (Simulated Trading)")

    # Initialize components
    portfolio = Portfolio(
        agent_id="demo_agent",
        cash=500.0,
        holdings={},
        starting_val=500.0,
        total_value=500.0,
    )
    market_tool = MarketDataTool()
    trade_tool = MakeTradeTool(
        agent_id="demo_agent",
        portfolio=portfolio,
        market_tool=market_tool,
        database_tool=None,  # No DB for demo
    )

    print("\n[1] Initial Portfolio State:")
    print_portfolio(portfolio)

    # Get current prices
    eth_price = market_tool.get_price("ETH")
    btc_price = market_tool.get_price("BTC")
    print(f"\n[2] Current Market Prices:")
    print(f"  ETH: ${eth_price:,.2f}")
    print(f"  BTC: ${btc_price:,.2f}")

    # Execute a BUY trade
    print("\n[3] Executing BUY trade: $150 worth of ETH...")
    try:
        trade = await trade_tool.execute_trade(
            action="BUY",
            token="ETH",
            amount=150.0,
            confidence=0.8,
            summary="Demo buy - bullish on ETH",
        )
        print(f"  Trade executed!")
        print(f"  Bought: {trade.qty:.6f} WETH at ${trade.price:.2f}")
    except Exception as e:
        print(f"  Trade failed: {e}")

    print("\n[4] Portfolio after BUY:")
    trade_tool.recalculate_holdings_value()
    print_portfolio(portfolio)

    # Execute another BUY (BTC this time)
    print("\n[5] Executing BUY trade: $100 worth of BTC...")
    try:
        trade = await trade_tool.execute_trade(
            action="BUY",
            token="BTC",
            amount=100.0,
            confidence=0.75,
            summary="Demo buy - diversifying into BTC",
        )
        print(f"  Trade executed!")
        print(f"  Bought: {trade.qty:.8f} CBBTC at ${trade.price:.2f}")
    except Exception as e:
        print(f"  Trade failed: {e}")

    print("\n[6] Portfolio after second BUY:")
    trade_tool.recalculate_holdings_value()
    print_portfolio(portfolio)

    # Execute a SELL trade
    eth_holdings = portfolio.holdings.get("WETH", 0)
    if eth_holdings > 0:
        sell_amount = eth_holdings / 2  # Sell half
        print(f"\n[7] Executing SELL trade: {sell_amount:.6f} WETH...")
        try:
            trade = await trade_tool.execute_trade(
                action="SELL",
                token="ETH",
                amount=sell_amount,
                confidence=0.7,
                summary="Demo sell - taking partial profits",
            )
            print(f"  Trade executed!")
            print(f"  Sold: {trade.qty:.6f} WETH at ${trade.price:.2f}")
            if trade.realized_pnl is not None:
                print(f"  Realized PnL: ${trade.realized_pnl:.2f}")
        except Exception as e:
            print(f"  Trade failed: {e}")

    print("\n[8] Final Portfolio State:")
    trade_tool.recalculate_holdings_value()
    print_portfolio(portfolio)

    # Show portfolio status dict
    print("\n[9] Portfolio Status (as dict):")
    status = trade_tool.get_portfolio_status()
    for key, value in status.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.4f}")
        else:
            print(f"  {key}: {value}")


def demo_trading_agent():
    """Demo the full TradingAgent with LLM decision-making."""
    print_header("Demo: TradingAgent (LLM Decision Making)")

    # Check for OpenAI API key
    if not os.environ.get("OPENAI_API_KEY"):
        print("\n  OPENAI_API_KEY not set!")
        print("  Set it with: export OPENAI_API_KEY='your-key-here'")
        print("  Skipping LLM demo...\n")
        return

    from app.agents.executor import TradingAgent

    # Create agent with different personalities
    personalities = [
        ("Conservative Carl", "conservative", 0.3),
        ("Balanced Bob", "balanced", 0.5),
        # ("Aggressive Alice", "aggressive", 0.8),  # Uncomment to test
    ]

    for name, personality, risk_score in personalities:
        print(f"\n--- Agent: {name} (risk={risk_score}) ---")

        agent = TradingAgent(
            agent_id=name.lower().replace(" ", "_"),
            personality=personality,
            risk_score=risk_score,
            database_tool=None,  # No DB for demo
            starting_cash=500.0,
            model_name="gpt-4o-mini",
        )

        # Show MathTool indicators before decision
        math_tool = MathTool(market_tool=agent.market_tool)
        indicators = ["rsi", "sma", "ema", "macd", "bbands", "atr", "volatility"]
        print("\n  Indicators (BTC):")
        for indicator in indicators:
            try:
                value = math_tool.get_indicator("BTC", indicator)
                print(f"    {indicator}: {value}")
            except Exception as e:
                print(f"    {indicator}: error: {e}")

        print(f"\n  Initial portfolio: ${agent.portfolio.total_value:.2f}")
        print(f"  Making decision...\n")

        try:
            result = agent.make_decision()
            print(f"\n  Decision output:")
            print(f"  {result.get('output', 'No output')[:500]}")

            # Show final state
            print(f"\n  Final portfolio: ${agent.portfolio.total_value:.2f}")
            print(f"  Trades executed: {agent.portfolio.num_trades}")
        except Exception as e:
            print(f"  Error: {e}")


def main():
    print("\n")
    print("*" * 60)
    print("*" + " " * 58 + "*")
    print("*     AGONUS Trading Agent Demo                          *")
    print("*     Simulated Trading (No On-Chain Execution)          *")
    print("*" + " " * 58 + "*")
    print("*" * 60)

    # Run MakeTradeTool demo
    asyncio.run(demo_make_trade_tool())

    # Run TradingAgent demo (requires OpenAI API key)
    demo_trading_agent()

    print("\n" + "=" * 60)
    print("  Demo Complete!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
