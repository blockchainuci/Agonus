import pytest
from backend.app.api.main import app
from backend.app.api.deps import MockDataStore, get_store

@pytest.fixture
def store():
    '''Create the mock store for the bets tests'''
    s = MockDataStore()
    app.dependency_overrides[get_store] = lambda: s
    yield s
    app.dependency_overrides.clear()
    s.reset()

def seed_bet(store: MockDataStore, **overrides) -> int:
    '''Seed the store with bet mock data'''
    bet_id = store.next_id("bets")
    store.bets[bet_id] = {
        "id": bet_id,
        "tournament_id": 1,
        "agent_id": 1,
        "bet_amount": 100.0,
        "bet_type": "win",
        "bet_option": "AlphaBot",
        "status": "active",
        "placed_at": "2025-11-01T12:00:00Z",
        **overrides,
    }
    return bet_id

@pytest.mark.anyio
async def test_list_bets_empty(client, store):
    '''Test for listing empty bets list'''
    r = await client.get("/bets/")
    assert r.status_code == 200
    assert r.json() == []

@pytest.mark.anyio
async def test_list_bets_with_data(client, store):
    '''Test for listing bets'''
    seed_bet(store, bet_option="AlphaBot")
    seed_bet(store, bet_option="BetaBot")
    r = await client.get("/bets/")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 2
    options = {b["bet_option"] for b in data}
    assert {"AlphaBot", "BetaBot"} <= options

@pytest.mark.anyio
async def test_get_bet(client, store):
    '''Test for getting bet based on the bet_id'''
    bet_id = seed_bet(store, bet_option="GammaBot")
    r = await client.get(f"/bets/{bet_id}")
    assert r.status_code == 200
    assert r.json()["bet_option"] == "GammaBot"

@pytest.mark.anyio
async def test_create_bet(client, store):
    '''Test for creating a bet'''
    body = {
        "tournament_id": 1,
        "agent_id": 2,
        "bet_amount": 250.0,
        "bet_type": "win",
        "bet_option": "DeltaBot",
        "status": "pending",
        "placed_at": "2025-11-03T15:30:00Z",
    }
    r = await client.post("/bets/", json=body)
    assert r.status_code in (200, 201), r.text
    created = r.json()
    assert created["bet_option"] == "DeltaBot"

@pytest.mark.anyio
async def test_update_bet(client, store):
    '''Test for updating a bet based on bet_id'''
    bet_id = seed_bet(store, status="active")
    r = await client.put(f"/bets/{bet_id}", json={"status": "settled"})
    assert r.status_code in (200, 202), r.text
    assert r.json()["status"] == "settled"

@pytest.mark.anyio
async def test_delete_bet(client, store):
    '''Test for deleting a bet based on bet_id'''
    bet_id = seed_bet(store, bet_option="ZetaBot")
    r = await client.delete(f"/bets/{bet_id}")
    assert r.status_code in (200, 204), r.text
    # verify it's gone
    r2 = await client.get(f"/bets/{bet_id}")
    assert r2.status_code == 404
