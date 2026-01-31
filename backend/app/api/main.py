from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ✅ NEW runtime agents router (live AI trading agents)
from app.api.routers.runtime_agents import router as runtime_agents_router

# ✅ Existing backend routers (database-driven)
from app.api.routers import tournament
from app.api.routers import agent
from app.api.routers import trade
from app.api.routers import bet
from app.api.routers import auth
from app.api.routers import market_data


app = FastAPI(title="Agonus API", redirect_slashes=False)

# Configure CORS - must be added AFTER exception handlers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ------------------------------
# Register Routers
# ------------------------------

# 🔥 LIVE agents (runtime AI bots tracked in memory)
app.include_router(runtime_agents_router)

# 📦 Database-backed REST endpoints
app.include_router(tournament.router, prefix="/tournaments", tags=["Tournaments"])
app.include_router(agent.router, prefix="/agents", tags=["Agents"])
app.include_router(trade.router, prefix="/trades", tags=["Trades"])
app.include_router(bet.router, prefix="/bets", tags=["Bets"])
app.include_router(auth.router, tags=["Auth"])  # auth.router already has prefix="/auth"
app.include_router(market_data.router, tags=["Market Data"])  # already has prefix="/market-data"
