from fastapi import APIRouter, Depends, HTTPException
from backend.app.api.deps import MockDataStore, get_store

router = APIRouter()


@router.get("/")
def list_agents(store: MockDataStore = Depends(get_store)) -> list[dict]:
    '''GET route for list of agents'''
    return list(store.agents.values())

@router.get("/{agent_id}")
def get_agent(agent_id: int, store: MockDataStore = Depends(get_store)) -> dict:
    '''GET route for agent of agent_id'''
    if agent_id not in store.agents:
        raise HTTPException(404, "Agent Not Found")
    return store.agents[agent_id]

@router.post("/")
def create_agent(agent_data: dict, store: MockDataStore = Depends(get_store)) -> dict:
    '''POST route for creating an agent'''
    agent_id = store.next_id("agents")
    store.agents[agent_id] = {"id": agent_id, **agent_data}
    return store.agents[agent_id]

@router.put("/{agent_id}")
def update_agent(agent_id: int, agent_data: dict, store: MockDataStore = Depends(get_store)) -> dict:
    '''PUT route for updating an agent of agent_id'''
    if agent_id not in store.agents:
        raise HTTPException(404, "Agent Not Found")
    store.agents[agent_id].update(**agent_data)
    return store.agents[agent_id]

@router.delete("/{agent_id}")
def delete_agent(agent_id: int, store: MockDataStore = Depends(get_store)) -> dict:
    '''DELETE route for deleting an agent of agent_id'''
    if agent_id not in store.agents:
        raise HTTPException(404, "Agent Not Found")
    del store.agents[agent_id]   
    return {"message": f"Agent {agent_id} deleted"}