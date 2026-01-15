# Celery Setup Guide

## Overview

The Agonus platform uses Celery for distributed agent orchestration, providing:
- **Automatic crash recovery** - Agents auto-recover from failures
- **Distributed execution** - Scale across multiple workers
- **Periodic scheduling** - Run agents on autopilot
- **Retry logic** - Built-in error handling
- **Real-time monitoring** - Track agent performance

## Architecture

```
┌─────────────────┐
│  Celery Beat    │  Periodic scheduler (runs every 5min, 1min, etc.)
│  (Scheduler)    │
└────────┬────────┘
         │ triggers
         ▼
┌─────────────────┐
│  Task Queue     │  Redis broker queues tasks
│  (Redis)        │
└────────┬────────┘
         │ consumes
         ▼
┌─────────────────┐
│  Celery Workers │  Execute agent decisions, trades, recovery
│  (1-N instances)│
└────────┬────────┘
         │ updates
         ▼
┌─────────────────┐
│  PostgreSQL     │  Stores agent state, trades, rankings
│  (Database)     │
└─────────────────┘
```

## Installation

### 1. Install Dependencies

```bash
cd backend
pip install celery redis flower
```

Add to `requirements.txt`:
```
celery==5.3.4
redis==5.0.1
flower==2.0.1  # Optional: Web UI for monitoring
```

### 2. Set Environment Variables

Add to `.env`:
```bash
# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### 3. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or using Homebrew (Mac)
brew install redis
brew services start redis
```

## Running the System

### Start Celery Worker

```bash
cd backend
celery -A app.celery_config.celery_app worker --loglevel=info
```

**Note:** The worker uses the "solo" pool by default (single-threaded) to avoid multiprocessing issues with async SQLAlchemy. This is configured in `celery_config.py` with `worker_pool="solo"`.

**For development with auto-reload:**
```bash
watchmedo auto-restart --directory=./app --pattern=*.py --recursive -- \
  celery -A app.celery_config.celery_app worker --loglevel=info
```

### Start Celery Beat (Scheduler)

```bash
celery -A app.celery_config.celery_app beat --loglevel=info
```

### Start Flower (Optional Monitoring UI)

```bash
celery -A app.celery_config.celery_app flower
```

Then visit: http://localhost:5555

## Task Overview

### Periodic Tasks (Auto-run)

| Task | Schedule | Description |
|------|----------|-------------|
| `run_all_live_tournament_agents` | Every 5 min | Runs all agents in live tournaments |
| `check_tournament_transitions` | Every 1 min | Starts/ends tournaments based on dates |
| `recover_crashed_agents` | Every 2 min | Detects & recovers stale agents |
| `update_tournament_rankings` | Every 30 sec | Updates agent rankings |
| `cleanup_old_results` | Daily at midnight | Cleans up old task results |

### Manual Tasks (Call via API)

| Task | Description |
|------|-------------|
| `run_agent_decision` | Run single agent decision loop |
| `recover_agent_state` | Manually recover specific agent |
| `initialize_tournament_agents` | Setup agents for new tournament |

## Usage Examples

### Initialize Tournament

```python
from backend.app.agents.scheduler import initialize_tournament_agents

# Start a tournament with agents
result = initialize_tournament_agents.delay(
    tournament_uuid="uuid-here",
    agent_uuids=["agent-uuid-1", "agent-uuid-2"]
)

# Get result
print(result.get(timeout=30))
```

### Run Single Agent

```python
from backend.app.agents.scheduler import run_agent_decision

# Run specific agent
task = run_agent_decision.delay(
    agent_uuid="agent-uuid",
    tournament_uuid="tournament-uuid",
    recover_from_crash=True
)

# Check status
print(task.state)  # PENDING, STARTED, SUCCESS, FAILURE, RETRY

# Get result when ready
result = task.get(timeout=60)
print(result['performance'])
```

### Monitor Tasks via Flower

1. Start Flower: `celery -A app.celery_config.celery_app flower`
2. Visit http://localhost:5555
3. View:
   - Active tasks
   - Task history
   - Worker status
   - Task success/failure rates

## Crash Recovery

### How It Works

1. **Detection**: Every 2 minutes, `recover_crashed_agents` checks for agents with `updated_at > 10 min ago`
2. **Recovery**: Launches `recover_agent_state` task for each stale agent
3. **Restoration**: Agent loads state from database (portfolio, trades, memory)
4. **Resume**: Agent continues trading from last known state

