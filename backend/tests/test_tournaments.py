import pytest
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from uuid import uuid4
from backend.app.db.models import Tournament


@pytest.mark.anyio
async def test_list_tournaments_empty(client):
    '''Test listing tournaments when none in db'''
    r = await client.get("/tournaments/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.anyio
async def test_list_tournaments_with_data(client, test_db):
    '''Test listing tournaments'''
    now = datetime.now(timezone.utc)
    tournament1 = Tournament(
        name="Alpha Cup",
        status="upcoming",
        start_date=now + timedelta(days=1),
        end_date=now + timedelta(days=8),
        prize_pool=Decimal("10000.00"),
    )
    tournament2 = Tournament(
        name="Beta Open",
        status="completed",
        start_date=now - timedelta(days=7),
        end_date=now - timedelta(days=1),
        prize_pool=Decimal("5000.00"),
    )

    test_db.add(tournament1)
    test_db.add(tournament2)
    await test_db.commit()

    r = await client.get("/tournaments/")
    assert r.status_code == 200, r.text

    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 2

    names = {t["name"] for t in data}
    assert {"Alpha Cup", "Beta Open"} == names


@pytest.mark.anyio
async def test_get_tournament(client, test_db):
    '''Test getting a tournament based on a tournament_id'''
    now = datetime.now(timezone.utc)
    tournament = Tournament(
        name="Autumn Classic",
        status="live",
        start_date=now,
        end_date=now + timedelta(days=7),
        prize_pool=Decimal("15000.00"),
    )
    test_db.add(tournament)
    await test_db.commit()
    await test_db.refresh(tournament)

    r = await client.get(f"/tournaments/{tournament.id}")
    assert r.status_code == 200
    assert r.json()["name"] == "Autumn Classic"


@pytest.mark.anyio
async def test_get_tournament_not_found(client):
    '''Test getting a non-existent tournament'''
    fake_id = uuid4()
    r = await client.get(f"/tournaments/{fake_id}")
    assert r.status_code == 404


@pytest.mark.anyio
async def test_create_tournament(client):
    '''Test for creating a tournament'''
    now = datetime.now(timezone.utc)
    body = {
        "name": "Winter Cup",
        "start_date": (now + timedelta(days=30)).isoformat(),
        "end_date": (now + timedelta(days=37)).isoformat(),
        "prize_pool": 20000.00,
        "agent_ids": [],  # Required field for tournament creation
    }
    r = await client.post("/tournaments/", json=body)
    assert r.status_code == 201, r.text
    created = r.json()
    assert created["name"] == "Winter Cup"
    assert created["status"] == "upcoming"
    assert "id" in created


@pytest.mark.anyio
async def test_update_tournament(client, test_db):
    '''Test for updating a tournament based on a tournament_id'''
    now = datetime.now(timezone.utc)
    tournament = Tournament(
        name="Spring Open",
        status="upcoming",
        start_date=now + timedelta(days=10),
        end_date=now + timedelta(days=17),
        prize_pool=Decimal("8000.00"),
    )
    test_db.add(tournament)
    await test_db.commit()
    await test_db.refresh(tournament)

    r = await client.put(f"/tournaments/{tournament.id}", json={"status": "live"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "live"
    assert r.json()["name"] == "Spring Open"  # unchanged fields remain


@pytest.mark.anyio
async def test_delete_tournament(client, test_db):
    '''Test for deleting a tournament based on a tournament_id'''
    now = datetime.now(timezone.utc)
    tournament = Tournament(
        name="To Delete",
        status="upcoming",
        start_date=now + timedelta(days=5),
        end_date=now + timedelta(days=12),
        prize_pool=Decimal("1000.00"),
    )
    test_db.add(tournament)
    await test_db.commit()
    await test_db.refresh(tournament)

    r = await client.delete(f"/tournaments/{tournament.id}")
    assert r.status_code == 200, r.text

    # Verify it's gone
    r2 = await client.get(f"/tournaments/{tournament.id}")
    assert r2.status_code == 404