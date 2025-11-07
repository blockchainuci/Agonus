import pytest
from httpx import AsyncClient
from httpx import ASGITransport
from asgi_lifespan import LifespanManager

# Import the FastAPI app
from backend.app.api.main import app

@pytest.fixture(scope="session")
def anyio_backend():
    '''Select the asyncio backend for AnyIO/pytest-asyncio'''
    return "asyncio"

@pytest.fixture(scope="session")
async def started_app():
    '''Start the FastAPI app with lifespan events for the test session'''
    async with LifespanManager(app):
        yield app

@pytest.fixture
async def client(started_app):
    '''Provide an HTTPX AsyncClient bound to the FastAPI ASGI app'''
    transport = ASGITransport(app=started_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac