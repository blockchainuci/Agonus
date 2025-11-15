from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID
from backend.app.db.database import get_session
from backend.app.models import Agent
#from backend.app.mock_store import MockDataStore, get_store

router = APIRouter()


@router.get("/")
def list_agents(session: Session = Depends(get_session)) -> list[Agent]:
    '''GET route for list of agents'''
    statement = select(Agent)
    return session.exec(statement).all()

@router.get("/{agent_id}")
def get_agent(agent_id: UUID, session: Session = Depends(get_session)) -> Agent:
    '''GET route for agent of agent_id'''
    agent = session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(404, "Agent Not Found")
    return agent

@router.post("/")
def create_agent(agent: Agent, session: Session = Depends(get_session)) -> Agent:
    '''POST route for creating an agent'''
    session.add(agent)
    session.commit()
    session.refresh(agent)
    return agent

@router.put("/{agent_id}")
def update_agent(agent_id: UUID, new_agent: Agent, session: Session = Depends(get_session)) -> Agent:
    '''PUT route for updating an agent of agent_id'''
    db_agent = session.get(Agent, agent_id)
    if not db_agent:
        raise HTTPException(404, "Agent Not Found")

    update_data = new_agent.model_dump(exclude_unset=True)
    update_data.pop("id", None)
    
    for key, value in update_data.items():
        setattr(db_agent, key, value)
    
    session.add(db_agent)
    session.commit()
    session.refresh(db_agent)
    
    return db_agent

@router.delete("/{agent_id}")
def delete_agent(agent_id: UUID, session: Session = Depends(get_session)) -> dict:
    '''DELETE route for deleting an agent of agent_id'''
    agent = session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(404, "Agent Not Found")
    
    session.delete(agent)
    session.commit()
    
    return {"message": f"Agent {agent_id} deleted"}