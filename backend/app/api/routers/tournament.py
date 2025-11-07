from fastapi import APIRouter, Depends, HTTPException
from deps import TestDataStore, get_store

#prefix and tags in main already so use 
router = APIRouter()
#router = APIRouter(prefix = "/tournaments", tags=["tournaments"])


@router.get("/")
def list_tournaments(store: TestDataStore = Depends(get_store)) -> list:
    return list(store.tournaments.values())

@router.get("/{id}")
def get_tournament(tournament_id: int, store: TestDataStore = Depends(get_store)) -> "Tournament":
    if tournament_id not in store.tournaments:
        raise HTTPException(404, "Tournament Not Found")
    return store.tournaments[tournament_id]
    
@router.post("/")
def create_tournament(tournament_data: dict, store: TestDataStore = Depends(get_store)) -> None:
    tournament_id = store.next_id("tournaments")
    store.tournaments[tournament_id] = {"id": tournament_id, **tournament_data}
    return store.tournaments[tournament_id]
    
    
@router.put("/{id}")
def update_tournament(tournament_id: int, tournament_data: dict, store: TestDataStore = Depends(get_store)) -> None:
    if tournament_id not in store.tournaments:
        raise HTTPException(404, "Tournament Not Found")
    store.tournaments[tournament_id].update(**tournament_data)
    return store.tournaments[tournament_id]
    

@router.delete("/{id}")
def delete_tournament(tournament_id: int, store: TestDataStore = Depends(get_store)) -> None:
    if tournament_id not in store.tournaments:
        raise HTTPException(404, "Tournament Not Found")
    del store.tournaments[tournament_id]   
    return {"message": f"Tournament {tournament_id} deleted"}