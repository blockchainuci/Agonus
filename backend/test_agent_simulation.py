"""
Test script to simulate all 6 tournament agents using their real AGENT_CONFIGS.
Runs without a DB — no Celery, no Redis required.

Usage:
    cd backend
    python test_agent_simulation.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from app.agents.executor import TradingAgent, AGENT_CONFIGS

# Mirrors seed_data.py AGENTS — name + personality only
SEED_AGENTS = [
    {"name": "AlphaBot",     "personality": "aggressive"},
    {"name": "TrendRider",   "personality": "aggressive"},
    {"name": "SwingKing",    "personality": "balanced"},
    {"name": "DipBuyer",     "personality": "contrarian"},
    {"name": "SentimentBot", "personality": "analytical"},
    {"name": "SafeHaven",    "personality": "conservative"},
]

STARTING_CASH = 500.0  # Match real tournament


def create_agent(seed: dict) -> TradingAgent:
    name = seed["name"]
    personality = seed["personality"]
    cfg = AGENT_CONFIGS.get(name, {})

    print(f"\n  {name} ({personality})")
    print(f"    temp={cfg.get('temperature', 0.7)}  "
          f"risk={cfg.get('risk_score', 0.5)}  "
          f"max_pos={cfg.get('max_position_pct', 1.0)*100:.0f}%  "
          f"min_cash={cfg.get('min_cash_reserve_pct', 0.0)*100:.0f}%  "
          f"trades/cycle={cfg.get('max_trades_per_cycle', 10)}")
    print(f"    tokens : {cfg.get('allowed_tokens', ['all'])}")
    print(f"    indicators: {cfg.get('preferred_indicators', ['any'])}")

    return TradingAgent(
        agent_id=name,
        personality=personality,
        risk_score=cfg.get("risk_score", 0.5),
        starting_cash=STARTING_CASH,
        model_name="gpt-4o-mini",
        recover_from_crash=False,
        temperature=cfg.get("temperature", 0.7),
        allowed_tokens=cfg.get("allowed_tokens"),
        max_position_pct=cfg.get("max_position_pct", 1.0),
        min_cash_reserve_pct=cfg.get("min_cash_reserve_pct", 0.0),
        allowed_tools=cfg.get("allowed_tools"),
        max_trades_per_cycle=cfg.get("max_trades_per_cycle", 10),
        preferred_indicators=cfg.get("preferred_indicators"),
        agent_system_prompt=cfg.get("system_prompt"),
    )


def print_leaderboard(agents: list[TradingAgent]):
    print("\n" + "=" * 72)
    print("LEADERBOARD")
    print("=" * 72)
    print(f"{'Rank':<5} {'Agent':<14} {'Personality':<13} "
          f"{'Value':>10} {'Cash':>10} {'Trades':>7} {'ROI':>8}")
    print("-" * 72)

    sorted_agents = sorted(agents, key=lambda a: a.portfolio.total_value, reverse=True)

    for rank, agent in enumerate(sorted_agents, 1):
        pf = agent.portfolio
        roi = (pf.total_value - pf.starting_val) / pf.starting_val * 100
        print(f"{rank:<5} {agent.agent_id:<14} {agent.personality:<13} "
              f"${pf.total_value:>9,.2f} ${pf.cash:>9,.2f} "
              f"{pf.num_trades:>7} {roi:>+7.1f}%")

    print("=" * 72 + "\n")


async def run_cycle(agent: TradingAgent, cycle: int):
    print(f"\n{'─'*60}")
    print(f"  {agent.agent_id}  |  cycle {cycle}  |  "
          f"cash ${agent.portfolio.cash:.2f}  |  "
          f"holdings {list(agent.portfolio.holdings.keys()) or 'none'}")
    print(f"{'─'*60}")

    try:
        agent.make_decision()
        pf = agent.portfolio
        print(f"  -> trades this cycle: {agent._trades_this_cycle}  |  "
              f"total value: ${pf.total_value:.2f}  |  "
              f"cash: ${pf.cash:.2f}")
    except Exception as e:
        import traceback
        print(f"  ERROR: {e}")
        traceback.print_exc()


async def main():
    print("\n" + "=" * 72)
    print("  AGONUS TOURNAMENT SIMULATION")
    print(f"  {len(SEED_AGENTS)} agents  |  starting cash ${STARTING_CASH:.0f}  |  no DB")
    print("=" * 72)

    # Build agents
    print("\nInitializing agents:")
    agents = [create_agent(s) for s in SEED_AGENTS]

    print_leaderboard(agents)

    # Run 1 decision cycle per agent sequentially
    print("=" * 72)
    print("  DECISION CYCLE 1")
    print("=" * 72)

    for agent in agents:
        await run_cycle(agent, cycle=1)

    print_leaderboard(agents)


if __name__ == "__main__":
    asyncio.run(main())