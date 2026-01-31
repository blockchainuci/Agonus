''' Database helper functions for PlanItem'''
import logging
from datetime import datetime, timezone
from sqlalchemy import select, and_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Any, Optional
from app.db.models import PlanItem, PlanItemStatus, PlanActionType
logger = logging.getLogger(__name__)

async def create_plan_item(
    session: AsyncSession,
    agent_uuid: UUID,
    tournament_uuid: UUID, 
    action_type: PlanActionType | str, 
    execute_at: datetime,
    payload: dict[str, Any],
    idempotency_key: str,
    max_attempts: int = 3, 
) -> PlanItem:
    logger.debug(
        agent_uuid, tournament_uuid, action_type, idempotency_key
    )
    
    if isinstance(action_type, str):
        action_type = PlanActionType(action_type)

    try: 
        stmt = insert(PlanItem).values(
            agent_id=agent_uuid,
            tournament_id=tournament_uuid,
            action_type=action_type,
            execute_at=execute_at,
            payload=payload,
            idempotency_key=idempotency_key,
            max_attempts=max_attempts,
            status=PlanItemStatus.planned,
            attempts=0,
        ).on_conflict_do_nothing(
            index_elements=["agent_id", "tournament_id", "idempotency_key"]
        ).returning(PlanItem)
        
        result = await session.execute(stmt)
        plan_item = result.scalar_one_or_none()

        if plan_item is None:
            stmt = select(PlanItem).where(
                and_(
                    PlanItem.agent_id == agent_uuid,
                    PlanItem.tournament_id == tournament_uuid,
                    PlanItem.idempotency_key == idempotency_key,
                )
            )
            result = await session.execute(stmt)
            plan_item = result.scalar_one()
            logger.debug('Returning existing plan items: %s', plan_item.id)
        
        else: 
            await session.commit()
            logger.info('Created plan item: %s', plan_item.id)
        return plan_item

    except Exception as e: 
        await session.rollback()
        logger.error('Failed to create plan item: %s', e)
        raise

async  def list_plan_items(
    session: AsyncSession,
    agent_uuid: UUID,
    tournament_uuid: UUID,
    statuses: Optional[list[str]] = None,
    limit: Optional[int] = None,
) -> list[PlanItem]:
    logger.debug(
        "Listing plan items: agent=%s, tournament=%s, statuses=%s",
        agent_uuid, tournament_uuid, statuses
    )
    
    stmt = select(PlanItem).where(
        and_(
            PlanItem.agent_id == agent_uuid,
            PlanItem.tournament_id == tournament_uuid,
        )
    )
    
    if statuses:
        status_enums = [PlanItemStatus(s) for s in statuses if s in PlanItemStatus.__members__]
        if status_enums:
            stmt = stmt.where(PlanItem.status.in_(status_enums))
    
    stmt = stmt.order_by(PlanItem.execute_at.asc(), PlanItem.created_at.asc())
    
    if limit:
        stmt = stmt.limit(limit)
    
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def cancel_plan_item(
    session: AsyncSession,
    plan_item_id: UUID,
    reason: Optional[str] = None,
) -> None:
    logger.debug("Cancelling plan item: %s", plan_item_id)
    
    stmt = select(PlanItem).where(PlanItem.id == plan_item_id)
    result = await session.execute(stmt)
    plan_item = result.scalar_one_or_none()
    
    if plan_item is None:
        raise ValueError(f"Plan item not found: {plan_item_id}")
    
    plan_item.status = PlanItemStatus.cancelled
    plan_item.updated_at = datetime.now(timezone.utc)
    if reason:
        plan_item.last_error = reason
    
    await session.commit()
    logger.info("Cancelled plan item: %s", plan_item_id)

async def reschedule_plan_item(
    session: AsyncSession,
    plan_item_id: UUID,
    new_execute_at: datetime
) -> PlanItem: 
    logger.debug('Rescheduling plan item %s to %s', plan_item_id, new_execute_at)

    stmt = select(PlanItem).where(PlanItem.id == plan_item_id)
    result = await session.execute(stmt)
    plan_item = result.scalar_one_or_none()

    if plan_item is None:
        raise ValueError(f'Plan item not found: {plan_item_id}')

    if plan_item.status not in (PlanItemStatus.planned, PlanItemStatus.skipped):
        raise ValueError(f'Cannot reschedule item with stats {plan_item.status.value}')

    plan_item.execute_at = new_execute_at
    plan_item.updated_at = datetime.now(timezone.utc)

    await session.commit()
    logger.info('Rescheduled plan items: %s', plan_item_id)
    return plan_item

async def mark_plan_item_executed(session: AsyncSession, plan_item_id: UUID) -> None: 
    stmt = select(PlanItem).where(PlanItem.id == plan_item_id)
    result = await session.execute(stmt)
    plan_item = result.scalar_one_or_none()

    if plan_item is None: 
        raise ValueError(f'Planned item not found: {plan_item_id}')

    plan_item.status = PlanItemStatus.executed
    plan_item.updated_at = datetime.now(timezone.utc)
    await session.commit()

async def mark_plan_item_failed(
    session: AsyncSession,
    plan_item_id: UUID,
    last_error: str
) -> None: 
    stmt = select(PlanItem).where(PlanItem.id == plan_item_id)
    result = await session.execute(stmt)
    plan_item = result.scalar_one_or_none()

    if plan_item is None: 
        raise ValueError(f'Plan item not found: {plan_item_id}')

    plan_item.status = PlanItemStatus.failed
    plan_item.attempts += 1
    plan_item.last_error = last_error
    plan_item.updated_at = datetime.now(timezone.utc)
    await session.commit()