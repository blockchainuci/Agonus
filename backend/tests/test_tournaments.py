# tests/test_tournaments.py
import pytest
from backend.app.api.main import app
from backend.app.api.deps import MockDataStore, get_store

@pytest.fixture
def store():
    '''Create the mock store for the tournaments tests'''
    s = MockDataStore()
    app.dependency_overrides[get_store] = lambda: s
    yield s
    app.dependency_overrides.clear()
    s.reset()

def seed_tournament(store: MockDataStore, **overrides) -> int:
    '''Seed the store with tournament mock data'''
    tournament_id = store.next_id("tournaments")
    store.tournaments[tournament_id] = {"id": tournament_id, "name": "Open", "status": "open", **overrides}
    return tournament_id


@pytest.mark.anyio
async def test_list_tournaments_empty(client, store):
    '''Test listing tournaments when none in db'''
    r = await client.get("/tournaments/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.anyio
async def test_list_tournaments_with_data(client, store):
    '''Test listing tournaments'''
    seed_tournament(store, name="Alpha Cup", status="open")
    seed_tournament(store, name="Beta Open", status="closed")

    r = await client.get("/tournaments/")
    assert r.status_code == 200, r.text

    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 2
    
    names = {t["name"] for t in data}
    assert {"Alpha Cup", "Beta Open"} <= names
    

@pytest.mark.anyio
async def test_get_tournament(client, store):
    '''Test getting a tournament based on a tournament_id'''
    tournament_id = seed_tournament(store, name="Autumn Classic")
    r = await client.get(f"/tournaments/{tournament_id}")
    assert r.status_code == 200
    assert r.json()["name"] == "Autumn Classic"

@pytest.mark.anyio
async def test_create_tournament(client, store):
    '''Test for creating a tournament'''
    r = await client.post("/tournaments/", json={"name": "Winter Cup", "status": "open"})
    assert r.status_code in (200, 201), r.text
    created = r.json()
    assert created["name"] == "Winter Cup"

@pytest.mark.anyio
async def test_update_tournament(client, store):
    '''Test for updating a tournament based on a tournament_id'''
    tournament_id = seed_tournament(store, name="Spring Open")
    r = await client.put(f"/tournaments/{tournament_id}", json={"status": "closed"})
    assert r.status_code in (200, 202), r.text
    assert r.json()["status"] == "closed"

@pytest.mark.anyio
async def test_delete_tournament(client, store):
    '''Test for deleting a tournament based on a tournament_id'''
    tournament_id = seed_tournament(store, name="To Delete")
    r = await client.delete(f"/tournaments/{tournament_id}")
    assert r.status_code in (200, 204), r.text
    r2 = await client.get(f"/tournaments/{tournament_id}")
    assert r2.status_code == 404