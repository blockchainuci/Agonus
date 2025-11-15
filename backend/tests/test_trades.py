import pytest
from backend.app.api.main import app
from backend.app.mock_store import MockDataStore, get_store

@pytest.fixture
def store():
    '''Create the mock store for the trades tests'''
    s = MockDataStore()
    app.dependency_overrides[get_store] = lambda: s
    yield s
    app.dependency_overrides.clear()
    s.reset()

def seed_trade(store: MockDataStore, **overrides) -> int:
    '''Seed the store with trade mock data'''
    tid = store.next_id("trades")
    trade = {
        "id": tid,
        "agent_id": 1,
        "tournament_id": 10,
        "amount_usd": 500.0,
        "action": "BUY",
        "asset": "BTC",
        **overrides,
    }
    store.trades[tid] = trade
    return tid


@pytest.mark.anyio
async def test_list_all_trades(client, store):
    '''Test listing all trades, no tournament_id'''
    seed_trade(store, agent_id=1, tournament_id=10)
    seed_trade(store, agent_id=2, tournament_id=20)
    r = await client.get("/trades/")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 2


@pytest.mark.anyio
async def test_list_trades_for_specific_tournament(client, store):
    '''Test listing all trades for specific tournament_id'''
    seed_trade(store, tournament_id=10)
    seed_trade(store, tournament_id=20)
    r = await client.get("/trades/?tournament_id=10")
    assert r.status_code == 200, r.text
    data = r.json()
    assert all(t["tournament_id"] == 10 for t in data)
    assert len(data) == 1


@pytest.mark.anyio
async def test_list_trades_by_agent(client, store):
    '''Test listing trades based on agent_id'''
    seed_trade(store, agent_id=1)
    seed_trade(store, agent_id=2)
    r = await client.get("/trades/agent/1")
    assert r.status_code == 200, r.text
    data = r.json()
    assert all(t["agent_id"] == 1 for t in data)
    assert len(data) == 1


@pytest.mark.anyio
async def test_create_trade(client, store):
    '''Test for creating a new trade'''
    trade_data = {
        "agent_id": 99,
        "tournament_id": 123,
        "amount_usd": 1000.0,
        "action": "SELL",
        "asset": "ETH",
    }
    r = await client.post("/trades/", json=trade_data)
    assert r.status_code in (200, 201), r.text
    created = r.json()
    assert "id" in created
    assert created["agent_id"] == 99
    assert created["action"] == "SELL"
    # verify if change is in store
    assert created["id"] in store.trades