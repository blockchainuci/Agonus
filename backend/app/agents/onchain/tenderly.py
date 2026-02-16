"""
Tenderly RPC integration for Virtual TestNet wallet funding.

Uses Tenderly's JSON-RPC API to fund wallets with ETH and ERC-20 tokens.
"""

import os
import requests


# Base mainnet token addresses
USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
WETH_ADDRESS = "0x4200000000000000000000000000000000000006"
CBBTC_ADDRESS = "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf"


def get_rpc_url() -> str:
    """Get Tenderly Virtual TestNet RPC URL from environment."""
    rpc_url = os.getenv("RPC_URL")
    if not rpc_url:
        raise ValueError("RPC_URL not set in environment")
    return rpc_url


def fund_wallet_with_eth(wallet_address: str, amount_eth: float = 10.0) -> dict:
    """
    Fund a wallet with native ETH on Tenderly Virtual TestNet.

    Args:
        wallet_address: The wallet address to fund (0x...)
        amount_eth: Amount of ETH to send (default 10.0)

    Returns:
        Response dict with success status
    """
    rpc_url = get_rpc_url()

    # Convert ETH to Wei (1 ETH = 10^18 Wei)
    amount_wei = int(amount_eth * 10**18)

    payload = {
        "jsonrpc": "2.0",
        "method": "tenderly_setBalance",
        "params": [[wallet_address], hex(amount_wei)],
        "id": "1"
    }

    response = requests.post(rpc_url, json=payload, headers={"Content-Type": "application/json"})

    if response.status_code == 200:
        print(f"Funded {wallet_address} with {amount_eth} ETH")
        return {"success": True, "amount": amount_eth, "address": wallet_address}
    else:
        print(f"Failed to fund wallet: {response.status_code} - {response.text}")
        response.raise_for_status()


def fund_wallet_with_token(
    wallet_address: str,
    token_address: str,
    amount: float,
    decimals: int = 6
) -> dict:
    """
    Fund a wallet with ERC-20 tokens on Tenderly Virtual TestNet.

    Args:
        wallet_address: The wallet address to fund (0x...)
        token_address: The token contract address (0x...)
        amount: Amount of tokens (human readable, e.g., 1000 for 1000 USDC)
        decimals: Token decimals (USDC=6, WETH=18, CBBTC=8)

    Returns:
        Response dict with success status
    """
    rpc_url = get_rpc_url()

    # Convert amount to smallest unit (e.g., 1000 USDC -> 1000000000 for 6 decimals)
    amount_smallest_unit = int(amount * 10**decimals)

    payload = {
        "jsonrpc": "2.0",
        "method": "tenderly_setErc20Balance",
        "params": [token_address, wallet_address, hex(amount_smallest_unit)],
        "id": "1"
    }

    response = requests.post(rpc_url, json=payload, headers={"Content-Type": "application/json"})

    if response.status_code == 200:
        print(f"Funded {wallet_address} with {amount} tokens")
        return {
            "success": True,
            "amount": amount,
            "token": token_address,
            "recipient": wallet_address
        }
    else:
        print(f"Failed to fund wallet with tokens: {response.status_code} - {response.text}")
        response.raise_for_status()


def fund_wallet_with_usdc(wallet_address: str, amount_usdc: float = 10000.0) -> dict:
    """
    Fund a wallet with USDC on Tenderly Virtual TestNet.

    Args:
        wallet_address: The wallet address to fund (0x...)
        amount_usdc: Amount of USDC (default 10,000)

    Returns:
        Response dict with success status
    """
    return fund_wallet_with_token(
        wallet_address=wallet_address,
        token_address=USDC_ADDRESS,
        amount=amount_usdc,
        decimals=6  # USDC has 6 decimals
    )


def reset_wallet_balance(wallet_address: str, usdc_amount: float = 10000.0, eth_amount: float = 1.0) -> dict:
    """
    Reset a wallet's balance back to initial amounts.

    Useful for testing - resets both ETH and USDC to starting values.

    Args:
        wallet_address: The wallet address to reset (0x...)
        usdc_amount: USDC amount to reset to (default 10,000)
        eth_amount: ETH amount to reset to (default 1.0)

    Returns:
        Dict with reset results
    """
    return setup_agent_wallet(wallet_address, usdc_amount, eth_amount)


def setup_agent_wallet(wallet_address: str, initial_usdc: float = 10000.0, initial_eth: float = 1.0) -> dict:
    """
    Complete wallet setup: fund with both ETH (for gas) and USDC (for trading).

    Args:
        wallet_address: The wallet address to setup (0x...)
        initial_usdc: Starting USDC balance (default 10,000)
        initial_eth: Starting ETH balance for gas (default 1.0)

    Returns:
        Dict with funding results
    """
    print(f"Setting up wallet: {wallet_address}")

    try:
        # Fund with ETH for gas fees
        eth_result = fund_wallet_with_eth(wallet_address, initial_eth)

        # Fund with USDC for trading
        usdc_result = fund_wallet_with_usdc(wallet_address, initial_usdc)

        print(f"Wallet setup complete!")
        print(f"   ETH: {initial_eth}")
        print(f"   USDC: {initial_usdc}")

        return {
            "success": True,
            "wallet": wallet_address,
            "eth_funded": eth_result,
            "usdc_funded": usdc_result
        }

    except Exception as e:
        print(f"Failed to setup wallet: {str(e)}")
        raise
