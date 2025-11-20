import pytest
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from backend.app.db.models import Trade, Agent, Tournament


@pytest.mark.anyio
async def test_list_all_trades(client, test_db):
    '''Test listing all trades, no tournament_id'''
    # Create agents and tournaments
    now = datetime.now(timezone.utc)
    agent1 = Agent(name="Agent1", personality="Test", strategy_type="momentum")
    agent2 = Agent(name="Agent2", personality="Test", strategy_type="value")
    tournament1 = Tournament(
        name="T1",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("10000"),
    )
    tournament2 = Tournament(
        name="T2",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("5000"),
    )

    test_db.add_all([agent1, agent2, tournament1, tournament2])
    await test_db.commit()
    await test_db.refresh(agent1)
    await test_db.refresh(agent2)
    await test_db.refresh(tournament1)
    await test_db.refresh(tournament2)

    # Create trades
    trade1 = Trade(
        agent_id=agent1.id,
        tournament_id=tournament1.id,
        action="buy",
        asset="BTC",
        amount=Decimal("0.5"),
        price=Decimal("50000.0"),
    )
    trade2 = Trade(
        agent_id=agent2.id,
        tournament_id=tournament2.id,
        action="sell",
        asset="ETH",
        amount=Decimal("10.0"),
        price=Decimal("3000.0"),
    )

    test_db.add_all([trade1, trade2])
    await test_db.commit()

    r = await client.get("/trades/")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 2


@pytest.mark.anyio
async def test_list_trades_for_specific_tournament(client, test_db):
    '''Test listing all trades for specific tournament_id'''
    now = datetime.now(timezone.utc)
    agent = Agent(name="TestAgent", personality="Test", strategy_type="momentum")
    tournament1 = Tournament(
        name="T1",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("10000"),
    )
    tournament2 = Tournament(
        name="T2",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("5000"),
    )

    test_db.add_all([agent, tournament1, tournament2])
    await test_db.commit()
    await test_db.refresh(agent)
    await test_db.refresh(tournament1)
    await test_db.refresh(tournament2)

    # Create trades for different tournaments
    trade1 = Trade(
        agent_id=agent.id,
        tournament_id=tournament1.id,
        action="buy",
        asset="BTC",
        amount=Decimal("1.0"),
        price=Decimal("50000.0"),
    )
    trade2 = Trade(
        agent_id=agent.id,
        tournament_id=tournament2.id,
        action="buy",
        asset="ETH",
        amount=Decimal("5.0"),
        price=Decimal("3000.0"),
    )

    test_db.add_all([trade1, trade2])
    await test_db.commit()

    r = await client.get(f"/trades/?tournament_id={tournament1.id}")
    assert r.status_code == 200, r.text
    data = r.json()
    assert len(data) == 1
    assert data[0]["tournament_id"] == str(tournament1.id)


@pytest.mark.anyio
async def test_list_trades_by_agent(client, test_db):
    '''Test listing trades based on agent_id'''
    now = datetime.now(timezone.utc)
    agent1 = Agent(name="Agent1", personality="Test", strategy_type="momentum")
    agent2 = Agent(name="Agent2", personality="Test", strategy_type="value")
    tournament = Tournament(
        name="T1",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("10000"),
    )

    test_db.add_all([agent1, agent2, tournament])
    await test_db.commit()
    await test_db.refresh(agent1)
    await test_db.refresh(agent2)
    await test_db.refresh(tournament)

    # Create trades for different agents
    trade1 = Trade(
        agent_id=agent1.id,
        tournament_id=tournament.id,
        action="buy",
        asset="BTC",
        amount=Decimal("1.0"),
        price=Decimal("50000.0"),
    )
    trade2 = Trade(
        agent_id=agent2.id,
        tournament_id=tournament.id,
        action="sell",
        asset="ETH",
        amount=Decimal("5.0"),
        price=Decimal("3000.0"),
    )

    test_db.add_all([trade1, trade2])
    await test_db.commit()

    r = await client.get(f"/trades/agent/{agent1.id}")
    assert r.status_code == 200, r.text
    data = r.json()
    assert len(data) == 1
    assert data[0]["agent_id"] == str(agent1.id)


@pytest.mark.anyio
async def test_create_trade(client, test_db):
    '''Test for creating a new trade'''
    now = datetime.now(timezone.utc)
    agent = Agent(name="TestAgent", personality="Test", strategy_type="momentum")
    tournament = Tournament(
        name="TestTournament",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("10000"),
    )

    test_db.add_all([agent, tournament])
    await test_db.commit()
    await test_db.refresh(agent)
    await test_db.refresh(tournament)

    trade_data = {
        "agent_id": str(agent.id),
        "tournament_id": str(tournament.id),
        "action": "sell",
        "asset": "ETH",
        "amount": 1000.0,
        "price": 3000.0,
    }
    r = await client.post("/trades/", json=trade_data)
    assert r.status_code == 201, r.text
    created = r.json()
    assert "id" in created
    assert created["agent_id"] == str(agent.id)
    assert created["action"] == "sell"