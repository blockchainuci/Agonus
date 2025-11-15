from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID
from backend.app.db.database import get_session
from backend.app.db.models import Bet
#from backend.app.mock_store import MockDataStore, get_store

router = APIRouter()

@router.get("/")
def list_bets(session: Session = Depends(get_session)) -> list[Bet]:
    '''GET route for list of bets'''
    statement = select(Bet)
    return session.exec(statement).all()

@router.get("/{bet_id}")
def get_bet(bet_id: UUID, session: Session = Depends(get_session)) -> Bet:
    '''GET route for bet of bet_id'''
    bet = session.get(Bet, bet_id)
    if not bet:
        raise HTTPException(404, "Bet Not Found")
    return bet

@router.post("/")
def create_bet(bet: Bet, session: Session = Depends(get_session)) -> Bet:
    '''POST route for creating a bet'''
    session.add(bet)
    session.commit()
    session.refresh(bet)
    return bet

@router.put("/{bet_id}")
def update_bet(bet_id: UUID, new_bet: Bet, session: Session = Depends(get_session)) -> Bet:
    '''PUT route for updating a bet of bet_id'''
    db_bet = session.get(Bet, bet_id)
    if not db_bet:
        raise HTTPException(404, "Bet Not Found")
    
    #might be .dict() instead of model dump depending on version
    update_data = new_bet.model_dump(exclude_unset=True)
    update_data.pop("id", None)
    
    for key, value in update_data.items():
        setattr(db_bet, key, value)
    
    session.add(db_bet)
    session.commit()
    session.refresh(db_bet)
    
    return db_bet

@router.delete("/{bet_id}")
def delete_bet(bet_id: UUID, session: Session = Depends(get_session)) -> dict:
    '''DELETE route for deleting a bet of bet_id'''
    bet = session.get(Bet, bet_id)
    if not bet:
        raise HTTPException(404, "Bet Not Found")
    
    session.delete(bet)
    session.commit()
    
    return {"message": f"Bet {bet_id} deleted"}
