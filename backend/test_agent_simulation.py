"""
Test script to simulate AI trading agents with dummy data.
This allows testing agent decision-making without spending real money.
"""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from app.agents.executor import TradingAgent
from app.agents.data_classes import Portfolio


class DryRunSimulation:
    """Simulate trading agents with dummy portfolios (no real trades)"""

    def __init__(self):
        self.agents = []
        self.market_prices = {
            "ETH": 3850.23,
            "BTC": 95420.50,
            "USDC": 1.0
        }

    def create_agent(
        self,
        agent_id: str,
        personality: str,
        risk_score: float,
        starting_cash: float = 10000.0,  # Give them $10k dummy money
        initial_holdings: dict = None
    ):
        """Create a trading agent with dummy portfolio"""

        print(f"\n{'='*60}")
        print(f"Creating Agent: {agent_id}")
        print(f"Personality: {personality}")
        print(f"Risk Score: {risk_score}")
        print(f"Starting Cash: ${starting_cash:.2f} USDC")

        # Create agent
        agent = TradingAgent(
            agent_id=agent_id,
            personality=personality,
            risk_score=risk_score,
            starting_cash=starting_cash,
            model_name="gpt-4o-mini",
            recover_from_crash=False
        )

        # Add initial holdings if provided
        if initial_holdings:
            for token, amount in initial_holdings.items():
                agent.portfolio.holdings[token] = amount
                print(f"Initial Holdings: {amount} {token}")

        # Calculate total portfolio value
        total_value = starting_cash
        for token, amount in agent.portfolio.holdings.items():
            price = self.market_prices.get(token, 0)
            total_value += amount * price

        agent.portfolio.total_value = total_value
        agent.portfolio.starting_val = total_value

        print(f"Total Portfolio Value: ${total_value:,.2f}")
        print(f"{'='*60}\n")

        self.agents.append(agent)
        return agent

    def print_market_summary(self):
        """Display current market prices"""
        print("\n" + "="*60)
        print("CURRENT MARKET PRICES (Live from CoinGecko)")
        print("="*60)

        for token, price in self.market_prices.items():
            print(f"{token:8} ${price:,.2f}")

        print("="*60 + "\n")

    async def run_decision_cycle(self, agent: TradingAgent, task: str = None):
        """Let agent make a decision with current market conditions"""

        if task is None:
            task = "Analyze the current market and decide whether to buy, sell, or hold. Consider your risk tolerance and portfolio balance."

        print(f"\n{'='*60}")
        print(f"Agent {agent.agent_id} Decision Cycle")
        print(f"{'='*60}")
        print(f"Task: {task}\n")

        # Show current portfolio
        print("Current Portfolio:")
        print(f"  Cash (USDC): ${agent.portfolio.cash:,.2f}")
        if agent.portfolio.holdings:
            for token, amount in agent.portfolio.holdings.items():
                price = self.market_prices.get(token, 0)
                value = amount * price
                print(f"  {token}: {amount:.6f} (${value:,.2f})")
        print(f"  Total Value: ${agent.portfolio.total_value:,.2f}\n")

        # Let agent make decision
        print("Agent is thinking...\n")

        try:
            decision = agent.make_decision(task)

            print(f"\n{'='*60}")
            print("AGENT DECISION:")
            print(f"{'='*60}")
            print(decision)
            print(f"{'='*60}\n")

            return decision

        except Exception as e:
            print(f"❌ Error during decision: {e}")
            import traceback
            traceback.print_exc()
            return None

    def print_leaderboard(self):
        """Display leaderboard of all agents"""
        print("\n" + "="*60)
        print("TOURNAMENT LEADERBOARD")
        print("="*60)
        print(f"{'Rank':<6} {'Agent':<15} {'Personality':<20} {'Portfolio Value':<20}")
        print("-"*60)

        # Sort by portfolio value
        sorted_agents = sorted(
            self.agents,
            key=lambda a: a.portfolio.total_value,
            reverse=True
        )

        for rank, agent in enumerate(sorted_agents, 1):
            print(f"{rank:<6} {agent.agent_id:<15} {agent.personality:<20} ${agent.portfolio.total_value:>18,.2f}")

        print("="*60 + "\n")


async def main():
    """Run the simulation"""

    print("\n" + "🤖 " * 20)
    print("AI TRADING AGENT SIMULATION - DRY RUN MODE")
    print("(No real trades will be executed)")
    print("🤖 " * 20 + "\n")

    sim = DryRunSimulation()

    # Display current market prices
    sim.print_market_summary()

    # Create diverse agents with different personalities
    print("Creating AI trading agents...\n")

    agent1 = sim.create_agent(
        agent_id="conservative_warren",
        personality="Conservative value investor like Warren Buffett. Focuses on long-term holdings and rarely trades.",
        risk_score=0.2,
        starting_cash=8000.0,
        initial_holdings={"ETH": 0.5, "BTC": 0.02}  # Already has some positions
    )

    agent2 = sim.create_agent(
        agent_id="aggressive_trader",
        personality="Aggressive day trader who seeks quick profits and isn't afraid of volatility.",
        risk_score=0.9,
        starting_cash=10000.0,
        initial_holdings={}  # Starts with all cash
    )

    agent3 = sim.create_agent(
        agent_id="balanced_jane",
        personality="Balanced investor who maintains a diversified portfolio and rebalances periodically.",
        risk_score=0.5,
        starting_cash=5000.0,
        initial_holdings={"ETH": 1.0}  # Has 1 ETH
    )

    # Show initial leaderboard
    sim.print_leaderboard()

    # Run decision cycles for each agent
    print("\n" + "🎯 " * 20)
    print("RUNNING DECISION CYCLES")
    print("🎯 " * 20 + "\n")

    # Agent 1: Conservative - should probably hold or make small moves
    await sim.run_decision_cycle(
        agent1,
        task="The market is currently stable. Analyze your portfolio and decide if any action is needed."
    )

    print("\n" + "⏳ " * 20)
    print("Moving to next agent...")
    print("⏳ " * 20 + "\n")

    # Agent 2: Aggressive - should look for opportunities
    await sim.run_decision_cycle(
        agent2,
        task="You have $10,000 USDC. Look for trading opportunities in the current market."
    )

    print("\n" + "⏳ " * 20)
    print("Moving to next agent...")
    print("⏳ " * 20 + "\n")

    # Agent 3: Balanced - might rebalance
    await sim.run_decision_cycle(
        agent3,
        task="Review your portfolio allocation and consider rebalancing if needed."
    )

    print("\n" + "✅ " * 20)
    print("SIMULATION COMPLETE")
    print("✅ " * 20 + "\n")

    # Final leaderboard (won't change since no real trades executed)
    sim.print_leaderboard()

    print("\n💡 NEXT STEPS:")
    print("="*60)
    print("1. Review the agent decisions above")
    print("2. Note how different personalities influence trading behavior")
    print("3. To run with REAL trades, use the Celery scheduler:")
    print("   celery -A app.celery_config.celery_app worker --loglevel=info")
    print("4. Monitor live data via API endpoints:")
    print("   - /tournaments/{id}/leaderboard")
    print("   - /trades/recent")
    print("   - /market-data/prices")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
