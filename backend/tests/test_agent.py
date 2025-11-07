import pytest

@pytest.mark.anyio
async def test_agent_crud(client):
    body = {
        "name": "Alpha",
        "personality_type": "maximalist",
        "wallet_address": "0x" + "1"*40,
        "personality_prompt": "You are bold.",
        "strategy_code": "pass",
        "total_trades": 0,
        "total_winnings_usd": 0.0,
        "tournaments_won": 0
    }
    # CREATE
    r = await client.post("/agents/", json=body)
    assert r.status_code == 200
    aid = r.json()["id"]

    # LIST
    r = await client.get("/agents/")
    assert aid in [a["id"] for a in r.json()]

    # GET
    r = await client.get(f"/agents/{aid}")
    assert r.status_code == 200
    assert r.json()["name"] == "Alpha"

    # UPDATE
    up_body = {"name": "Beta", "total_trades": 3}
    r = await client.put(f"/agents/{aid}", json=up_body)
    assert r.json()["name"] == "Beta"
    assert r.json()["total_trades"] == 3

    # DELETE
    r = await client.delete(f"/agents/{aid}")
    assert r.status_code == 200
    r = await client.get(f"/agents/{aid}")
    assert r.status_code == 404