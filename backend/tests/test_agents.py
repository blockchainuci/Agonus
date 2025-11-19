import pytest
from uuid import uuid4
from backend.app.db.models import Agent


@pytest.mark.anyio
async def test_list_agents_empty(client):
    '''Test for listing empty agents list'''
    r = await client.get("/agents/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.anyio
async def test_list_agents_with_data(client, test_db):
    '''Test for listing agents'''
    # Create test agents in database
    agent1 = Agent(name="AlphaBot", personality="Bold and aggressive", strategy_type="momentum")
    agent2 = Agent(name="BetaBot", personality="Conservative and cautious", strategy_type="value")

    test_db.add(agent1)
    test_db.add(agent2)
    await test_db.commit()

    r = await client.get("/agents/")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 2
    names = {a["name"] for a in data}
    assert {"AlphaBot", "BetaBot"} == names


@pytest.mark.anyio
async def test_get_agent(client, test_db):
    '''Test for getting agent based on the agent_id'''
    agent = Agent(name="GammaBot", personality="Analytical", strategy_type="quantitative")
    test_db.add(agent)
    await test_db.commit()
    await test_db.refresh(agent)

    r = await client.get(f"/agents/{agent.id}")
    assert r.status_code == 200
    assert r.json()["name"] == "GammaBot"


@pytest.mark.anyio
async def test_get_agent_not_found(client):
    '''Test for getting non-existent agent'''
    fake_id = uuid4()
    r = await client.get(f"/agents/{fake_id}")
    assert r.status_code == 404


@pytest.mark.anyio
async def test_create_agent(client):
    '''Test for creating an agent'''
    body = {
        "name": "DeltaBot",
        "personality": "Be concise and efficient",
        "strategy_type": "arbitrage",
        "avatar_url": "https://example.com/avatar.png",
    }
    r = await client.post("/agents/", json=body)
    assert r.status_code == 201, r.text
    created = r.json()
    assert created["name"] == "DeltaBot"
    assert created["personality"] == "Be concise and efficient"
    assert created["strategy_type"] == "arbitrage"
    assert "id" in created


@pytest.mark.anyio
async def test_update_agent(client, test_db):
    '''Test for updating an agent based on agent_id'''
    agent = Agent(name="EpsilonBot", personality="Flexible", strategy_type="hybrid")
    test_db.add(agent)
    await test_db.commit()
    await test_db.refresh(agent)

    r = await client.put(f"/agents/{agent.id}", json={"strategy_type": "momentum"})
    assert r.status_code == 200, r.text
    assert r.json()["strategy_type"] == "momentum"
    assert r.json()["name"] == "EpsilonBot"  # unchanged fields remain


@pytest.mark.anyio
async def test_update_agent_stats(client, test_db):
    '''Test for updating agent stats'''
    agent = Agent(name="StatsBot", personality="Data-driven", strategy_type="ml")
    test_db.add(agent)
    await test_db.commit()
    await test_db.refresh(agent)

    new_stats = {"wins": 10, "losses": 5, "total_profit": 1000.50}
    r = await client.patch(f"/agents/{agent.id}/stats", json=new_stats)
    assert r.status_code == 200, r.text
    assert r.json()["stats"]["wins"] == 10
    assert r.json()["stats"]["losses"] == 5


@pytest.mark.anyio
async def test_delete_agent(client, test_db):
    '''Test for deleting an agent based on agent_id'''
    agent = Agent(name="ZetaBot", personality="Temporary", strategy_type="test")
    test_db.add(agent)
    await test_db.commit()
    await test_db.refresh(agent)

    r = await client.delete(f"/agents/{agent.id}")
    assert r.status_code == 200, r.text

    # Verify it's gone
    r2 = await client.get(f"/agents/{agent.id}")
    assert r2.status_code == 404