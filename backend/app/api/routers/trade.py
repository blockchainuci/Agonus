from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from uuid import UUID

from backend.app.db.database import get_session
from backend.app.db.models import Trade

#from backend.app.mock_store import MockDataStore, get_store

router = APIRouter()

@router.get("/")
def list_trades_for_tournament(tournament_id: UUID | None = None, session: Session = Depends(get_session)) -> list[Trade]:
    '''GET route for listing all trades for a specific tournament_id'''
    statement = select(Trade)
    if tournament_id is not None:
        statement = statement.where(Trade.tournament_id == tournament_id)
    return session.exec(statement).all()
    
@router.get("/agent/{agent_id}")
def list_trades_by_agent(agent_id: UUID, session: Session = Depends(get_session)) -> list[Trade]:
    '''GET route for listing all trades for a specific agent_id'''
    # this assumes agent_id field is associated with this trade
    statement = select(Trade).where(Trade.agent_id == agent_id)
    return session.exec(statement).all()
    

    
@router.post("/")
def create_trade(trade: Trade, session: Session = Depends(get_session)) -> Trade:
    '''POST route for creating a new trade'''
    session.add(trade)
    session.commit()
    session.refresh(trade)
    return trade