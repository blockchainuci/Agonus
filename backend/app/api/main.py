from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import tournament, agent, agent_state, trade, bet, auth, market_data
from os import getenv
import uvicorn
from contextlib import asynccontextmanager


APPLICATION_PORT = 8000


app = FastAPI(
    title="Agonus API",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (includes ngrok and other tunnels)
    allow_credentials=False,  # Must be False when allow_origins is ["*"]
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Register routers
app.include_router(tournament.router, prefix="/tournaments", tags=["Tournaments"])
app.include_router(agent.router, prefix="/agents", tags=["Agents"])
app.include_router(agent_state.router, prefix="/agent-states", tags=["Agent States"])
app.include_router(trade.router, prefix="/trades", tags=["Trades"])
app.include_router(bet.router, prefix="/bets", tags=["Bets"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(market_data.router, prefix="/market-data", tags=["Market Data"])


@app.get("/")
def root():
    return {"message": "Agonus API running 🚀"}


if __name__ == "__main__":
    uvicorn.run(
        "app.api.main:app", host="127.0.0.1", port=APPLICATION_PORT, reload=True
    )
