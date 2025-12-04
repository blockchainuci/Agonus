"""
Celery configuration for distributed agent orchestration.

This module configures Celery for handling:
- Agent decision loops
- Tournament management
- Crash recovery
- Periodic tasks
"""

import os
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

# Initialize Celery
celery_app = Celery(
    "agonus_agents",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
    include=["app.agents.scheduler"],
)

# Celery Configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Task execution settings
    task_acks_late=True,  # Acknowledge after task completes
    task_reject_on_worker_lost=True,  # Requeue if worker crashes
    task_track_started=True,  # Track when task starts
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_persistent=True,  # Persist results to disk
    # Retry settings
    task_autoretry_for=(Exception,),  # Auto-retry on any exception
    task_max_retries=3,
    task_default_retry_delay=60,  # 60 seconds between retries
    # Worker settings
    worker_prefetch_multiplier=1,  # Fetch one task at a time
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks
    # Use solo pool to avoid multiprocessing issues with async SQLAlchemy
    worker_pool="solo",  # Single-threaded execution, safe for async
    # Time limits
    task_soft_time_limit=300,  # 5 minutes soft limit
    task_time_limit=600,  # 10 minutes hard limit
    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
)

# Periodic task schedule (Celery Beat)
celery_app.conf.beat_schedule = {
    # Run agent decisions every 5 minutes for live tournaments
    "run-agent-decisions-every-5min": {
        "task": "app.agents.scheduler.run_all_live_tournament_agents",
        "schedule": 300.0,  # 5 minutes in seconds
    },
    # Check for tournament status changes every minute
    "check-tournament-status": {
        "task": "app.agents.scheduler.check_tournament_transitions",
        "schedule": 60.0,  # 1 minute
    },
    # Recover crashed agents every 2 minutes
    "recover-crashed-agents": {
        "task": "app.agents.scheduler.recover_crashed_agents",
        "schedule": 120.0,  # 2 minutes
    },
    # Update agent rankings every 30 seconds
    "update-rankings": {
        "task": "app.agents.scheduler.update_tournament_rankings",
        "schedule": 30.0,  # 30 seconds
    },
    # Cleanup old results at midnight
    "cleanup-old-results": {
        "task": "app.agents.scheduler.cleanup_old_results",
        "schedule": crontab(hour=0, minute=0),  # Midnight daily
    },
}

# Task routing (optional - for scaling specific task types)
# DISABLED: Use default queue for single-worker setup
# To enable multiple queues, uncomment and start workers with: -Q agents,trading,recovery
# celery_app.conf.task_routes = {
#     "app.agents.scheduler.run_agent_decision": {"queue": "agents"},
#     "app.agents.scheduler.execute_agent_trade": {"queue": "trading"},
#     "app.agents.scheduler.recover_agent_state": {"queue": "recovery"},
# }


# Worker initialization - dispose engine in forked processes to avoid connection issues
@celery_app.task(bind=True)
def worker_init_hook(self):
    """
    Called after worker process fork to reinitialize database connections.
    This prevents "another operation is in progress" errors with asyncpg.
    """
    from app.db.database import engine
    # Dispose of any connections inherited from parent process
    engine.sync_engine.dispose()


# Register worker process init signal
from celery.signals import worker_process_init


@worker_process_init.connect
def init_worker_process(**kwargs):
    """
    Reinitialize database engine after worker fork.
    This is crucial for multiprocessing pools with async SQLAlchemy.
    """
    from app.db.database import engine
    # Dispose engine to force new connections in this process
    engine.sync_engine.dispose()
