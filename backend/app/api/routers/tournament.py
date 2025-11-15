from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID
from backend.app.db.database import get_session
from backend.app.db.models import Tournament
#from backend.app.mock_store import MockDataStore, get_store

#prefix and tags in main already so use 
router = APIRouter()
#router = APIRouter(prefix = "/tournaments", tags=["tournaments"])


@router.get("/")
def list_tournaments(session: Session = Depends(get_session)) -> list[Tournament]:
    '''GET route for list of tournaments'''
    statement = select(Tournament)
    return session.exec(statement).all()

@router.get("/{tournament_id}")
def get_tournament(tournament_id: UUID, session: Session = Depends(get_session)) -> Tournament:
    '''GET route for tournament of tournament_id'''
    tournament = session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(404, "Tournament Not Found")
    return tournament
    
@router.post("/")
def create_tournament(tournament: Tournament, session: Session = Depends(get_sessiob)) -> Tournament:
    '''POST route for creating a tournament'''
    session.add(tournament)
    session.commit()
    session.refresh(tournament)
    return tournament
    
@router.put("/{tournament_id}")
def update_tournament(tournament_id: UUID, new_tournament: Tournament, session: Session = Depends(get_session)) -> Tournament:
    '''PUT route for updating a tournament of tournament_id'''
    db_tournament = session.get(Tournament, tournament_id)
    if not db_tournament:
        raise HTTPException(404, "Tournament Not Found")

    #might be .dict() instead of model dump depending on version
    update_data = new_tournament.model_dump(exclude_unset=True)
    update_data.pop("id", None)
    
    for key, value in update_data.items():
        setattr(db_tournament, key, value)
    
    session.add(db_tournament)
    session.commit()
    session.refresh(db_tournament)
    
    return db_tournament

@router.delete("/{tournament_id}")
def delete_tournament(tournament_id: UUID, session: Session = Depends(get_session)) -> dict:
    '''DELETE route for deleting a tournament of tournament_id'''
    tournament = session.get(Tournament, tournament_id)
    if not tournament_id:
        raise HTTPException(404, "Tournament Not Found")
    
    session.delete(tournament)
    session.commit()
    
    return {"message": f"Tournament {tournament_id} deleted"}