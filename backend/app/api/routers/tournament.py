from fastapi import APIRouter, Depends, HTTPException
from backend.app.mock_store import MockDataStore, get_store

#prefix and tags in main already so use 
router = APIRouter()
#router = APIRouter(prefix = "/tournaments", tags=["tournaments"])


@router.get("/")
def list_tournaments(store: MockDataStore = Depends(get_store)) -> list[dict]:
    '''GET route for list of tournaments'''
    return list(store.tournaments.values())

@router.get("/{tournament_id}")
def get_tournament(tournament_id: int, store: MockDataStore = Depends(get_store)) -> dict:
    '''GET route for tournament of tournament_id'''
    if tournament_id not in store.tournaments:
        raise HTTPException(404, "Tournament Not Found")
    return store.tournaments[tournament_id]
    
@router.post("/")
def create_tournament(tournament_data: dict, store: MockDataStore = Depends(get_store)) -> dict:
    '''POST route for creating a tournament'''
    tournament_id = store.next_id("tournaments")
    store.tournaments[tournament_id] = {"id": tournament_id, **tournament_data}
    return store.tournaments[tournament_id]
    
    
@router.put("/{tournament_id}")
def update_tournament(tournament_id: int, tournament_data: dict, store: MockDataStore = Depends(get_store)) -> dict:
    '''PUT route for updating a tournament of tournament_id'''
    if tournament_id not in store.tournaments:
        raise HTTPException(404, "Tournament Not Found")
    store.tournaments[tournament_id].update(**tournament_data)
    return store.tournaments[tournament_id]
    

@router.delete("/{tournament_id}")
def delete_tournament(tournament_id: int, store: MockDataStore = Depends(get_store)) -> dict:
    '''DELETE route for deleting a tournament of tournament_id'''
    if tournament_id not in store.tournaments:
        raise HTTPException(404, "Tournament Not Found")
    del store.tournaments[tournament_id]   
    return {"message": f"Tournament {tournament_id} deleted"}