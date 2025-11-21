from web3 import Web3
from eth_account import Account

# Initialize
w3 = Web3(Web3.HTTPProvider(settings.RPC_URL))
contract = w3.eth.contract(
    address=settings.CONTRACT_ADDRESS,
    abi=settings.CONTRACT_ABI
)
admin_account = Account.from_key(settings.ADMIN_PRIVATE_KEY)