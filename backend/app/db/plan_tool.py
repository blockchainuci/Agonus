import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional, Protocol
from uuid import UUID

logger = logging.getLogger(__name__)

class DatabaseToolProtocol(Protocol):
    async def create_plan_item(self, **kwargs) -> Any: ...
    async def list_plan_items(self, **kwargs) -> list: ...
    async def cancel_plan_item(self, **kwargs) -> None: ...
    async def reschedule_plan_item(self, **kwargs) -> Any: ...

class PlanTool: 
    def __init__(
        self,
        agent_id: str,
        agent_uuid: Optional[UUID] = None, 
        tournament_uuid: Optional[UUID] = None,
        database_tool: Optional[DatabaseToolProtocol] = None,
    ):

        self.agent_id = agent_id
        self.agent_uuid = agent_uuid
        self.tournament_uuid = tournament_uuid
        self.database_tool = database_tool
        
        logger.info(
            'PlanTool initialized: agent_id=%s, db_configured=%s',
            agent_id, self._is_db_configured()
        )

    def _is_db_configured(self) -> bool: 
        return all([self.agent_uuid, self.tournament_uuid, self.database_tool])

    def _generate_idempotency_key(
        self, 
        action_type: str,
        execute_at: datetime,
        payload: dict[str, Any]
    ) -> str: 
        key_data = {
            "agent_uuid": str(self.agent_uuid),
            "tournament_uuid": str(self.tournament_uuid),
            "action_type": action_type,
            "execute_at": execute_at.isoformat(),
            "payload": payload,
        }
        canonical = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.sha256(canonical.encode()).hexdigest()[:32]

    
    def _normalize_datetime(self, dt: datetime | str) -> datetime:
        if isinstance(dt, datetime):
            return dt
        if isinstance(dt, str):
            return datetime.fromisoformat(dt.replace("Z", "+00:00"))
        raise ValueError(f"Expected datetime or str, got {type(dt)}")
    
    def _to_dict(self, item: Any) -> dict[str, Any]:
        if hasattr(item, "to_dict"):
            return item.to_dict()
        return {
            "id": str(item.id),
            "agent_id": str(item.agent_id),
            "tournament_id": str(item.tournament_id),
            "execute_at": item.execute_at.isoformat() if item.execute_at else None,
            "status": item.status.value if hasattr(item.status, "value") else str(item.status),
            "action_type": item.action_type.value if hasattr(item.action_type, "value") else str(item.action_type),
            "payload": item.payload,
            "attempts": item.attempts,
            "max_attempts": item.max_attempts,
            "last_error": item.last_error,
            "idempotency_key": item.idempotency_key,
        }
    
    async def create_plan_step(
        self,
        action_type: str,
        execute_at: datetime | str,
        payload: dict[str, Any],
        idempotency_key: Optional[str] = None,
        max_attempts: int = 3,
    ) -> dict[str, Any]:
        if not self._is_db_configured():
            logger.warning("DB not configured, cannot create plan step")
            return {"error": "Database not configured", "success": False}
        
        try:
            execute_at_dt = self._normalize_datetime(execute_at)
            
            if idempotency_key is None:
                idempotency_key = self._generate_idempotency_key(
                    action_type, execute_at_dt, payload
                )
            
            item = await self.database_tool.create_plan_item(
                agent_uuid=self.agent_uuid,
                tournament_uuid=self.tournament_uuid,
                action_type=action_type,
                execute_at=execute_at_dt,
                payload=payload,
                idempotency_key=idempotency_key,
                max_attempts=max_attempts,
            )

            result = self._to_dict(item)
            result['success'] = True
            return result

        except Exception as e:
            logger.error('Failed to create plan ste: %s', e)
            return {"error": str(e), "success": False}

    async def list_plan_steps(
      self,
        statuses: Optional[list[str]] = None,
        limit: Optional[int] = None,  
    ) -> list[dict[str, Any]]:
        if not self._is_db_configured(): 
            logger.warning('DB not configured, reutrning empty list')
            return []

        try: 
            items = await self.database_tool.list_plan_items(
                agent_uuid=self.agent_uuid,
                tournament_uuid=self.tournament_uuid,
                statuses=statuses,
                limit=limit,
            )

            return [self._to_dict(item) for item in items]

        except Exception as e: 
            logger.error('Failed to list plan steps: %s', e)
            return []

    
    async def cancel_plan_step(
        self, 
        plan_item_id: UUID | str,
        reason: Optional[str] = None,
    ) -> bool: 
        if not self._is_db_configured():
            return False
        try: 
            if isinstance(plan_item_id, str):
                plan_item_id = UUID(plan_item_id)

            await self.database_tool.cancel_plan_item(
                plan_item_id=plan_item_id,
                reason=reason
            )
            return True
        except Exception as e: 
            logger.error('Failed to cancel plan step: %s', e)
            return False

    async def reschedule_plan_step(
        self, 
        plan_item_id: UUID | str, 
        new_execute_at: datetime |str,
    ) -> dict[str, Any]:
        if not self._is_db_configured():
            return {'error': 'Database not configured', 'success': False}
        
        try: 
            if isinstance(plan_item_id, str):
                plan_item_id = UUID(plan_item_id)

            new_execute_at_dt = self._normalize_datetime(new_execute_at)
            
            item = await self.database_tool.reschedule_plan_item(
                plan_item_id=plan_item_id,
                new_execute_at=new_execute_at_dt,
            )
            
            result = self._to_dict(item)
            result["success"] = True
            return result
        except Exception as e:
            logger.error("Failed to reschedule plan step: %s", e)
            return {"error": str(e), "success": False}