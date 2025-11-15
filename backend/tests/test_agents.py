import pytest
from backend.app.api.main import app
from backend.app.mock_store import MockDataStore, get_store

@pytest.fixture
def store():
    '''Create the mock store for the agents tests'''
    s = MockDataStore()
    app.dependency_overrides[get_store] = lambda: s
    yield s
    app.dependency_overrides.clear()
    s.reset()

def seed_agent(store: MockDataStore, **overrides) -> int:
    '''Seed the store with agent mock data'''
    agent_id = store.next_id("agents")
    store.agents[agent_id] = {
        "id": agent_id,
        "name": "Alpha",
        "personality_type": "maximalist",
        "wallet_address": "0x" + "1" * 40,
        "personality_prompt": "You are bold.",
        "strategy_code": "pass",
        "total_trades": 0,
        "total_winnings_usd": 0.0,
        "tournaments_won": 0,
        **overrides,
    }
    return agent_id


@pytest.mark.anyio
async def test_list_agents_empty(client, store):
    '''Test for listing empty agents list'''
    r = await client.get("/agents/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.anyio
async def test_list_agents_with_data(client, store):
    '''Test for listing agents'''
    seed_agent(store, name="AlphaBot")
    seed_agent(store, name="BetaBot")
    r = await client.get("/agents/")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 2
    names = {a["name"] for a in data}
    assert {"AlphaBot", "BetaBot"} <= names


@pytest.mark.anyio
async def test_get_agent(client, store):
    '''Test for getting agent based on the agent_id'''
    agent_id = seed_agent(store, name="GammaBot")
    r = await client.get(f"/agents/{agent_id}")
    assert r.status_code == 200
    assert r.json()["name"] == "GammaBot"


@pytest.mark.anyio
async def test_create_agent(client, store):
    '''Test for creating an agent'''
    body = {
        "name": "DeltaBot",
        "personality_type": "minimalist",
        "wallet_address": "0x" + "2" * 40,
        "personality_prompt": "Be concise.",
        "strategy_code": "pass",
        "total_trades": 5,
        "total_winnings_usd": 200.0,
        "tournaments_won": 1,
    }
    r = await client.post("/agents/", json=body)
    assert r.status_code in (200, 201), r.text
    created = r.json()
    assert created["name"] == "DeltaBot"



@pytest.mark.anyio
async def test_update_agent(client, store):
    '''Test for updating an agent based on agent_id'''
    agent_id = seed_agent(store, name="EpsilonBot", total_trades=1)
    r = await client.put(f"/agents/{agent_id}", json={"total_trades": 10})
    assert r.status_code in (200, 202), r.text
    assert r.json()["total_trades"] == 10


@pytest.mark.anyio
async def test_delete_agent(client, store):
    '''Test for deleting an agent based on agent_id'''
    agent_id = seed_agent(store, name="ZetaBot")
    r = await client.delete(f"/agents/{agent_id}")
    assert r.status_code in (200, 204), r.text
    # verify it's gone
    r2 = await client.get(f"/agents/{agent_id}")
    assert r2.status_code == 404