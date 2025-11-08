from fastapi import APIRouter, Depends, HTTPException
from backend.app.api.deps import MockDataStore, get_store

router = APIRouter()

@router.get("/")
def list_bets(store: MockDataStore = Depends(get_store)) -> list[dict]:
    '''GET route for list of bets'''
    return list(store.bets.values())

@router.get("/{bet_id}")
def get_bet(bet_id: int, store: MockDataStore = Depends(get_store)) -> dict:
    '''GET route for bet of bet_id'''
    if bet_id not in store.bets:
        raise HTTPException(404, "Bet Not Found")
    return store.bets[bet_id]

@router.post("/")
def create_bet(bet_data: dict, store: MockDataStore = Depends(get_store)) -> dict:
    '''POST route for creating a bet'''
    bet_id = store.next_id("bets")
    # You might want to validate agent/tournament existence here
    store.bets[bet_id] = {"id": bet_id, **bet_data}
    return store.bets[bet_id]

@router.put("/{bet_id}")
def update_bet(bet_id: int, bet_data: dict, store: MockDataStore = Depends(get_store)) -> dict:
    '''PUT route for updating a bet of bet_id'''
    if bet_id not in store.bets:
        raise HTTPException(404, "Bet Not Found")
    store.bets[bet_id].update(**bet_data)
    return store.bets[bet_id]

@router.delete("/{bet_id}")
def delete_bet(bet_id: int, store: MockDataStore = Depends(get_store)) -> dict:
    '''DELETE route for deleting a bet of bet_id'''
    if bet_id not in store.bets:
        raise HTTPException(404, "Bet Not Found")
    del store.bets[bet_id]
    return {"message": f"Bet {bet_id} deleted"}
