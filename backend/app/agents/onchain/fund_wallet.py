"""
Fund agent wallets with ETH and USDC for testing on Anvil local fork.

This script uses Anvil's special RPC methods to:
1. Set ETH balance directly
2. Impersonate a USDC whale account
3. Transfer USDC to agent wallets

Prerequisites:
- Anvil fork running: anvil --fork-url https://mainnet.base.org --chain-id 8453 --auto-impersonate

Usage:
    python -m app.agents.onchain.fund_wallet agent_1
    python -m app.agents.onchain.fund_wallet agent_1 agent_2
"""

import sys
import os
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

# Base Mainnet addresses
USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
WETH_ADDRESS = "0x4200000000000000000000000000000000000006"
CBBTC_ADDRESS = "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf"

# USDC whale on Base with large balance
USDC_WHALE = "0x20FE51A9229EEf2cF8Ad9E89d91CAb9312cF3b7A"

# ERC20 ABI (minimal)
ERC20_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": False,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    }
]


def fund_agent_wallet(agent_id: str, rpc_url: str = "http://127.0.0.1:8545"):
    """
    Fund an agent wallet with ETH and USDC for testing.

    Args:
        agent_id: Agent identifier (e.g., "agent_1")
        rpc_url: Anvil RPC URL (default: http://127.0.0.1:8545)
    """
    # Get agent address from environment
    address_var = f"{agent_id.upper()}_ADDRESS"
    agent_address = os.getenv(address_var)

    if not agent_address:
        raise ValueError(f"Missing environment variable: {address_var}")

    print(f"\n{'='*60}")
    print(f"Funding {agent_id}: {agent_address}")
    print(f"{'='*60}\n")

    # Connect to Anvil
    w3 = Web3(Web3.HTTPProvider(rpc_url))

    if not w3.is_connected():
        raise ConnectionError(f"Failed to connect to Anvil at {rpc_url}")

    print(f"✓ Connected to Anvil (Chain ID: {w3.eth.chain_id})")

    # 1. Fund with ETH for gas fees
    eth_amount = w3.to_wei(10, 'ether')
    w3.provider.make_request(
        'anvil_setBalance',
        [agent_address, hex(eth_amount)]
    )

    eth_balance = w3.eth.get_balance(agent_address)
    print(f"✓ Set ETH balance: {w3.from_wei(eth_balance, 'ether')} ETH")

    # 2. Fund with USDC using whale impersonation
    usdc_contract = w3.eth.contract(
        address=Web3.to_checksum_address(USDC_ADDRESS),
        abi=ERC20_ABI
    )

    # Impersonate whale
    w3.provider.make_request('anvil_impersonateAccount', [USDC_WHALE])

    # Transfer USDC from whale to agent
    usdc_amount = 1000 * (10 ** 6)  # 1000 USDC (6 decimals)

    tx_hash = usdc_contract.functions.transfer(
        Web3.to_checksum_address(agent_address),
        usdc_amount
    ).transact({'from': USDC_WHALE})

    # Wait for transaction
    w3.eth.wait_for_transaction_receipt(tx_hash)

    # Stop impersonating
    w3.provider.make_request('anvil_stopImpersonatingAccount', [USDC_WHALE])

    # Check final USDC balance
    usdc_balance = usdc_contract.functions.balanceOf(
        Web3.to_checksum_address(agent_address)
    ).call()

    print(f"✓ Transferred USDC: {usdc_balance / (10 ** 6)} USDC")

    # 3. Optionally fund with some WETH for testing SELL trades
    weth_contract = w3.eth.contract(
        address=Web3.to_checksum_address(WETH_ADDRESS),
        abi=ERC20_ABI
    )

    # WETH whale on Base
    WETH_WHALE = "0x4200000000000000000000000000000000000006"  # WETH contract itself has balance

    # For simplicity, we'll skip WETH funding since users can BUY it with USDC
    # But you could add similar impersonation logic here if needed

    weth_balance = weth_contract.functions.balanceOf(
        Web3.to_checksum_address(agent_address)
    ).call()

    print(f"✓ WETH balance: {w3.from_wei(weth_balance, 'ether')} WETH")

    print(f"\n{'='*60}")
    print(f"✅ Funding complete for {agent_id}")
    print(f"{'='*60}\n")

    return {
        'eth_balance': eth_balance,
        'usdc_balance': usdc_balance,
        'weth_balance': weth_balance
    }


def main():
    """Fund wallets for all agents specified in command line args."""
    if len(sys.argv) < 2:
        print("Usage: python -m app.agents.onchain.fund_wallet <agent_id> [agent_id2 ...]")
        print("Example: python -m app.agents.onchain.fund_wallet agent_1 agent_2")
        sys.exit(1)

    rpc_url = os.getenv("RPC_LOCAL", "http://127.0.0.1:8545")

    print(f"\n🚀 Starting wallet funding on Anvil fork...")
    print(f"RPC URL: {rpc_url}\n")

    for agent_id in sys.argv[1:]:
        try:
            fund_agent_wallet(agent_id, rpc_url)
        except Exception as e:
            print(f"❌ Failed to fund {agent_id}: {e}")
            continue

    print("\n✅ All done!\n")


if __name__ == "__main__":
    main()
