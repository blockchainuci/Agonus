from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .routers import tournament, agent, trade, bet, auth, market_data
except ImportError:
    from routers import tournament, agent, trade, bet, auth, market_data
from os import getenv
import ngrok
import uvicorn
from contextlib import asynccontextmanager


NGROK_AUTH_TOKEN = "36RZTrmTHzEg95DzRPfQCB61dsC_21K9EdYRFrZLSMJQvfQyq"

APPLICATION_PORT = 8000


# hello
@asynccontextmanager
async def lifespan(app: FastAPI):
    listener = ngrok.forward(
        addr=APPLICATION_PORT,
        authtoken=NGROK_AUTH_TOKEN,
    )
    print(f"\n{'='*60}")
    print(f"{'='*60}\n")
    yield
    ngrok.disconnect()


app = FastAPI(title="Agonus API", lifespan=lifespan)

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
