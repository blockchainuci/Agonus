"""
Unit tests for PlanTool - scheduled plan management.

Run: pytest backend/tests/test_plan_tool.py -v
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from backend.app.agents.tools.plan_tool import PlanTool
from backend.app.db.models import PlanItem, PlanStatusEnum, PlanActionEnum


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
def mock_plan_item():
    """Create a mock PlanItem that looks like a real DB record."""
    item = MagicMock(spec=PlanItem)
    item.id = uuid4()
    item.agent_id = uuid4()
    item.tournament_id = uuid4()
    item.execute_at = datetime.now(timezone.utc) + timedelta(hours=1)
    item.status = PlanStatusEnum.planned
    item.action_type = PlanActionEnum.OPEN_POSITION
    item.payload = {"token": "ETH", "amount": 100}
    item.created_at = datetime.now(timezone.utc)
    item.updated_at = datetime.now(timezone.utc)
    return item


@pytest.fixture
def mock_database_tool(mock_plan_item):
    """Create a mock DatabaseTool with plan methods."""
    db = AsyncMock()
    db.create_plan_item = AsyncMock(return_value=mock_plan_item)
    db.list_plan_items = AsyncMock(return_value=[mock_plan_item])
    db.cancel_plan_item = AsyncMock()
    db.reschedule_plan_item = AsyncMock(return_value=mock_plan_item)
    return db


@pytest.fixture
def plan_tool(mock_database_tool):
    """PlanTool with mocked DB — fully configured."""
    return PlanTool(
        agent_id="test_agent",
        agent_uuid=uuid4(),
        tournament_uuid=uuid4(),
        database_tool=mock_database_tool,
    )


@pytest.fixture
def plan_tool_no_db():
    """PlanTool without DB — tests graceful degradation."""
    return PlanTool(
        agent_id="test_agent",
        agent_uuid=None,
        tournament_uuid=None,
        database_tool=None,
    )


# ============================================================================
# TEST: GRACEFUL DEGRADATION (no DB configured)
# ============================================================================


class TestGracefulDegradation:
    @pytest.mark.anyio
    async def test_create_returns_error_without_db(self, plan_tool_no_db):
        result = await plan_tool_no_db.create_plan_step(
            "OPEN_POSITION", datetime.now(timezone.utc), {}
        )
        assert result == {"error": "db_not_configured"}

    @pytest.mark.anyio
    async def test_list_returns_empty_without_db(self, plan_tool_no_db):
        result = await plan_tool_no_db.list_plan_steps()
        assert result == []

    @pytest.mark.anyio
    async def test_cancel_returns_false_without_db(self, plan_tool_no_db):
        result = await plan_tool_no_db.cancel_plan_step(uuid4())
        assert result is False

    @pytest.mark.anyio
    async def test_reschedule_returns_error_without_db(self, plan_tool_no_db):
        result = await plan_tool_no_db.reschedule_plan_step(
            uuid4(), datetime.now(timezone.utc)
        )
        assert result == {"error": "db_not_configured"}


# ============================================================================
# TEST: CREATE PLAN STEP
# ============================================================================


class TestCreatePlanStep:
    @pytest.mark.anyio
    async def test_create_basic(self, plan_tool, mock_database_tool):
        result = await plan_tool.create_plan_step(
            action_type="OPEN_POSITION",
            execute_at=datetime.now(timezone.utc) + timedelta(hours=1),
            payload={"token": "ETH", "amount": 100},
        )
        assert "id" in result
        assert result["action_type"] == "OPEN_POSITION"
        assert result["status"] == "planned"
        mock_database_tool.create_plan_item.assert_called_once()

    @pytest.mark.anyio
    async def test_create_with_iso_string(self, plan_tool, mock_database_tool):
        result = await plan_tool.create_plan_step(
            action_type="RESEARCH",
            execute_at="2025-06-15T15:00:00Z",
            payload={"topic": "ETH momentum"},
        )
        assert "id" in result
        mock_database_tool.create_plan_item.assert_called_once()

    @pytest.mark.anyio
    async def test_create_invalid_execute_at(self, plan_tool):
        result = await plan_tool.create_plan_step(
            action_type="RESEARCH",
            execute_at="not-a-date",
            payload={},
        )
        assert result == {"error": "invalid_execute_at"}

    @pytest.mark.anyio
    async def test_create_invalid_action_type(self, plan_tool):
        result = await plan_tool.create_plan_step(
            action_type="INVALID_TYPE",
            execute_at=datetime.now(timezone.utc),
            payload={},
        )
        assert "error" in result
        assert "invalid_action_type" in result["error"]

    @pytest.mark.anyio
    async def test_idempotency_key_auto_generated(self, plan_tool, mock_database_tool):
        await plan_tool.create_plan_step(
            action_type="OPEN_POSITION",
            execute_at=datetime.now(timezone.utc),
            payload={"token": "ETH"},
        )
        call_kwargs = mock_database_tool.create_plan_item.call_args.kwargs
        assert call_kwargs["idempotency_key"] is not None
        assert len(call_kwargs["idempotency_key"]) == 64  # SHA256 hex digest

    @pytest.mark.anyio
    async def test_explicit_idempotency_key(self, plan_tool, mock_database_tool):
        await plan_tool.create_plan_step(
            action_type="OPEN_POSITION",
            execute_at=datetime.now(timezone.utc),
            payload={"token": "ETH"},
            idempotency_key="my-custom-key",
        )
        call_kwargs = mock_database_tool.create_plan_item.call_args.kwargs
        assert call_kwargs["idempotency_key"] == "my-custom-key"


# ============================================================================
# TEST: LIST PLAN STEPS
# ============================================================================


class TestListPlanSteps:
    @pytest.mark.anyio
    async def test_list_returns_dicts(self, plan_tool):
        result = await plan_tool.list_plan_steps()
        assert isinstance(result, list)
        assert len(result) == 1
        assert "id" in result[0]
        assert "status" in result[0]
        assert "action_type" in result[0]

    @pytest.mark.anyio
    async def test_list_with_status_filter(self, plan_tool, mock_database_tool):
        await plan_tool.list_plan_steps(statuses=["planned", "executed"])
        call_kwargs = mock_database_tool.list_plan_items.call_args.kwargs
        assert call_kwargs["statuses"] == ["planned", "executed"]

    @pytest.mark.anyio
    async def test_list_with_limit(self, plan_tool, mock_database_tool):
        await plan_tool.list_plan_steps(limit=5)
        call_kwargs = mock_database_tool.list_plan_items.call_args.kwargs
        assert call_kwargs["limit"] == 5

    @pytest.mark.anyio
    async def test_list_empty(self, plan_tool, mock_database_tool):
        mock_database_tool.list_plan_items.return_value = []
        result = await plan_tool.list_plan_steps()
        assert result == []


# ============================================================================
# TEST: CANCEL PLAN STEP
# ============================================================================


class TestCancelPlanStep:
    @pytest.mark.anyio
    async def test_cancel_success(self, plan_tool, mock_database_tool):
        item_id = uuid4()
        result = await plan_tool.cancel_plan_step(item_id, reason="Changed strategy")
        assert result is True
        mock_database_tool.cancel_plan_item.assert_called_once_with(
            plan_item_id=item_id, reason="Changed strategy"
        )

    @pytest.mark.anyio
    async def test_cancel_without_reason(self, plan_tool, mock_database_tool):
        item_id = uuid4()
        result = await plan_tool.cancel_plan_step(item_id)
        assert result is True
        mock_database_tool.cancel_plan_item.assert_called_once_with(
            plan_item_id=item_id, reason=None
        )


# ============================================================================
# TEST: RESCHEDULE PLAN STEP
# ============================================================================


class TestReschedulePlanStep:
    @pytest.mark.anyio
    async def test_reschedule_with_datetime(self, plan_tool, mock_database_tool):
        item_id = uuid4()
        new_time = datetime.now(timezone.utc) + timedelta(hours=2)
        result = await plan_tool.reschedule_plan_step(item_id, new_time)
        assert "id" in result
        mock_database_tool.reschedule_plan_item.assert_called_once()

    @pytest.mark.anyio
    async def test_reschedule_with_iso_string(self, plan_tool, mock_database_tool):
        item_id = uuid4()
        result = await plan_tool.reschedule_plan_step(
            item_id, "2025-07-01T12:00:00Z"
        )
        assert "id" in result

    @pytest.mark.anyio
    async def test_reschedule_invalid_datetime(self, plan_tool):
        result = await plan_tool.reschedule_plan_step(uuid4(), "not-a-date")
        assert result == {"error": "invalid_execute_at"}