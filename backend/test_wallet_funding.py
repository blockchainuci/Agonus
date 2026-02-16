"""
Test wallet generation and Tenderly funding.
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.agents.onchain.wallet_utils import (
    generate_wallet,
    encrypt_private_key,
    decrypt_private_key,
    private_key_to_address
)
from app.agents.onchain.tenderly import setup_agent_wallet


def main():
    print("Generating new wallet...")
    wallet = generate_wallet()
    print(f"Address: {wallet['address']}")

    print("\nTesting encryption...")
    encrypted = encrypt_private_key(wallet['private_key'])
    decrypted = decrypt_private_key(encrypted)
    assert decrypted == wallet['private_key']
    print("Encryption works")

    print("\nVerifying address derivation...")
    derived_address = private_key_to_address(wallet['private_key'])
    print(f"Original: {wallet['address']}")
    print(f"Derived:  {derived_address}")
    assert derived_address == wallet['address']
    print("Address derivation works")

    print("\nFunding wallet via Tenderly (5000 USDC, 1 ETH)...")
    result = setup_agent_wallet(
        wallet_address=wallet['address'],
        initial_usdc=5000.0,
        initial_eth=1.0
    )

    print(f"\nVerify on Tenderly Dashboard:")
    print(f"https://dashboard.tenderly.co/{os.getenv('TENDERLY_ACCOUNT_SLUG')}/{os.getenv('TENDERLY_PROJECT_SLUG')}/vnets")
    print(f"Search for wallet: {wallet['address']}")
    print(f"\nSave for next test:")
    print(f"WALLET_ADDRESS={wallet['address']}")
    print(f"WALLET_PRIVATE_KEY={wallet['private_key']}")


if __name__ == "__main__":
    main()
