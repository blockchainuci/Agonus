"""
Python-native swap implementation using uniswap-python library.

This module provides direct Python integration with Uniswap V3 on Base,
replacing the previous TypeScript wrapper approach for cleaner, more
maintainable code.
"""

import os
from typing import Dict, Literal
from uniswap import Uniswap


# Base Mainnet Chain ID
CHAIN_ID = 8453

# Token addresses on Base
TOKEN_ADDRESSES = {
    "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "WETH": "0x4200000000000000000000000000000000000006",
    "CBBTC": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
}

# Token decimals
TOKEN_DECIMALS = {
    "USDC": 6,
    "WETH": 18,
    "CBBTC": 8,
}

# Pool fees in basis points (500 = 0.05%)
POOL_FEES = {
    ("USDC", "WETH"): 500,
    ("WETH", "USDC"): 500,
    ("USDC", "CBBTC"): 500,
    ("CBBTC", "USDC"): 500,
}


def execute_swap(
    agent_id: str,
    from_token: Literal["USDC", "WETH", "CBBTC"],
    to_token: Literal["USDC", "WETH", "CBBTC"],
    amount: float,
    slippage: int = 50
) -> Dict[str, any]:
    """
    Execute a swap using the uniswap-python library.

    Args:
        agent_id: Agent identifier (e.g., "agent_1")
        from_token: Source token symbol
        to_token: Destination token symbol
        amount: Amount to swap (in token units, not wei)
        slippage: Slippage tolerance in basis points (default: 50 = 0.5%)

    Returns:
        Dict with:
            - tx_hash: Transaction hash
            - amount_out: Output amount received (as string in wei)

    Raises:
        ValueError: If swap fails or invalid parameters provided
    """
    # Get agent private key from env
    private_key_var = f"{agent_id.upper()}_PRIVATE_KEY"
    agent_private_key = os.getenv(private_key_var)

    if not agent_private_key:
        raise ValueError(f"Missing environment variable: {private_key_var}")

    # Get agent address
    address_var = f"{agent_id.upper()}_ADDRESS"
    agent_address = os.getenv(address_var)

    if not agent_address:
        raise ValueError(f"Missing environment variable: {address_var}")

    # Get RPC URL
    rpc_url = os.getenv("RPC_LOCAL", "http://127.0.0.1:8545")

    # Validate tokens
    from_token = from_token.upper()
    to_token = to_token.upper()

    if from_token not in TOKEN_ADDRESSES:
        raise ValueError(f"Unsupported from_token: {from_token}")
    if to_token not in TOKEN_ADDRESSES:
        raise ValueError(f"Unsupported to_token: {to_token}")
    if from_token == to_token:
        raise ValueError("from_token and to_token must be different")

    # Get token addresses
    from_address = TOKEN_ADDRESSES[from_token]
    to_address = TOKEN_ADDRESSES[to_token]

    # Get pool fee
    fee_key = (from_token, to_token)
    if fee_key not in POOL_FEES:
        raise ValueError(f"No pool fee defined for {from_token}/{to_token}")
    fee = POOL_FEES[fee_key]

    try:
        # Initialize Uniswap instance with V3
        uniswap = Uniswap(
            address=agent_address,
            private_key=agent_private_key,
            version=3,
            provider=rpc_url,
            web3=None  # Let the library create the web3 instance
        )

        # Convert amount to wei
        from_decimals = TOKEN_DECIMALS[from_token]
        amount_in_wei = int(amount * (10 ** from_decimals))

        # Execute the swap using make_trade
        # For V3, we need to specify the fee parameter
        tx_hash = uniswap.make_trade(
            from_address,
            to_address,
            amount_in_wei,
            fee=fee
        )

        # Get the amount out by checking the price
        # The uniswap library doesn't return amount_out directly from make_trade
        amount_out_estimate = uniswap.get_price_input(
            from_address,
            to_address,
            amount_in_wei,
            fee=fee
        )

        return {
            'tx_hash': tx_hash,
            'amount_out': str(amount_out_estimate)
        }

    except Exception as e:
        raise ValueError(f"Swap failed: {str(e)}") from e
