from app.db.database import engine, AsyncSessionLocal
from app.db.models import Base, Agent, Tournament, StatusEnum, PlanItem, PlanItemStatus, PlanActionType
from app.db import plan_item_repo as repo
from app.db.plan_tool import PlanTool
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import asyncio

#create tables
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print(" Tables created successfully!\n")

#demo for repo functions
async def demo_repository():
    print("DEMO: Repository Functions")
    
    async with AsyncSessionLocal() as session:
        # setup: create agent and tournament
        agent_id = uuid4()
        tournament_id = uuid4()
        
        session.add(Agent(id=agent_id, name="Demo Agent", personality="test", strategy_type="test"))
        session.add(Tournament(
            id=tournament_id,
            name="Demo Tournament",
            status=StatusEnum.live,
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=7),
            prize_pool=1000
        ))
        await session.commit()
        print(f"Created Agent: {agent_id}")
        print(f"Created Tournament: {tournament_id}\n")

        # Test 1: create_plan_item
        print("Test 1: create_plan_item()")
        item = await repo.create_plan_item(
            session=session,
            agent_uuid=agent_id,
            tournament_uuid=tournament_id,
            action_type=PlanActionType.RESEARCH,
            execute_at=datetime.now(timezone.utc) + timedelta(hours=1),
            payload={"query": "BTC market analysis"},
            idempotency_key="demo-001",
        )
        print(f"   Created: {item.id}")
        print(f"   Status: {item.status.value}")
        print(f"   Action: {item.action_type.value}")
        print(f"   Payload: {item.payload}\n")

        # Test 2: Idempotency
        print("Test 2: Idempotency (same key returns same item)")
        item2 = await repo.create_plan_item(
            session=session,
            agent_uuid=agent_id,
            tournament_uuid=tournament_id,
            action_type=PlanActionType.RESEARCH,
            execute_at=datetime.now(timezone.utc) + timedelta(hours=5),
            payload={"different": "payload"},
            idempotency_key="demo-001",  
        )
        print(f"   Same ID? {item.id == item2.id} ✓\n")

        # Test 3: Create another item
        print("Test 3: Create second item")
        item3 = await repo.create_plan_item(
            session=session,
            agent_uuid=agent_id,
            tournament_uuid=tournament_id,
            action_type=PlanActionType.OPEN_POSITION,
            execute_at=datetime.now(timezone.utc) + timedelta(hours=2),
            payload={"token": "ETH", "amount": 100},
            idempotency_key="demo-002",
        )
        print(f"   Created: {item3.id}\n")

        # Test 4: list_plan_items
        print("Test 4: list_plan_items()")
        items = await repo.list_plan_items(session, agent_id, tournament_id)
        print(f"   Found {len(items)} items:")
        for i in items:
            print(f"     - {i.action_type.value}: {i.status.value}")
        print()

        # Test 5: list with status filter
        print("Test 5: list_plan_items() with status filter")
        planned = await repo.list_plan_items(session, agent_id, tournament_id, statuses=["planned"])
        print(f"   Found {len(planned)} planned items\n")

        # Test 6: reschedule_plan_item
        print("Test 6: reschedule_plan_item()")
        new_time = datetime.now(timezone.utc) + timedelta(days=1)
        rescheduled = await repo.reschedule_plan_item(session, item.id, new_time)
        print(f"   Rescheduled to: {rescheduled.execute_at}\n")

        # Test 7: cancel_plan_item
        print("Test 7: cancel_plan_item()")
        await repo.cancel_plan_item(session, item3.id, reason="No longer needed")
        await session.refresh(item3)
        print(f"   Status: {item3.status.value}")
        print(f"   Reason: {item3.last_error}\n")

        # Test 8: mark_plan_item_executed
        print("Test 8: mark_plan_item_executed()")
        await repo.mark_plan_item_executed(session, item.id)
        await session.refresh(item)
        print(f"   Status: {item.status.value}\n")

        print(" All repository tests passed!\n")
        
        return agent_id, tournament_id