### Manual Recovery

```python
from backend.app.agents.scheduler import recover_agent_state

# Force recovery of specific agent
recover_agent_state.delay(
    agent_uuid="agent-uuid",
    tournament_uuid="tournament-uuid"
)
```

## Scaling

### Multiple Workers

Run multiple worker processes for parallel execution:

```bash
# Worker 1 - General tasks
celery -A app.celery_config.celery_app worker -Q agents,trading -n worker1@%h

# Worker 2 - Recovery tasks
celery -A app.celery_config.celery_app worker -Q recovery -n worker2@%h

# Worker 3 - All queues
celery -A app.celery_config.celery_app worker -n worker3@%h
```

### Queue Routing

Tasks are automatically routed:
- `agents` queue: Agent decision tasks
- `trading` queue: Trade execution tasks
- `recovery` queue: Crash recovery tasks

## Monitoring & Debugging

### Check Task Status

```python
from celery.result import AsyncResult

task = AsyncResult("task-id-here")
print(task.state)  # Current state
print(task.info)   # Result or exception info
```

### View Logs

```bash
# Worker logs
tail -f celery_worker.log

# Beat logs
tail -f celery_beat.log
```

### Inspect Workers

```bash
# List active tasks
celery -A app.celery_config.celery_app inspect active

# List scheduled tasks
celery -A app.celery_config.celery_app inspect scheduled

# Worker stats
celery -A app.celery_config.celery_app inspect stats
```

## Production Deployment

### Using Supervisor (Linux)

Create `/etc/supervisor/conf.d/celery.conf`:

```ini
[program:celery-worker]
command=celery -A app.celery_config.celery_app worker --loglevel=info
directory=/path/to/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/celery/worker.err.log
stdout_logfile=/var/log/celery/worker.out.log

[program:celery-beat]
command=celery -A app.celery_config.celery_app beat --loglevel=info
directory=/path/to/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/celery/beat.err.log
stdout_logfile=/var/log/celery/beat.out.log
```

### Using Docker Compose

Add to `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  celery-worker:
    build: ./backend
    command: celery -A app.celery_config.celery_app worker --loglevel=info
    depends_on:
      - redis
      - db
    env_file:
      - .env

  celery-beat:
    build: ./backend
    command: celery -A app.celery_config.celery_app beat --loglevel=info
    depends_on:
      - redis
      - db
    env_file:
      - .env

  flower:
    build: ./backend
    command: celery -A app.celery_config.celery_app flower
    ports:
      - "5555:5555"
    depends_on:
      - redis
    env_file:
      - .env
```

## Troubleshooting

### Tasks Not Running

1. Check Redis connection:
   ```bash
   redis-cli ping  # Should return PONG
   ```

2. Check worker is running:
   ```bash
   celery -A app.celery_config.celery_app inspect active
   ```

3. Check beat is running:
   ```bash
   ps aux | grep celery
   ```

### Tasks Failing

1. Check worker logs for exceptions
2. Use Flower to see failure details
3. Retry manually:
   ```python
   task.retry(countdown=60)
   ```

### Memory Issues

Restart workers periodically:
```python
# In celery_config.py
worker_max_tasks_per_child = 100  # Already configured
```

## Best Practices

1. **Idempotency**: All tasks should be safe to retry
2. **Timeouts**: Set appropriate `task_time_limit` for each task type
3. **Monitoring**: Always run Flower in production
4. **Logging**: Use structured logging for debugging
5. **Database**: Use connection pooling for async sessions
6. **Error Handling**: Let Celery retry, don't swallow exceptions

## API Integration

### FastAPI Endpoint Example

```python
from fastapi import APIRouter
from backend.app.agents.scheduler import run_agent_decision

router = APIRouter()

@router.post("/agents/{agent_id}/run")
async def trigger_agent_run(agent_id: str, tournament_id: str):
    task = run_agent_decision.delay(
        agent_uuid=agent_id,
        tournament_uuid=tournament_id,
        recover_from_crash=True
    )

    return {
        "task_id": task.id,
        "status": "queued"
    }

@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    task = AsyncResult(task_id)
    return {
        "task_id": task_id,
        "state": task.state,
        "result": task.result if task.ready() else None
    }
```
