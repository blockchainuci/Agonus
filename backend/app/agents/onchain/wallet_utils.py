"""
Wallet utility functions for agent wallet management.

Handles wallet generation, encryption, and transaction signing.
"""

from eth_account import Account
from cryptography.fernet import Fernet
import os
from typing import Dict


def generate_wallet() -> Dict[str, str]:
    """
    Generate a new Ethereum wallet with private key and address.

    Returns:
        Dict with 'address' and 'private_key' keys
    """
    account = Account.create()

    # Get private key as bytes, then convert to hex (always 64 chars)
    private_key_bytes = account.key
    private_key_hex = private_key_bytes.hex()

    return {
        "address": account.address,
        "private_key": private_key_hex
    }


def get_encryption_key() -> bytes:
    """
    Get the Fernet encryption key from environment.

    Raises:
        ValueError: If WALLET_ENCRYPTION_KEY not set in environment

    Returns:
        Encryption key as bytes
    """
    encryption_key = os.getenv("WALLET_ENCRYPTION_KEY")

    if not encryption_key:
        new_key = Fernet.generate_key()
        print(f"\n⚠️  WALLET_ENCRYPTION_KEY not found!")
        print(f"Add this to your .env file:")
        print(f"WALLET_ENCRYPTION_KEY={new_key.decode()}\n")
        raise ValueError("WALLET_ENCRYPTION_KEY not set in environment")

    return encryption_key.encode()


def encrypt_private_key(private_key: str) -> str:
    """
    Encrypt a private key for secure database storage.

    Args:
        private_key: Plain private key as hex string

    Returns:
        Encrypted private key as string
    """
    key = get_encryption_key()
    cipher = Fernet(key)
    encrypted = cipher.encrypt(private_key.encode())
    return encrypted.decode()


def decrypt_private_key(encrypted_private_key: str) -> str:
    """
    Decrypt a private key from database storage.

    Args:
        encrypted_private_key: Encrypted private key from database

    Returns:
        Plain private key as hex string
    """
    key = get_encryption_key()
    cipher = Fernet(key)
    decrypted = cipher.decrypt(encrypted_private_key.encode())
    return decrypted.decode()


def private_key_to_address(private_key: str) -> str:
    """
    Derive Ethereum address from a private key.

    Args:
        private_key: Private key as hex string (with or without 0x prefix)

    Returns:
        Ethereum address (0x...)
    """
    # Add 0x prefix if not present
    if not private_key.startswith("0x"):
        private_key = "0x" + private_key

    account = Account.from_key(private_key)
    return account.address


