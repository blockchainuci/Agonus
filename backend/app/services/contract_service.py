from typing import Any, Dict

from eth_account import Account
from web3 import Web3
from web3.exceptions import ContractLogicError, TimeExhausted

from fastapi.concurrency import run_in_threadpool

from backend.app.core.config import settings


# Initialize Web3 and contract
w3 = Web3(Web3.HTTPProvider(settings.RPC_URL))
contract = w3.eth.contract(
    address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
    abi=settings.CONTRACT_ABI,
)
admin_account = Account.from_key(settings.ADMIN_PRIVATE_KEY)


class ContractTransactionError(Exception):
    """Raised when a contract transaction fails."""
    pass


def _build_base_tx() -> Dict[str, Any]:
    """
    Build the base transaction dict (from, nonce, gasPrice, chainId).
    """
    nonce = w3.eth.get_transaction_count(admin_account.address)
    gas_price = w3.eth.gas_price
    return {
        "from": admin_account.address,
        "nonce": nonce,
        "gasPrice": gas_price,
        "chainId": settings.CHAIN_ID,
    }


def _send_tx(fn) -> str:
    """
    Build, sign, send and wait for a contract transaction.

    fn: a contract.functions.<method>(...) object
    Returns the transaction hash as a hex string.
    Raises ContractTransactionError on failure.
    """
    try:
        # Build transaction
        tx = fn.build_transaction(_build_base_tx())

        # Estimate gas
        gas_estimate = w3.eth.estimate_gas(tx)
        tx["gas"] = gas_estimate

        # Sign transaction
        signed = w3.eth.account.sign_transaction(
            tx,
            private_key=settings.ADMIN_PRIVATE_KEY,
        )

        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)

        # Wait for receipt
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        # Check status
        if receipt.status != 1:
            raise ContractTransactionError(
                f"Transaction failed with status=0, hash={tx_hash.hex()}"
            )

        return tx_hash.hex()

    except (ContractLogicError, TimeExhausted) as e:
        # Contract revert or timeout
        raise ContractTransactionError(str(e)) from e
    except Exception as e:
        # Network / nonce / other unexpected issues
        raise ContractTransactionError(str(e)) from e


# 1) Admin write functions


async def create_tournament_on_contract(agent_count: int) -> int:
    """
    Create a tournament on the AgonusBetting contract.

    Calls: createTournament(agentCount)
    Returns: on-chain tournament ID (int)

    NOTE: Right now this returns 0 as a placeholder for the tournament ID,
    because the exact pattern (event vs getter) depends on the ABI details.
    Once you confirm how the contract exposes the new tournamentId,
    update the inner function accordingly.
    """

    def _inner() -> int:
        _send_tx(contract.functions.createTournament(agent_count))
        # TODO: replace this with real logic to fetch the new tournament ID.
        # For example, if the contract has currentTournamentId():
        # new_id = contract.functions.currentTournamentId().call()
        # return int(new_id)
        return 0

    return await run_in_threadpool(_inner)


async def close_betting(contract_tournament_id: int) -> str:
    """
    Close betting for a given tournament on chain.

    Calls: closeBetting(tournamentId)
    Returns: transaction hash (str)
    """

    def _inner() -> str:
        return _send_tx(
            contract.functions.closeBetting(contract_tournament_id)
        )

    return await run_in_threadpool(_inner)


async def settle_tournament(
    contract_tournament_id: int,
    winning_agent_id: int,
) -> str:
    """
    Settle a tournament on chain with the winning agent.

    Calls: settleTournament(tournamentId, winningAgentId)
    Returns: transaction hash (str)
    """

    def _inner() -> str:
        return _send_tx(
            contract.functions.settleTournament(
                contract_tournament_id,
                winning_agent_id,
            )
        )

    return await run_in_threadpool(_inner)


async def cancel_tournament(contract_tournament_id: int) -> str:
    """
    Cancel a tournament on chain (enables refunds).

    Calls: cancelTournament(tournamentId)
    Returns: transaction hash (str)
    """

    def _inner() -> str:
        return _send_tx(
            contract.functions.cancelTournament(contract_tournament_id)
        )

    return await run_in_threadpool(_inner)


# 2) Read-only functions (no transactions, just .call())


async def get_tournament_state(contract_tournament_id: int) -> dict[str, Any]:
    """
    Read tournament struct from the AgonusBetting contract.

    Calls:
        tournaments(tournamentId) -> (
            isActive: bool,
            isSettled: bool,
            totalPool: uint256,
            winningAgentId: uint256,
            agentCount: uint256
        )

    Returns a Python dict with those fields.
    """

    def _inner() -> dict[str, Any]:
        data = contract.functions.tournaments(contract_tournament_id).call()
        return {
            "isActive": data[0],
            "isSettled": data[1],
            "totalPool": int(data[2]),
            "winningAgentId": int(data[3]),
            "agentCount": int(data[4]),
        }

    return await run_in_threadpool(_inner)


async def get_agent_pool(contract_tournament_id: int, agent_id: int) -> int:
    """
    Get total bet amount on a given agent in a given tournament.

    Reads:
        agentPools[tournamentId][agentId]
    """

    def _inner() -> int:
        amount = contract.functions.agentPools(
            contract_tournament_id,
            agent_id,
        ).call()
        return int(amount)

    return await run_in_threadpool(_inner)


async def get_agent_odds(contract_tournament_id: int, agent_id: int) -> int:
    """
    Get odds for a given agent in a tournament, in basis points (1% = 100 bp).

    Calls:
        getAgentOdds(tournamentId, agentId)
    """

    def _inner() -> int:
        odds_bp = contract.functions.getAgentOdds(
            contract_tournament_id,
            agent_id,
        ).call()
        return int(odds_bp)

    return await run_in_threadpool(_inner)