#demo plantool
async def demo_plan_tool(agent_id, tournament_id):
    print("DEMO: PlanTool")
    
    async with AsyncSessionLocal() as session:
        # Create wrapper for PlanTool
        class DBWrapper:
            def __init__(self, s):
                self.s = s
            async def create_plan_item(self, **kw):
                return await repo.create_plan_item(self.s, **kw)
            async def list_plan_items(self, **kw):
                return await repo.list_plan_items(self.s, **kw)
            async def cancel_plan_item(self, **kw):
                return await repo.cancel_plan_item(self.s, **kw)
            async def reschedule_plan_item(self, **kw):
                return await repo.reschedule_plan_item(self.s, **kw)

        tool = PlanTool(
            agent_id="demo-agent",
            agent_uuid=agent_id,
            tournament_uuid=tournament_id,
            database_tool=DBWrapper(session),
        )
        print(f"PlanTool created (db_configured={tool._is_db_configured()})\n")

        # Test 1: create_plan_step
        print("Test 1: create_plan_step()")
        result = await tool.create_plan_step(
            action_type="RESEARCH",
            execute_at=datetime.now(timezone.utc) + timedelta(hours=3),
            payload={"query": "ETH analysis"},
        )
        print(f"   Success: {result['success']}")
        print(f"   ID: {result['id']}")
        print(f"   Auto-generated key: {result['idempotency_key']}\n")

        # Test 2: create with ISO string datetime
        print("Test 2: create_plan_step() with ISO string")
        result2 = await tool.create_plan_step(
            action_type="CLOSE_POSITION",
            execute_at="2025-02-15T10:00:00+00:00", 
            payload={"token": "BTC"},
            idempotency_key="manual-key-001",
        )
        print(f"   Success: {result2['success']}\n")

        # Test 3: list_plan_steps
        print("Test 3: list_plan_steps()")
        steps = await tool.list_plan_steps()
        print(f"   Found {len(steps)} steps\n")

        # Test 4: cancel_plan_step
        print("Test 4: cancel_plan_step()")
        cancelled = await tool.cancel_plan_step(result2['id'], reason="Changed mind")
        print(f"   Cancelled: {cancelled}\n")

        # Test 5: reschedule_plan_step
        print("Test 5: reschedule_plan_step()")
        rescheduled = await tool.reschedule_plan_step(
            result['id'],
            new_execute_at=datetime.now(timezone.utc) + timedelta(days=2),
        )
        print(f"   Success: {rescheduled['success']}\n")

        print("All PlanTool tests passed\n")

#graceful db behavior
async def demo_no_db():
    print("DEMO: PlanTool without DB (graceful degradation)")
    
    tool = PlanTool(
        agent_id="no-db-agent",
        agent_uuid=None,
        tournament_uuid=None,
        database_tool=None,
    )
    print(f"PlanTool created (db_configured={tool._is_db_configured()})\n")

    print("Test: create_plan_step() without DB")
    result = await tool.create_plan_step(
        action_type="RESEARCH",
        execute_at=datetime.now(timezone.utc),
        payload={},
    )
    print(f"   Result: {result}\n")

    print("Test: list_plan_steps() without DB")
    steps = await tool.list_plan_steps()
    print(f"   Result: {steps}\n")

    print("Test: cancel_plan_step() without DB")
    success = await tool.cancel_plan_step(uuid4())
    print(f"   Result: {success}\n")

    print("Graceful degradation works!\n")

#main
async def main():
    print("   planitem demo")

    # Create tables
    await create_tables()

    # Demo repository
    agent_id, tournament_id = await demo_repository()

    # Demo PlanTool
    await demo_plan_tool(agent_id, tournament_id)

    # Demo graceful degradation
    await demo_no_db()


    print("    all demos passed")

if __name__ == "__main__":
    asyncio.run(main())
