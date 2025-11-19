import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Import the FastAPI app
from backend.app.api.main import app
from backend.app.db.database import get_db
from backend.app.db.models import Base
from backend.app.api.deps import get_current_user, require_admin


@pytest.fixture(scope="session")
def anyio_backend():
    '''Select the asyncio backend for AnyIO/pytest-asyncio'''
    return "asyncio"


# Test database engine and session
@pytest.fixture(scope="function")
async def test_db():
    '''Create a test database for each test function'''
    # Use in-memory SQLite for testing
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )

    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session factory
    TestSessionLocal = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with TestSessionLocal() as session:
        yield session

    # Drop all tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await test_engine.dispose()


@pytest.fixture
def mock_user():
    '''Mock user for authentication bypass'''
    return {"address": "0x" + "1" * 40, "role": "user"}


@pytest.fixture
def mock_admin():
    '''Mock admin user for authentication bypass'''
    return {"address": "0x" + "a" * 40, "role": "admin"}


@pytest.fixture
async def client(test_db, mock_admin):
    '''Provide an HTTPX AsyncClient with test database and auth override'''
    # Override database dependency
    app.dependency_overrides[get_db] = lambda: test_db

    # Override auth dependencies to bypass JWT verification
    app.dependency_overrides[get_current_user] = lambda: mock_admin
    app.dependency_overrides[require_admin] = lambda: mock_admin

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    # Clear overrides after test
    app.dependency_overrides.clear()