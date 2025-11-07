from fastapi import APIRouter, Depends, HTTPException
from deps import TestDataStore, get_store

router = APIRouter()


@router.get("/")
def list_agents(store: TestDataStore = Depends(get_store)):
    return list(store.agents.values())


