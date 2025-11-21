from web3 import Web3
from eth_account import Account

from backend.app.core.config import settings

from typing import Any

# Initialize
w3 = Web3(Web3.HTTPProvider(settings.RPC_URL))
contract = w3.eth.contract(
    #address=settings.CONTRACT_ADDRESS,
    #apparently this is safer
    address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
    abi=settings.CONTRACT_ABI
)
admin_account = Account.from_key(settings.ADMIN_PRIVATE_KEY)

class ContractTransactionError(Exception):
    '''Raised when a contract transaction fails.'''
    pass



async def create_tournament_on_contract(agent_count: int) -> int:
    """
    Create a tournament on the AgonusBetting contract.

    Should call: createTournament(agentCount)
    Returns: on-chain tournament ID (int)
    Uses: admin_account to sign the transaction
    need to do: implement when event / ABI details are confirmed.
    """
    raise NotImplementedError("create_tournament_on_contract not implemented yet")


async def close_betting(contract_tournament_id: int) -> str:
    """
    Close betting for a given tournament on chain.

    Should call: closeBetting(tournamentId)
    Returns: transaction hash (str)

    TODO: implement.
    """
    raise NotImplementedError("close_betting not implemented yet")


async def settle_tournament(contract_tournament_id: int, winning_agent_id: int) -> str:
    """
    Settle a tournament on chain with the winning agent.

    Should call: settleTournament(tournamentId, winningAgentId)
    Returns: transaction hash (str)

    TODO: implement.
    """
    raise NotImplementedError("settle_tournament not implemented yet")


async def cancel_tournament(contract_tournament_id: int) -> str:
    """
    Cancel a tournament on chain (enables refunds).

    Should call: cancelTournament(tournamentId)
    Returns: transaction hash (str)

    TODO: implement.
    """
    raise NotImplementedError("cancel_tournament not implemented yet")


# 2) Read-only functions (no transactions, just .call())


async def get_tournament_state(contract_tournament_id: int) -> dict[str, Any]:
    """
    Get tournament state from the contract.

    Should read tournaments[tournamentId] and return:
        - isActive
        - isSettled
        - totalPool
        - winningAgentId
        - agentCount

    TODO: implement when struct layout is confirmed.
    """
    raise NotImplementedError("get_tournament_state not implemented yet")


async def get_agent_pool(contract_tournament_id: int, agent_id: int) -> int:
    """
    Get total pool amount for a specific agent in a tournament.

    Should read: agentPools[tournamentId][agentId]

    TODO: implement.
    """
    raise NotImplementedError("get_agent_pool not implemented yet")


async def get_agent_odds(contract_tournament_id: int, agent_id: int) -> int:
    """
    Get odds for a given agent in a tournament, in basis points.

    Should call: getAgentOdds(tournamentId, agentId)

    TODO: implement.
    """
    raise NotImplementedError("get_agent_odds not implemented yet")