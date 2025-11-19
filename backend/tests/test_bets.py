import pytest
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from uuid import uuid4
from backend.app.db.models import Bet, Agent, Tournament


@pytest.mark.anyio
async def test_list_bets_empty(client):
    '''Test for listing empty bets list'''
    r = await client.get("/bets/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.anyio
async def test_list_bets_with_data(client, test_db):
    '''Test for listing bets'''
    now = datetime.now(timezone.utc)

    # Create agents and tournament
    agent1 = Agent(name="AlphaBot", personality="Aggressive", strategy_type="momentum")
    agent2 = Agent(name="BetaBot", personality="Conservative", strategy_type="value")
    tournament = Tournament(
        name="Test Tournament",
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

    # Create bets
    bet1 = Bet(
        user_address="0x" + "1" * 40,
        agent_id=agent1.id,
        tournament_id=tournament.id,
        amount=Decimal("100.0"),
        odds=Decimal("2.5"),
    )
    bet2 = Bet(
        user_address="0x" + "2" * 40,
        agent_id=agent2.id,
        tournament_id=tournament.id,
        amount=Decimal("200.0"),
        odds=Decimal("1.8"),
    )

    test_db.add_all([bet1, bet2])
    await test_db.commit()

    r = await client.get("/bets/")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 2


@pytest.mark.anyio
async def test_get_bet(client, test_db):
    '''Test for getting bet based on the bet_id'''
    now = datetime.now(timezone.utc)

    agent = Agent(name="GammaBot", personality="Balanced", strategy_type="hybrid")
    tournament = Tournament(
        name="Test Tournament",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("10000"),
    )

    test_db.add_all([agent, tournament])
    await test_db.commit()
    await test_db.refresh(agent)
    await test_db.refresh(tournament)

    bet = Bet(
        user_address="0x" + "3" * 40,
        agent_id=agent.id,
        tournament_id=tournament.id,
        amount=Decimal("150.0"),
        odds=Decimal("3.0"),
    )

    test_db.add(bet)
    await test_db.commit()
    await test_db.refresh(bet)

    r = await client.get(f"/bets/{bet.id}")
    assert r.status_code == 200
    assert r.json()["amount"] == "150.00"


@pytest.mark.anyio
async def test_get_bet_not_found(client):
    '''Test for getting non-existent bet'''
    fake_id = uuid4()
    r = await client.get(f"/bets/{fake_id}")
    assert r.status_code == 404


@pytest.mark.anyio
async def test_create_bet(client, test_db, mock_admin):
    '''Test for creating a bet'''
    now = datetime.now(timezone.utc)

    agent = Agent(name="DeltaBot", personality="Smart", strategy_type="ml")
    tournament = Tournament(
        name="Test Tournament",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("10000"),
    )

    test_db.add_all([agent, tournament])
    await test_db.commit()
    await test_db.refresh(agent)
    await test_db.refresh(tournament)

    body = {
        "user_address": mock_admin["address"],  # This will be overridden by auth
        "agent_id": str(agent.id),
        "tournament_id": str(tournament.id),
        "amount": 250.0,
        "odds": 2.0,
    }
    r = await client.post("/bets/", json=body)
    assert r.status_code == 201, r.text
    created = r.json()
    assert created["amount"] == "250.00"
    assert "id" in created


@pytest.mark.anyio
async def test_update_bet(client, test_db):
    '''Test for updating a bet based on bet_id'''
    now = datetime.now(timezone.utc)

    agent = Agent(name="UpdateBot", personality="Test", strategy_type="test")
    tournament = Tournament(
        name="Test Tournament",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("10000"),
    )

    test_db.add_all([agent, tournament])
    await test_db.commit()
    await test_db.refresh(agent)
    await test_db.refresh(tournament)

    bet = Bet(
        user_address="0x" + "4" * 40,
        agent_id=agent.id,
        tournament_id=tournament.id,
        amount=Decimal("100.0"),
        odds=Decimal("2.0"),
        settled=False,
    )

    test_db.add(bet)
    await test_db.commit()
    await test_db.refresh(bet)

    r = await client.put(f"/bets/{bet.id}", json={"settled": True, "payout": 200.0})
    assert r.status_code == 200, r.text
    assert r.json()["settled"] is True
    assert r.json()["payout"] == "200.00"


@pytest.mark.anyio
async def test_settle_bet(client, test_db):
    '''Test for settling a bet'''
    now = datetime.now(timezone.utc)

    agent = Agent(name="SettleBot", personality="Test", strategy_type="test")
    tournament = Tournament(
        name="Test Tournament",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("10000"),
    )

    test_db.add_all([agent, tournament])
    await test_db.commit()
    await test_db.refresh(agent)
    await test_db.refresh(tournament)

    bet = Bet(
        user_address="0x" + "5" * 40,
        agent_id=agent.id,
        tournament_id=tournament.id,
        amount=Decimal("100.0"),
        odds=Decimal("2.5"),
        settled=False,
    )

    test_db.add(bet)
    await test_db.commit()
    await test_db.refresh(bet)

    r = await client.patch(f"/bets/{bet.id}/settle?payout=250.0")
    assert r.status_code == 200, r.text
    assert r.json()["settled"] is True
    assert r.json()["payout"] == "250.00"


@pytest.mark.anyio
async def test_delete_bet(client, test_db):
    '''Test for deleting a bet based on bet_id'''
    now = datetime.now(timezone.utc)

    agent = Agent(name="DeleteBot", personality="Test", strategy_type="test")
    tournament = Tournament(
        name="Test Tournament",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("10000"),
    )

    test_db.add_all([agent, tournament])
    await test_db.commit()
    await test_db.refresh(agent)
    await test_db.refresh(tournament)

    bet = Bet(
        user_address="0x" + "6" * 40,
        agent_id=agent.id,
        tournament_id=tournament.id,
        amount=Decimal("50.0"),
        odds=Decimal("1.5"),
    )

    test_db.add(bet)
    await test_db.commit()
    await test_db.refresh(bet)

    r = await client.delete(f"/bets/{bet.id}")
    assert r.status_code == 200, r.text

    # Verify it's gone
    r2 = await client.get(f"/bets/{bet.id}")
    assert r2.status_code == 404
