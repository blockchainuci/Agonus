# backend/app/db/database.py
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create async engine
engine = create_async_engine(os.getenv("DATABASE_URL"), echo=True)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


# Dependency for FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


# Create tables
async def init_db():
    from backend.app.db.models import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
