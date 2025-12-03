from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routers import tournament, agent, trade, bet, auth, market_data

app = FastAPI(title="Agonus API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js frontend
        "http://localhost:3001",  # Alternative port
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

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