import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# --- SCALABILITY TUNING ---
# These defaults are safe, but you should override them in docker-compose:
# API: DB_POOL_SIZE=20, DB_MAX_OVERFLOW=10
# Worker: DB_POOL_SIZE=1, DB_MAX_OVERFLOW=0
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", 5))
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", 10))

# Only log SQL in dev/debug mode (logging kills performance in production)
DB_ECHO = os.getenv("DB_ECHO", "False").lower() == "true"

# Create async engine
# Use NullPool for Celery workers to avoid "operation in progress" errors
# NullPool creates a new connection for each session and disposes it immediately
USE_NULL_POOL = os.getenv("USE_NULL_POOL", "False").lower() == "true"

if USE_NULL_POOL:
    # NullPool: No connection pooling - creates fresh connection each time
    # Use this for Celery workers to avoid asyncpg connection conflicts
    engine = create_async_engine(
        DATABASE_URL,
        echo=DB_ECHO,
        poolclass=NullPool,
        connect_args={
            "ssl": "require",  # Crucial for Neon
        },
    )
else:
    # Standard pooling: Use for FastAPI server
    engine = create_async_engine(
        DATABASE_URL,
        echo=DB_ECHO,
        # 1. Connection Pooling limits
        pool_size=POOL_SIZE,
        max_overflow=MAX_OVERFLOW,
        pool_timeout=30,  # Wait 30s for a connection before failing
        pool_recycle=1800,  # Refresh connections every 30 mins
        # 2. Neon / Asyncpg requirements
        connect_args={
            "ssl": "require",  # Crucial for Neon
            # "statement_cache_size": 0 # Uncomment only if you see "prepared statement" errors
        },
    )

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


# Dependency for FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Create tables (Utility for startup)
async def init_db():
    # Import Base here to avoid circular imports during setup
    # Note: Adjust the import path if your models moved
    from app.db.models import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
