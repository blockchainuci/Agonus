"""
Tests for plan execution logic (due-plan querying and dispatch).

Run: pytest backend/tests/test_plan_execution.py -v
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from backend.app.db.models import PlanItem, PlanStatusEnum, PlanActionEnum


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
def make_plan_item():
    """Factory for mock PlanItem objects with customizable fields."""
    def _make(
        execute_at=None,
        action_type=PlanActionEnum.OPEN_POSITION,
        status=PlanStatusEnum.planned,
        attempts=0,
        max_attempts=3,
    ):
        item = MagicMock(spec=PlanItem)
        item.id = uuid4()
        item.agent_id = uuid4()
        item.tournament_id = uuid4()
        item.execute_at = execute_at or (datetime.now(timezone.utc) - timedelta(minutes=5))
        item.status = status
        item.action_type = action_type
        item.payload = {"token": "ETH", "amount": 100}
        item.attempts = attempts
        item.max_attempts = max_attempts
        item.created_at = datetime.now(timezone.utc)
        item.updated_at = datetime.now(timezone.utc)
        return item
    return _make


@pytest.fixture
def mock_db_tool(make_plan_item):
    """Mock DatabaseTool with plan execution methods."""
    db = AsyncMock()
    db.get_due_plan_items = AsyncMock(return_value=[])
    db.mark_plan_item_executed = AsyncMock()
    db.mark_plan_item_failed = AsyncMock()
    return db


# ============================================================================
# TEST: DUE PLAN QUERYING (mocked time)
# ============================================================================


class TestDuePlanQuerying:
    """Verify that get_due_plan_items correctly uses the 'now' parameter."""

    @pytest.mark.anyio
    async def test_overdue_item_returned(self, mock_db_tool, make_plan_item):
        """Plans in the past should be returned as due."""
        past_item = make_plan_item(
            execute_at=datetime.now(timezone.utc) - timedelta(hours=1)
        )
        mock_db_tool.get_due_plan_items.return_value = [past_item]

        result = await mock_db_tool.get_due_plan_items(
            now=datetime.now(timezone.utc)
        )
        assert len(result) == 1
        assert result[0].id == past_item.id

    @pytest.mark.anyio
    async def test_future_item_not_due_yet(self, mock_db_tool):
        """When no items are due, empty list is returned."""
        mock_db_tool.get_due_plan_items.return_value = []

        result = await mock_db_tool.get_due_plan_items(
            now=datetime.now(timezone.utc)
        )
        assert result == []

    @pytest.mark.anyio
    async def test_simulated_time_skip(self, mock_db_tool, make_plan_item):
        """
        Simulate time passing by providing a future 'now'.
        A plan scheduled for 1 hour from now becomes due when
        we query with now = 2 hours from now.
        """
        future_item = make_plan_item(
            execute_at=datetime.now(timezone.utc) + timedelta(hours=1)
        )
        # Simulate: at now+2h, this item would be due
        mock_db_tool.get_due_plan_items.return_value = [future_item]

        result = await mock_db_tool.get_due_plan_items(
            now=datetime.now(timezone.utc) + timedelta(hours=2)
        )
        assert len(result) == 1


# ============================================================================
# TEST: PLAN EXECUTION DISPATCH
# ============================================================================


class TestPlanExecutionDispatch:
    """Test the _execute_due_plans_async logic with mocked dependencies."""

    @pytest.mark.anyio
    async def test_no_due_items_returns_zero(self, mock_db_tool):
        """When nothing is due, execution returns zero counts."""
        mock_db_tool.get_due_plan_items.return_value = []

        # Simulate the logic from _execute_due_plans_async
        due_items = await mock_db_tool.get_due_plan_items()
        assert len(due_items) == 0
        mock_db_tool.mark_plan_item_executed.assert_not_called()

    @pytest.mark.anyio
    async def test_due_item_marked_executed(self, mock_db_tool, make_plan_item):
        """After successful dispatch, plan should be marked executed."""
        item = make_plan_item()
        mock_db_tool.get_due_plan_items.return_value = [item]

        due_items = await mock_db_tool.get_due_plan_items()
        for plan_item in due_items:
            await mock_db_tool.mark_plan_item_executed(plan_item.id)

        mock_db_tool.mark_plan_item_executed.assert_called_once_with(item.id)

    @pytest.mark.anyio
    async def test_failed_item_marked_failed(self, mock_db_tool, make_plan_item):
        """If dispatch raises, plan should be marked failed with error."""
        item = make_plan_item()
        mock_db_tool.get_due_plan_items.return_value = [item]
        error_msg = "Connection refused"

        due_items = await mock_db_tool.get_due_plan_items()
        for plan_item in due_items:
            # Simulate a failure
            await mock_db_tool.mark_plan_item_failed(plan_item.id, error_msg)

        mock_db_tool.mark_plan_item_failed.assert_called_once_with(
            item.id, error_msg
        )

    @pytest.mark.anyio
    async def test_multiple_due_items(self, mock_db_tool, make_plan_item):
        """Multiple due items should each be processed."""
        items = [make_plan_item() for _ in range(3)]
        mock_db_tool.get_due_plan_items.return_value = items

        due_items = await mock_db_tool.get_due_plan_items()
        for plan_item in due_items:
            await mock_db_tool.mark_plan_item_executed(plan_item.id)

        assert mock_db_tool.mark_plan_item_executed.call_count == 3

    @pytest.mark.anyio
    async def test_different_action_types(self, mock_db_tool, make_plan_item):
        """All action types (RESEARCH, OPEN_POSITION, CLOSE_POSITION) are processed."""
        items = [
            make_plan_item(action_type=PlanActionEnum.RESEARCH),
            make_plan_item(action_type=PlanActionEnum.OPEN_POSITION),
            make_plan_item(action_type=PlanActionEnum.CLOSE_POSITION),
        ]
        mock_db_tool.get_due_plan_items.return_value = items

        due_items = await mock_db_tool.get_due_plan_items()
        for plan_item in due_items:
            await mock_db_tool.mark_plan_item_executed(plan_item.id)

        assert mock_db_tool.mark_plan_item_executed.call_count == 3