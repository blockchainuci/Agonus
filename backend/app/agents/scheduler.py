"""
Celery-based agent scheduler for orchestration, recovery, and tournament management.

This module provides distributed task execution for:
- Running agent decision loops
- Managing tournament lifecycles
- Crash recovery
- Ranking updates
- State persistence
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta

from celery import Task, group, chain
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..celery_config import celery_app
from ..db.database import AsyncSessionLocal
from ..db.models import Tournament, Agent, AgentState, StatusEnum
from .executor import TradingAgent
from .tools.database_tool import DatabaseTool

logger = logging.getLogger(__name__)


# ============================================================================
# CELERY TASK BASE CLASS
# ============================================================================


class AgentTask(Task):
    """
    Base task class with automatic retry and error handling.
    """

    autoretry_for = (Exception,)
    max_retries = 3
    default_retry_delay = 60

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Log task failures."""
        logger.error(
            f"Task {self.name} failed: {exc}\n"
            f"Task ID: {task_id}\n"
            f"Args: {args}\n"
            f"Kwargs: {kwargs}\n"
            f"Info: {einfo}"
        )

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Log task retries."""
        logger.warning(
            f"Task {self.name} retrying: {exc}\n"
            f"Task ID: {task_id}\n"
            f"Retry: {self.request.retries}/{self.max_retries}"
        )


# ============================================================================
# AGENT DECISION TASKS
# ============================================================================


@celery_app.task(base=AgentTask, bind=True, name="app.agents.scheduler.run_agent_decision")
def run_agent_decision(
    self, agent_uuid: str, tournament_uuid: str, recover_from_crash: bool = True
) -> Dict[str, Any]:
    """
    Run a single agent's decision loop.

    Args:
        agent_uuid: Agent UUID (as string)
        tournament_uuid: Tournament UUID (as string)
        recover_from_crash: Whether to attempt crash recovery

    Returns:
        Dict with decision result and metrics
    """
    logger.info(
        f"Running agent decision: agent={agent_uuid}, tournament={tournament_uuid}"
    )

    try:
        # Run async task in event loop
        return asyncio.run(
            _run_agent_decision_async(
                UUID(agent_uuid), UUID(tournament_uuid), recover_from_crash
            )
        )
    except Exception as e:
        logger.error(f"Agent decision failed: {e}")
        # Let Celery handle retry
        raise


async def _run_agent_decision_async(
    agent_uuid: UUID, tournament_uuid: UUID, recover_from_crash: bool
) -> Dict[str, Any]:
    """
    Async implementation of agent decision loop.
    """
    async with AsyncSessionLocal() as session:
        try:
            # Load agent from database
            stmt = select(Agent).where(Agent.id == agent_uuid)
            result = await session.execute(stmt)
            agent_model = result.scalar_one_or_none()

            if not agent_model:
                raise ValueError(f"Agent not found: {agent_uuid}")

            # Create database tool
            db_tool = DatabaseTool(session)

            # Initialize trading agent
            agent = TradingAgent(
                agent_id=agent_model.name,
                personality=agent_model.personality,
                risk_score=0.5,  # TODO: Get from agent_model.stats
                agent_uuid=agent_uuid,
                tournament_uuid=tournament_uuid,
                database_tool=db_tool,
                recover_from_crash=recover_from_crash,
            )

            # Attempt recovery if requested
            if recover_from_crash:
                recovered = await agent.recover_state()
                logger.info(f"Recovery {'successful' if recovered else 'not needed'}")

            # Make decision
            decision_result = agent.make_decision()

            # Save state to database
            last_decision = decision_result.get("output", "")
            await agent.save_state(last_decision=last_decision)

            # Return metrics
            performance = agent.evaluate_performance()

            logger.info(
                f"Agent decision completed: {agent_model.name}, "
                f"value=${performance['total_value']:.2f}, "
                f"trades={performance['num_trades']}"
            )

            return {
                "agent_id": str(agent_uuid),
                "tournament_id": str(tournament_uuid),
                "decision": last_decision,
                "performance": performance,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:
            logger.error(f"Agent decision async failed: {e}")
            raise


@celery_app.task(base=AgentTask, name="app.agents.scheduler.run_all_live_tournament_agents")
def run_all_live_tournament_agents() -> Dict[str, Any]:
    """
    Run decision loops for all agents in live tournaments.

    This is a periodic task that orchestrates all active agents.

    Returns:
        Dict with summary of tasks launched
    """
    logger.info("Running all live tournament agents")

    try:
        return asyncio.run(_run_all_live_tournament_agents_async())
    except Exception as e:
        logger.error(f"Failed to run live tournament agents: {e}")
        raise


async def _run_all_live_tournament_agents_async() -> Dict[str, Any]:
    """
    Async implementation of running all live tournament agents.
    """
    async with AsyncSessionLocal() as session:
        # Get all live tournaments
        stmt = select(Tournament).where(Tournament.status == StatusEnum.live)

        result = await session.execute(stmt)
        tournaments = result.scalars().all()
        logger.info(f"Tournaments: {tournaments}")

        logger.info(f"Found {len(tournaments)} live tournaments")

        tasks_launched = []

        for tournament in tournaments:
            # Get all agent states for this tournament
            stmt = select(AgentState).where(AgentState.tournament_id == tournament.id)
            result = await session.execute(stmt)
            agent_states = result.scalars().all()

            logger.info(f"Tournament '{tournament.name}': {len(agent_states)} agents")

            # Launch async task for each agent
            for agent_state in agent_states:
                task = run_agent_decision.delay(
                    agent_uuid=str(agent_state.agent_id),
                    tournament_uuid=str(tournament.id),
                    recover_from_crash=True,
                )
                tasks_launched.append(
                    {
                        "task_id": task.id,
                        "agent_id": str(agent_state.agent_id),
                        "tournament_id": str(tournament.id),
                    }
                )

        return {
            "tournaments_processed": len(tournaments),
            "tasks_launched": len(tasks_launched),
            "tasks": tasks_launched,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# ============================================================================
# TOURNAMENT MANAGEMENT TASKS
# ============================================================================


@celery_app.task(base=AgentTask, name="app.agents.scheduler.check_tournament_transitions")
def check_tournament_transitions() -> Dict[str, Any]:
    """
    Check and transition tournament statuses (upcoming -> live -> completed).

    Returns:
        Dict with tournaments transitioned
    """
    logger.info("Checking tournament status transitions")

    try:
        return asyncio.run(_check_tournament_transitions_async())
    except Exception as e:
        logger.error(f"Failed to check tournament transitions: {e}")
        raise


async def _check_tournament_transitions_async() -> Dict[str, Any]:
    """
    Async implementation of tournament status transitions.
    """
    async with AsyncSessionLocal() as session:
        now = datetime.now(timezone.utc)
        transitions = {"started": [], "completed": []}

        # Start upcoming tournaments
        stmt = select(Tournament).where(
            Tournament.status == StatusEnum.upcoming, Tournament.start_date <= now
        )
        result = await session.execute(stmt)
        tournaments_to_start = result.scalars().all()

        for tournament in tournaments_to_start:
            tournament.status = StatusEnum.live
            transitions["started"].append(
                {"id": str(tournament.id), "name": tournament.name}
            )
            logger.info(f"Tournament started: {tournament.name}")

        # Complete live tournaments
        stmt = select(Tournament).where(
            Tournament.status == StatusEnum.live, Tournament.end_date <= now
        )
        result = await session.execute(stmt)
        tournaments_to_complete = result.scalars().all()

        for tournament in tournaments_to_complete:
            tournament.status = StatusEnum.completed

            # Determine winner (highest portfolio value)
            stmt = (
                select(AgentState)
                .where(AgentState.tournament_id == tournament.id)
                .order_by(AgentState.portfolio_value_usd.desc())
            )
            result = await session.execute(stmt)
            winner_state = result.scalars().first()

            if winner_state:
                tournament.winner_agent_id = winner_state.agent_id
                logger.info(
                    f"Tournament winner: agent={winner_state.agent_id}, "
                    f"value=${winner_state.portfolio_value_usd}"
                )

            transitions["completed"].append(
                {
                    "id": str(tournament.id),
                    "name": tournament.name,
                    "winner_id": (
                        str(tournament.winner_agent_id)
                        if tournament.winner_agent_id
                        else None
                    ),
                }
            )
            logger.info(f"Tournament completed: {tournament.name}")

        await session.commit()

        return {
            "transitions": transitions,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


@celery_app.task(base=AgentTask, name="app.agents.scheduler.update_tournament_rankings")
def update_tournament_rankings() -> Dict[str, Any]:
    """
    Update agent rankings for all live tournaments.

    Returns:
        Dict with rankings updated
    """
    logger.info("Updating tournament rankings")

    try:
        return asyncio.run(_update_tournament_rankings_async())
    except Exception as e:
        logger.error(f"Failed to update rankings: {e}")
        raise


async def _update_tournament_rankings_async() -> Dict[str, Any]:
    """
    Async implementation of ranking updates.
    """
    async with AsyncSessionLocal() as session:
        # Get all live tournaments
        stmt = select(Tournament).where(Tournament.status == StatusEnum.live)
        result = await session.execute(stmt)
        tournaments = result.scalars().all()

        rankings_updated = 0

        for tournament in tournaments:
            # Get agent states ordered by portfolio value
            stmt = (
                select(AgentState)
                .where(AgentState.tournament_id == tournament.id)
                .order_by(AgentState.portfolio_value_usd.desc())
            )
            result = await session.execute(stmt)
            agent_states = result.scalars().all()

            # Update ranks
            for rank, agent_state in enumerate(agent_states, start=1):
                if agent_state.rank != rank:
                    agent_state.rank = rank
                    rankings_updated += 1

        await session.commit()

        logger.info(
            f"Updated {rankings_updated} agent rankings across {len(tournaments)} tournaments"
        )

        return {
            "tournaments_processed": len(tournaments),
            "rankings_updated": rankings_updated,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# ============================================================================
# CRASH RECOVERY TASKS
# ============================================================================


@celery_app.task(base=AgentTask, name="app.agents.scheduler.recover_crashed_agents")
def recover_crashed_agents() -> Dict[str, Any]:
    """
    Detect and recover agents that haven't updated in a while.

    Identifies agents as "crashed" if updated_at > 10 minutes ago.

    Returns:
        Dict with recovery attempts
    """
    logger.info("Checking for crashed agents")

    try:
        return asyncio.run(_recover_crashed_agents_async())
    except Exception as e:
        logger.error(f"Failed to recover crashed agents: {e}")
        raise


async def _recover_crashed_agents_async() -> Dict[str, Any]:
    """
    Async implementation of crash recovery.
    """
    async with AsyncSessionLocal() as session:
        # Find agents in live tournaments that haven't updated recently
        stale_threshold = datetime.now(timezone.utc) - timedelta(minutes=10)

        stmt = (
            select(AgentState, Tournament)
            .join(Tournament, AgentState.tournament_id == Tournament.id)
            .where(
                Tournament.status == StatusEnum.live,
                AgentState.updated_at < stale_threshold,
            )
        )
        result = await session.execute(stmt)
        stale_agents = result.all()

        recovery_tasks = []

        for agent_state, tournament in stale_agents:
            logger.warning(
                f"Stale agent detected: agent={agent_state.agent_id}, "
                f"tournament={tournament.name}, "
                f"last_update={agent_state.updated_at}"
            )

            # Launch recovery task
            task = recover_agent_state.delay(
                agent_uuid=str(agent_state.agent_id), tournament_uuid=str(tournament.id)
            )

            recovery_tasks.append(
                {
                    "task_id": task.id,
                    "agent_id": str(agent_state.agent_id),
                    "tournament_id": str(tournament.id),
                    "last_updated": agent_state.updated_at.isoformat(),
                }
            )

        return {
            "stale_agents_found": len(stale_agents),
            "recovery_tasks_launched": len(recovery_tasks),
            "tasks": recovery_tasks,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


@celery_app.task(base=AgentTask, bind=True, name="app.agents.scheduler.recover_agent_state")
def recover_agent_state(self, agent_uuid: str, tournament_uuid: str) -> Dict[str, Any]:
    """
    Recover a specific agent's state from database and resume operation.

    Args:
        agent_uuid: Agent UUID (as string)
        tournament_uuid: Tournament UUID (as string)

    Returns:
        Dict with recovery result
    """
    logger.info(
        f"Recovering agent state: agent={agent_uuid}, tournament={tournament_uuid}"
    )

    try:
        # Run the agent decision with recovery enabled
        return run_agent_decision(
            agent_uuid=agent_uuid,
            tournament_uuid=tournament_uuid,
            recover_from_crash=True,
        )
    except Exception as e:
        logger.error(f"Agent recovery failed: {e}")
        raise


# ============================================================================
# UTILITY TASKS
# ============================================================================


@celery_app.task(base=AgentTask, name="app.agents.scheduler.cleanup_old_results")
def cleanup_old_results() -> Dict[str, Any]:
    """
    Clean up old Celery task results (runs daily at midnight).

    Returns:
        Dict with cleanup summary
    """
    logger.info("Cleaning up old task results")

    # Celery handles this automatically based on result_expires config
    # This task exists for logging/monitoring purposes

    return {"status": "completed", "timestamp": datetime.now(timezone.utc).isoformat()}


@celery_app.task(base=AgentTask, name="app.agents.scheduler.initialize_tournament_agents")
def initialize_tournament_agents(
    tournament_uuid: str, agent_uuids: List[str]
) -> Dict[str, Any]:
    """
    Initialize agent states for a new tournament.

    Args:
        tournament_uuid: Tournament UUID (as string)
        agent_uuids: List of agent UUIDs (as strings)

    Returns:
        Dict with initialization results
    """
    logger.info(f"Initializing agents for tournament: {tournament_uuid}")

    try:
        return asyncio.run(
            _initialize_tournament_agents_async(
                UUID(tournament_uuid), [UUID(uuid) for uuid in agent_uuids]
            )
        )
    except Exception as e:
        logger.error(f"Failed to initialize tournament agents: {e}")
        raise


async def _initialize_tournament_agents_async(
    tournament_uuid: UUID, agent_uuids: List[UUID]
) -> Dict[str, Any]:
    """
    Async implementation of agent initialization.
    """
    async with AsyncSessionLocal() as session:
        db_tool = DatabaseTool(session)
        initialized = []

        for agent_uuid in agent_uuids:
            # Load agent
            stmt = select(Agent).where(Agent.id == agent_uuid)
            result = await session.execute(stmt)
            agent = result.scalar_one_or_none()

            if not agent:
                logger.warning(f"Agent not found: {agent_uuid}")
                continue

            # Create initial portfolio
            from .data_classes import Portfolio

            portfolio = Portfolio(
                agent_id=agent.name,
                cash=500.0,
                holdings={},
                starting_val=500.0,
                total_value=500.0,
            )

            # Save initial state
            await db_tool.save_agent_state(
                agent_uuid=agent_uuid,
                tournament_uuid=tournament_uuid,
                portfolio=portfolio,
                rank=0,
                last_decision="Tournament initialized",
            )

            initialized.append(str(agent_uuid))
            logger.info(f"Initialized agent: {agent.name}")

        return {
            "tournament_id": str(tournament_uuid),
            "agents_initialized": len(initialized),
            "agent_ids": initialized,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
