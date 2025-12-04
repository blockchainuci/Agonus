from fastapi import FastAPI
from app.api.routers import tournament, agent, trade, bet, auth, market_data

app = FastAPI(title="Agonus API")

# Register routers
app.include_router(tournament.router, prefix="/tournaments", tags=["Tournaments"])
app.include_router(agent.router, prefix="/agents", tags=["Agents"])
app.include_router(trade.router, prefix="/trades", tags=["Trades"])
app.include_router(bet.router, prefix="/bets", tags=["Bets"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(market_data.router, prefix="/market-data", tags=["Market Data"])

@app.get("/")
def root():
    return {"message": "Agonus API running 🚀"}