from fastapi import APIRouter, Depends, HTTPException
from deps import TestDataStore, get_store

router = APIRouter()

@router.get("/")
def list_trades_for_tournament(tournament_id: int = None, store: TestDataStore = Depends(get_store)):
    if tournament_id is None:
        # return all trades if no tournament id provided
        return list(store.trades.values())
    return [t for t in store.trades.values() if t.get("tournament_id") == tournament_id]
    
@router.get("/agent/{agent_id}")
def list_trades_by_agent(agent_id: int, store: TestDataStore = Depends(get_store)):
    return [t for t in store.trades.values() if t.get("agent_id") == agent_id]
    
@router.post("/")
def create_trade(trade_data: dict, store: TestDataStore = Depends(get_store)):
    trade_id = store.next_id("trades")
    trade = {"id": trade_id, **trade_data}
    store.trades[trade_id] = trade
    return trade
    