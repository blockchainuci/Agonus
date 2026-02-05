import json
import os
from dataclasses import dataclass
from typing import Any, Optional

from web3 import Web3
from web3.contract import Contract
from eth_account import Account


@dataclass
class TxResult:
    tx_hash: str
    contract_tournament_id: Optional[int] = None


class AgonusBettingClient:
    def __init__(
        self,
        rpc_url: str,
        private_key: str,
        contract_address: str,
        abi_path: str,
        chain_id: Optional[int] = None,
    ) -> None:
        if not rpc_url:
            raise ValueError("RPC URL is required")
        if not private_key:
            raise ValueError("Private key is required")
        if not contract_address:
            raise ValueError("Contract address is required")

        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not self.w3.is_connected():
            raise ConnectionError("Failed to connect to RPC")

        self.account = Account.from_key(private_key)
        self.chain_id = chain_id or int(os.getenv("CHAIN_ID", "0")) or self.w3.eth.chain_id
        self.contract = self._load_contract(contract_address, abi_path)

    def _load_contract(self, contract_address: str, abi_path: str) -> Contract:
        with open(abi_path, "r", encoding="utf-8") as f:
            abi = json.load(f)
        return self.w3.eth.contract(
            address=Web3.to_checksum_address(contract_address),
            abi=abi,
        )

    def _build_tx(self, fn) -> dict[str, Any]:
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        tx = fn.build_transaction(
            {
                "from": self.account.address,
                "nonce": nonce,
                "chainId": self.chain_id,
            }
        )

        # EIP-1559 style fees
        max_fee = self.w3.eth.gas_price
        max_priority = self.w3.eth.max_priority_fee
        tx["maxFeePerGas"] = max_fee
        tx["maxPriorityFeePerGas"] = max_priority
        tx["gas"] = self.w3.eth.estimate_gas(tx)
        return tx

    def _send_tx(self, fn) -> str:
        tx = self._build_tx(fn)
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return tx_hash.hex()

    def _wait_receipt(self, tx_hash: str) -> Any:
        return self.w3.eth.wait_for_transaction_receipt(tx_hash)

    def create_tournament(self, agent_count: int) -> TxResult:
        tx_hash = self._send_tx(self.contract.functions.createTournament(agent_count))
        receipt = self._wait_receipt(tx_hash)
        created = self.contract.events.TournamentCreated().process_receipt(receipt)
        tournament_id = created[0]["args"]["tournamentId"] if created else None
        return TxResult(tx_hash=tx_hash, contract_tournament_id=tournament_id)

    def close_betting(self, tournament_id: int) -> TxResult:
        tx_hash = self._send_tx(self.contract.functions.closeBetting(tournament_id))
        return TxResult(tx_hash=tx_hash)

    def settle_tournament(self, tournament_id: int, winning_agent_id: int) -> TxResult:
        tx_hash = self._send_tx(
            self.contract.functions.settleTournament(tournament_id, winning_agent_id)
        )
        return TxResult(tx_hash=tx_hash)

    def cancel_tournament(self, tournament_id: int) -> TxResult:
        tx_hash = self._send_tx(self.contract.functions.cancelTournament(tournament_id))
        return TxResult(tx_hash=tx_hash)


def get_agonus_client() -> AgonusBettingClient:
    rpc_url = os.getenv("SEPOLIA_RPC_URL") or os.getenv("RPC_URL", "")
    private_key = os.getenv("SEPOLIA_PRIVATE_KEY") or os.getenv("PRIVATE_KEY", "")
    contract_address = os.getenv("CONTRACT_ADDRESS", "")
    abi_path = os.path.join(
        os.path.dirname(__file__), "abi", "AgonusBetting.json"
    )
    return AgonusBettingClient(
        rpc_url=rpc_url,
        private_key=private_key,
        contract_address=contract_address,
        abi_path=abi_path,
    )
