from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import logging

from ...db.database import get_db
from ...db.models import Agent
from ...schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from ..deps import require_admin
from ...agents.onchain.wallet_utils import generate_wallet, encrypt_private_key
from ...agents.onchain.tenderly import setup_agent_wallet

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=list[AgentResponse])
async def list_agents(session: AsyncSession = Depends(get_db)):
    """GET route for list of all agents"""
    statement = select(Agent)
    result = await session.execute(statement)
    agents = result.scalars().all()
    return agents


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: UUID, session: AsyncSession = Depends(get_db)):
    """GET route for agent by agent_id"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")
    return agent


@router.get("/{agent_id}/stats", response_model=dict)
async def get_agent_stats(agent_id: UUID, session: AsyncSession = Depends(get_db)):
    """GET route for agent statistics across all tournaments"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")

    # Return the stats JSON field
    return agent.stats


@router.post("/", response_model=AgentResponse, status_code=201)
async def create_agent(
    agent_data: AgentCreate,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """
    POST route for creating a new agent (admin only).

    Automatically generates an Ethereum wallet, encrypts the private key,
    stores wallet data in the agent's stats, and funds the wallet via Tenderly.
    """
    agent_dict = agent_data.model_dump(exclude_none=True)

    # Ensure stats and memory have default values if not provided
    if 'stats' not in agent_dict:
        agent_dict['stats'] = {}
    if 'memory' not in agent_dict:
        agent_dict['memory'] = {}

    # Generate new Ethereum wallet for this agent
    logger.info(f"Generating wallet for agent: {agent_dict.get('name', 'unnamed')}")
    wallet = generate_wallet()
    wallet_address = wallet['address']
    plain_private_key = wallet['private_key']

    # Encrypt private key for secure database storage
    logger.info(f"Encrypting private key for wallet: {wallet_address}")
    encrypted_key = encrypt_private_key(plain_private_key)

    # Store wallet credentials in agent stats
    agent_dict['stats']['wallet_address'] = wallet_address
    agent_dict['stats']['encrypted_private_key'] = encrypted_key
    logger.info(f"Wallet credentials stored in agent stats")

    # Create agent with wallet data
    agent = Agent(**agent_dict)
    session.add(agent)
    await session.commit()
    await session.refresh(agent)
    logger.info(f"Agent created with ID: {agent.id}")

    # Fund wallet via Tenderly Virtual TestNet
    try:
        logger.info(f"Funding wallet via Tenderly: {wallet_address}")
        setup_agent_wallet(
            wallet_address=wallet_address,
            initial_usdc=10000.0,  # Start with 10k USDC
            initial_eth=1.0        # 1 ETH for gas fees
        )
        logger.info(f"Wallet funded successfully: {wallet_address}")
    except Exception as e:
        logger.error(f"Failed to fund wallet {wallet_address}: {str(e)}")
        # Don't fail agent creation if funding fails - wallet can be funded later

    return agent


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: UUID,
    agent_data: AgentUpdate,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """PUT route for updating an agent (admin only)"""
    db_agent = await session.get(Agent, agent_id)
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")

    # Update only provided fields
    update_data = agent_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_agent, key, value)

    session.add(db_agent)
    await session.commit()
    await session.refresh(db_agent)

    return db_agent


@router.patch("/{agent_id}/stats", response_model=AgentResponse)
async def update_agent_stats(
    agent_id: UUID,
    stats: dict,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """PATCH route for updating agent stats (admin/system only)"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")

    # Merge new stats with existing stats
    agent.stats = {**agent.stats, **stats}

    session.add(agent)
    await session.commit()
    await session.refresh(agent)

    return agent


@router.patch("/{agent_id}/memory", response_model=AgentResponse)
async def update_agent_memory(
    agent_id: UUID,
    memory: dict,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """PATCH route for updating agent memory (admin/system only)"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")

    # Merge new memory with existing memory
    agent.memory = {**agent.memory, **memory}

    session.add(agent)
    await session.commit()
    await session.refresh(agent)

    return agent


@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: UUID,
    session: AsyncSession = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """DELETE route for deleting an agent (admin only - use with caution)"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent Not Found")

    # Note: This will fail if agent has related trades/bets due to foreign keys
    # Consider soft delete instead (add 'active' boolean field)
    await session.delete(agent)
    await session.commit()

    return {"message": f"Agent {agent_id} deleted successfully"}

