from fastapi import APIRouter, Depends, HTTPException
from backend.app.api.deps import MockDataStore, get_store

router = APIRouter()

@router.get("/")
def list_trades_for_tournament(tournament_id: int = None, store: MockDataStore = Depends(get_store)):
    '''GET route for listing all trades for a specific tournament_id'''

    # this assumes that tournament_id field is associated with this trade
    if tournament_id is None:
        # return all trades if no tournament id provided
        return list(store.trades.values())
    return [t for t in store.trades.values() if t.get("tournament_id") == tournament_id]
    
@router.get("/agent/{agent_id}")
def list_trades_by_agent(agent_id: int, store: MockDataStore = Depends(get_store)):
    '''GET route for listing all trades for a specific agent_id'''
    
    # this assumes agent_id field is associated with this trade
    return [t for t in store.trades.values() if t.get("agent_id") == agent_id]
    
@router.post("/")
def create_trade(trade_data: dict, store: MockDataStore = Depends(get_store)):
    '''POST route for creating a new trade'''
    
    #trade needs to be created with an agent_id field and a tournament_id field
    trade_id = store.next_id("trades")
    trade = {"id": trade_id, **trade_data}
    store.trades[trade_id] = trade
    return trade