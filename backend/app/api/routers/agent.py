from fastapi import APIRouter, Depends, HTTPException
from deps import TestDataStore, get_store

router = APIRouter()


@router.get("/")
def list_agents(store: TestDataStore = Depends(get_store)):
    return list(store.agents.values())

@router.get("/{id}")
def get_agent(agent_id: int, store: TestDataStore = Depends(get_store)) -> "Agent":
    if agent_id not in store.agents:
        raise HTTPException(404, "Agent Not Found")
    return store.agents[agent_id]

@router.post("/")
def create_agent(agent_data: dict, store: TestDataStore = Depends(get_store)) -> None:
    agent_id = store.next_id("agents")
    store.agents[agent_id] = {"id": agent_id, **agent_data}
    return store.agents[agent_id]

@router.put("/{id}")
def update_agent(agent_id: int, agent_data: dict, store: TestDataStore = Depends(get_store)) -> None:
    if agent_id not in store.agents:
        raise HTTPException(404, "Agent Not Found")
    store.agents[agent_id].update(**agent_data)
    return store.agents[agent_id]

@router.delete("/{id}")
def delete_agent(agent_id: int, store: TestDataStore = Depends(get_store)) -> None:
    if agent_id not in store.agents:
        raise HTTPException(404, "Agent Not Found")
    del store.agents[agent_id]   
    return {"message": f"Agent {agent_id} deleted"}