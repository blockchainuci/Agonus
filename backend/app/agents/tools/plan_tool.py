import logging
from typing import Optional
from uuid import UUID
import datetime
from dateutil.parser import isoparse
from database_tool import create_plan_item
from ...db.models import PlanItem

logger = logging.getLogger(__name__)

class PlanTool:
    def __init__(
        self,
        agent_id: str,
        agent_uuid: Optional[UUID],
        tournament_uuid: Optional[UUID],
        database_tool: Optional["DatabaseTool"],
    ):
        self.agent_id = agent_id
        self.agent_uuid = agent_uuid
        self.tournament_uuid = tournament_uuid
        self.database_tool = database_tool

        self.db_configured = (
            self.agent_uuid is not None
            and self.tournament_uuid is not None
            and self.database_tool is not None
        )

        if self.db_configured:
            logger.info(
                "PlanTool initialized",
                extra={
                    "agent_id": self.agent_id,
                    "agent_uuid": str(self.agent_uuid),
                    "tournament_uuid": str(self.tournament_uuid),
                },
            )
        else:
            logger.warning(
                "PlanTool initialized without DB configuration; "
                "plan operations will no-op",
                extra={
                    "agent_id": self.agent_id,
                    "agent_uuid": str(self.agent_uuid) if self.agent_uuid else None,
                    "tournament_uuid": str(self.tournament_uuid) if self.tournament_uuid else None,
                    "has_database_tool": self.database_tool is not None,
                },
            )
    def _plan_item_to_dict(plan_item: PlanItem) -> dict:
        return {
            "id": str(plan_item.id),
            "agent_id": plan_item.agent_id,
            "tournament_id": plan_item.tournament_id,
            "execute_at": plan_item.execute_at.isoformat(),
            "status": plan_item.status.value
            if hasattr(plan_item.status, "value")
            else str(plan_item.status),
            "action_type": plan_item.action_type.value
            if hasattr(plan_item.action_type, "value")
            else str(plan_item.action_type),
            "payload": plan_item.payload,
        }

    async def create_plan_step(self, action_type: str, execute_at: datetime, payload, idempotency_key: str = None):

        if not self.db_configured:
            logger.warning(
                "create_plan_step called without DB configuration",
                extra={"agent_id": self.agent_id},
            )
            return {"error": "db_not_configured"}
        if idempotency_key is None:
            canonical = json.dumps(
                {
                    "agent_uuid": str(self.agent_uuid),
                    "tournament_uuid": str(self.tournament_uuid),
                    "action_type": action_type,
                    "execute_at": execute_at_dt.isoformat(),
                    "payload": payload,
                },
                sort_keys=True,
                separators=(",", ":"),
            )
            idempotency_key = sha256(canonical.encode("utf-8")).hexdigest()

        # 4️⃣ Create (or fetch) plan item via DB helper
        plan_item = await self.database_tool.create_plan_item(
            agent_uuid=self.agent_uuid,
            tournament_uuid=self.tournament_uuid,
            action_type=action_type,
            execute_at=execute_at,
            payload=payload,
            idempotency_key=idempotency_key,
        )

        # 5️⃣ Return JSON-serializable dict
        return self._plan_item_to_dict(plan_item)
    
    async def list_plan_steps(
        self,
        statuses: list[str] | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:

        if not self.db_configured:
            logger.warning(
                "list_plan_steps called without DB configuration",
                extra={"agent_id": self.agent_id},
            )
            return []

        plan_items = await self.database_tool.list_plan_items(
            agent_uuid=self.agent_uuid,
            tournament_uuid=self.tournament_uuid,
            statuses=statuses,
            limit=limit,
        )

        return [self.plan_item_to_dict(item) for item in plan_items]
    
    async def cancel_plan_step(
        self,
        plan_item_id: UUID,
        reason: str | None = None,
    ) -> bool:

        if not self.db_configured:
            logger.warning(
                "cancel_plan_step called without DB configuration",
                extra={"agent_id": self.agent_id},
            )
            return False

        await self.database_tool.cancel_plan_item(
            plan_item_id=plan_item_id,
            reason=reason,
        )

        return True
    
    async def reschedule_plan_step(
        self,
        plan_item_id: UUID,
        new_execute_at: datetime.datetime | str,
    ) -> dict[str, Any]:

        if not self.db_configured:
            logger.warning(
                "reschedule_plan_step called without DB configuration",
                extra={"agent_id": self.agent_id},
            )
            return {"error": "db_not_configured"}

        # Normalize datetime
        if isinstance(new_execute_at, str):
            try:
                execute_at_dt = isoparse(new_execute_at)
            except Exception:
                logger.exception("Invalid new_execute_at format")
                return {"error": "invalid_execute_at"}
        else:
            execute_at_dt = new_execute_at

        plan_item = await self.database_tool.reschedule_plan_item(
            plan_item_id=plan_item_id,
            new_execute_at=execute_at_dt,
        )

        return self.plan_item_to_dict(plan_item)