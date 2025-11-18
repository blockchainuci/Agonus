"""
Setup script to convert ETH → WETH → USDC for tournament testing.

Usage: python backend/tests/setup_wallets.py
"""

from app.agents.onchain import uniswap_client


# WETH contract ABI for deposit function
WETH_ABI = [
    {
        "constant": False,
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "payable": True,
        "stateMutability": "payable",
        "type": "function"
    }
]


def wrap_eth_to_weth(agent_id: str, eth_amount: float) -> str:
    """
    Wrap native ETH to WETH by depositing into WETH contract.

    Args:
        agent_id: Agent identifier
        eth_amount: Amount of ETH to wrap (in human-readable units)

    Returns:
        Transaction hash
    """
    account = uniswap_client.get_account(agent_id)
    weth_address = uniswap_client.TOKEN_ADDRESSES["WETH"]
    weth_contract = uniswap_client.w3.eth.contract(address=weth_address, abi=WETH_ABI)

    eth_amount_wei = uniswap_client.w3.to_wei(eth_amount, 'ether')

    # Build deposit transaction (sends ETH, receives WETH)
    txn = weth_contract.functions.deposit().build_transaction({
        'from': account.address,
        'value': eth_amount_wei,
        'nonce': uniswap_client.w3.eth.get_transaction_count(account.address),
        'gas': 50000,
        'maxFeePerGas': uniswap_client.w3.eth.gas_price,
        'maxPriorityFeePerGas': uniswap_client.w3.eth.max_priority_fee,
    })

    signed_txn = account.sign_transaction(txn)
    txn_hash = uniswap_client.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    receipt = uniswap_client.w3.eth.wait_for_transaction_receipt(txn_hash, timeout=120)

    if receipt['status'] != 1:
        raise Exception(f"Wrapping failed: {txn_hash.hex()}")

    return txn_hash.hex()


def setup_agent_wallet(agent_id: str, target_usdc: float = 500.0, gas_reserve: float = 0.01):
    """
    Convert ETH to USDC for an agent wallet.

    Steps:
    1. Check current balances
    2. Wrap ETH → WETH
    3. Swap WETH → USDC

    Args:
        agent_id: Agent identifier
        target_usdc: Target USDC balance
        gas_reserve: ETH to keep for gas fees
    """
    account = uniswap_client.get_account(agent_id)

    # Get current balances
    eth_balance = uniswap_client.w3.eth.get_balance(account.address)
    eth_balance_human = float(uniswap_client.w3.from_wei(eth_balance, 'ether'))

    usdc_balance = uniswap_client.get_token_balance(
        uniswap_client.TOKEN_ADDRESSES["USDC"],
        account.address
    )

    weth_balance = uniswap_client.get_token_balance(
        uniswap_client.TOKEN_ADDRESSES["WETH"],
        account.address
    )

    print(f"\n{agent_id} ({account.address})")
    print(f"Current: {eth_balance_human:.4f} ETH, {weth_balance:.4f} WETH, {usdc_balance:.2f} USDC")

    if usdc_balance >= target_usdc:
        print(f"Already has sufficient USDC")
        return

    # Estimate WETH needed for target USDC
    try:
        # Get quote to estimate how much WETH needed
        test_weth = 0.2
        usdc_output, _ = uniswap_client.get_quote("WETH", "USDC", test_weth)
        weth_needed = (target_usdc / usdc_output) * test_weth * 1.02  # 2% buffer

        print(f"Need ~{weth_needed:.4f} WETH to get {target_usdc} USDC")

        # Check if we have enough ETH
        gas_reserve_wei = uniswap_client.w3.to_wei(gas_reserve, 'ether')
        weth_needed_wei = uniswap_client.w3.to_wei(weth_needed, 'ether')

        if eth_balance < (weth_needed_wei + gas_reserve_wei):
            print(f"ERROR: Need {weth_needed + gas_reserve:.4f} ETH, have {eth_balance_human:.4f}")
            return

        # Step 1: Wrap ETH → WETH
        print(f"\nStep 1: Wrapping {weth_needed:.4f} ETH → WETH")
        wrap_tx = wrap_eth_to_weth(agent_id, weth_needed)
        print(f"Wrapped: https://basescan.org/tx/{wrap_tx}")

        # Verify WETH balance
        new_weth_balance = uniswap_client.get_token_balance(
            uniswap_client.TOKEN_ADDRESSES["WETH"],
            account.address
        )
        print(f"WETH balance: {new_weth_balance:.4f}")

        # Step 2: Swap WETH → USDC
        print(f"\nStep 2: Swapping {weth_needed:.4f} WETH → USDC")
        swap_result = uniswap_client.sell_token_for_usdc(
            agent_id=agent_id,
            token_symbol="WETH",
            token_amount=weth_needed
        )

        print(f"Swapped: https://basescan.org/tx/{swap_result['tx_hash']}")
        print(f"Received: {swap_result['amount_out']:.2f} USDC")

        # Final balances
        final_eth = uniswap_client.w3.eth.get_balance(account.address)
        final_eth_human = float(uniswap_client.w3.from_wei(final_eth, 'ether'))
        final_weth = uniswap_client.get_token_balance(
            uniswap_client.TOKEN_ADDRESSES["WETH"],
            account.address
        )
        final_usdc = uniswap_client.get_token_balance(
            uniswap_client.TOKEN_ADDRESSES["USDC"],
            account.address
        )

        print(f"\nFinal: {final_eth_human:.4f} ETH, {final_weth:.4f} WETH, {final_usdc:.2f} USDC")

    except Exception as e:
        print(f"ERROR: {e}")
        raise


def main():
    """Setup all agent wallets"""
    print("="*60)
    print("WALLET SETUP: ETH → WETH → USDC")
    print("="*60)

    agents_to_setup = ["agent_1"]

    for agent_id in agents_to_setup:
        setup_agent_wallet(agent_id, target_usdc=500.0)

    print("\n" + "="*60)
    print("Setup complete")
    print("="*60)


if __name__ == "__main__":
    main()
