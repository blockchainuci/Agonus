from web3 import Web3
from dotenv import load_dotenv
import os

load_dotenv()

ALCHEMY_URL = os.getenv("ALCHEMY_BASE_RPC")
wallet_1 = os.getenv("WALLET_1_PRIVATE_KEY")
wallet_2 = os.getenv("WALLET_2_PRIVATE_KEY")
wallet_3 = os.getenv("WALLET_3_PRIVATE_KEY")
wallet_4 = os.getenv("WALLET_4_PRIVATE_KEY")

if not ALCHEMY_URL:
    raise RuntimeError("ALCHEMY_BASE_RPC missing in .env")

if not wallet_1:
    raise RuntimeError("Private key for wallet 1 missing in .env")
if not wallet_2:
    raise RuntimeError("Private key for wallet 2 missing in .env")
if not wallet_3:
    raise RuntimeError("Private key for wallet 3 missing in .env")
if not wallet_4:
    raise RuntimeError("Private key for wallet 4 missing in .env")

w3 = Web3(Web3.HTTPProvider(ALCHEMY_URL))
if not w3.is_connected():
    raise RuntimeError("Failed to connect to Base RPC. Check ALCHEMY_BASE_RPC.")

account_1 = w3.eth.account.from_key(wallet_1)
account_2 = w3.eth.account.from_key(wallet_2)
account_3 = w3.eth.account.from_key(wallet_3)
account_4 = w3.eth.account.from_key(wallet_4)