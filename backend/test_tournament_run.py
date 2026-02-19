"""
Run one decision cycle for ALL agents in a live tournament.
Shows how different personalities behave with the same market conditions.

Usage:
    set -a && source .env.local && set +a && venv/bin/python test_tournament_run.py
"""
import asyncio
import os
import logging
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

load_dotenv()

from app.db.database import AsyncSessionLocal
from app.db.models import Agent, Tournament, AgentState, StatusEnum
from app.agents.executor import TradingAgent, AGENT_CONFIGS
from app.agents.tools.database_tool import DatabaseTool
from sqlalchemy import select


async def run_single_agent(session, agent_model, tournament, db_tool):
    """Run one decision cycle for a single agent. Returns performance dict."""
    stats = agent_model.stats or {}
    cfg = AGENT_CONFIGS.get(agent_model.name, {})
    risk_score          = stats.get("risk_score",          cfg.get("risk_score",          0.5))
    temperature         = stats.get("temperature",         cfg.get("temperature",         0.7))
    allowed_tokens      = stats.get("allowed_tokens",      cfg.get("allowed_tokens",      None))
    max_position_pct    = stats.get("max_position_pct",    cfg.get("max_position_pct",    1.0))
    min_cash_reserve    = stats.get("min_cash_reserve_pct",cfg.get("min_cash_reserve_pct",0.0))
    allowed_tools       = stats.get("allowed_tools",       cfg.get("allowed_tools",       None))
    max_trades_per_cycle= stats.get("max_trades_per_cycle",cfg.get("max_trades_per_cycle",10))
    preferred_indicators= stats.get("preferred_indicators",cfg.get("preferred_indicators",None))
    agent_system_prompt = stats.get("system_prompt",       cfg.get("system_prompt",       None))

    agent = TradingAgent(
        agent_id=agent_model.name,
        personality=agent_model.personality,
        risk_score=risk_score,
        agent_uuid=agent_model.id,
        tournament_uuid=tournament.id,
        database_tool=db_tool,
        recover_from_crash=True,
        temperature=temperature,
        allowed_tokens=allowed_tokens,
        max_position_pct=max_position_pct,
        min_cash_reserve_pct=min_cash_reserve,
        allowed_tools=allowed_tools,
        max_trades_per_cycle=max_trades_per_cycle,
        preferred_indicators=preferred_indicators,
        agent_system_prompt=agent_system_prompt,
    )

    recovered = await agent.recover_state()
    status = "recovered" if recovered else "fresh"
    print(f"  [{status}] cash=${agent.portfolio.cash:.2f}")

    decision_result = agent.make_decision()

    last_decision = decision_result.get("output", "")
    await agent.save_state(last_decision=last_decision)

    performance = agent.evaluate_performance()
    return performance, last_decision


async def run_tournament_cycle():
    """Run one full decision cycle for all agents in the live tournament."""

    async with AsyncSessionLocal() as session:
        # Find live tournament
        stmt = select(Tournament).where(Tournament.status == StatusEnum.live)
        result = await session.execute(stmt)
        tournament = result.scalar_one_or_none()

        if not tournament:
            print("No live tournament found! Run seed_data.py first.")
            return

        print(f"\n{'='*70}")
        print(f"  TOURNAMENT: {tournament.name}")
        print(f"  ID: {tournament.id}")
        print(f"{'='*70}")

        # Get all agents in the tournament
        agent_uuids = list(
            (tournament.agent_contract_mapping or {}).keys()
        )

        if not agent_uuids:
            print("No agents enrolled in tournament!")
            return

        stmt = select(Agent).where(Agent.id.in_(agent_uuids))
        result = await session.execute(stmt)
        agents = result.scalars().all()

        print(f"  Agents enrolled: {len(agents)}\n")

        db_tool = DatabaseTool(session)
        results = []

        for i, agent_model in enumerate(agents, 1):
            print(f"\n{'─'*70}")
            print(f"  [{i}/{len(agents)}] {agent_model.name}")
            print(f"  Personality: {agent_model.personality}")
            cfg = AGENT_CONFIGS.get(agent_model.name, {})
            stats = agent_model.stats or {}
            risk = stats.get("risk_score", cfg.get("risk_score", 0.5))
            print(f"  Risk: {risk}  temp: {cfg.get('temperature', 0.7)}  "
                  f"max_pos: {cfg.get('max_position_pct', 1.0)*100:.0f}%  "
                  f"min_cash: {cfg.get('min_cash_reserve_pct', 0.0)*100:.0f}%  "
                  f"trades/cycle: {cfg.get('max_trades_per_cycle', 10)}")
            print(f"{'─'*70}")

            try:
                performance, decision = await run_single_agent(
                    session, agent_model, tournament, db_tool
                )
                results.append((agent_model, performance, decision))
                print(f"\n  >> Decision: {decision[:200]}...")
            except Exception as e:
                print(f"\n  !! ERROR: {e}")
                results.append((agent_model, None, str(e)))

        # Summary table
        print(f"\n\n{'='*70}")
        print(f"  TOURNAMENT SUMMARY")
        print(f"{'='*70}")
        print(f"  {'Agent':<15} {'Personality':<14} {'Risk':<6} {'Cash':>10} {'Value':>10} {'ROI':>8} {'Trades':>7}")
        print(f"  {'─'*15} {'─'*14} {'─'*6} {'─'*10} {'─'*10} {'─'*8} {'─'*7}")

        for agent_model, perf, _ in results:
            if perf is None:
                print(f"  {agent_model.name:<15} {agent_model.personality:<14} {'—':>6} {'ERROR':>10}")
                continue
            _cfg = AGENT_CONFIGS.get(agent_model.name, {})
            _stats = agent_model.stats or {}
            risk = _stats.get("risk_score", _cfg.get("risk_score", 0.5))
            print(
                f"  {perf['agent_id']:<15} "
                f"{agent_model.personality:<14} "
                f"{risk:<6.1f} "
                f"${perf['cash']:>9.2f} "
                f"${perf['total_value']:>9.2f} "
                f"{perf['roi_percent']:>7.2f}% "
                f"{perf['num_trades']:>7}"
            )

        print(f"{'='*70}\n")


if __name__ == "__main__":
    print("\n" + "="*70)
    print("  FULL TOURNAMENT CYCLE TEST")
    print("="*70)

    try:
        asyncio.run(run_tournament_cycle())
        print("✓ Tournament cycle completed!\n")
    except Exception as e:
        print(f"\n✗ Failed: {e}\n")
        import traceback
        traceback.print_exc()
