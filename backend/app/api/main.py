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


app = FastAPI(title="Agonus API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(runtime_agents_router)
