"""
Uniswap V3 Integration for Base Blockchain
Handles token swaps between USDC and other tokens using exactInputSingle method.
"""

from web3 import Web3
from typing import Dict, Tuple, Optional
import time
from decimal import Decimal
from dotenv import load_dotenv
import os

# Import the initialized web3 instance and accounts
from .web3_client import w3, account_1, account_2, account_3, account_4


load_dotenv()

UNISWAP_V3_ROUTER = os.getenv("UNISWAP_V3_ROUTER")
UNISWAP_V3_QUOTER_V2 = os.getenv("UNISWAP_V3_QUOTER_V2")

# Validate Uniswap contract addresses
if not UNISWAP_V3_ROUTER:
    raise RuntimeError("UNISWAP_V3_ROUTER missing in .env")
if not UNISWAP_V3_QUOTER_V2:
    raise RuntimeError("UNISWAP_V3_QUOTER_V2 missing in .env")

# Token addresses on Base
TOKEN_ADDRESSES = {
    "USDC": os.getenv("USDC_ADDRESS"),  # Native USDC on Base
    "WETH": os.getenv("WETH_ADDRESS"),  # Wrapped ETH on Base
    "CBBTC": os.getenv("cbBTC_ADDRESS")  # Coinbase Wrapped BTC
}

# Validate all token addresses are present
for token_symbol, address in TOKEN_ADDRESSES.items():
    if not address:
        raise RuntimeError(f"{token_symbol}_ADDRESS missing in .env")

# Pool fee tiers (Uniswap V3 supports multiple fee levels)
FEE_TIERS = {
    "LOW": 500,      # 0.05%
    "MEDIUM": 3000,  # 0.3%
    "HIGH": 10000,   # 1%
}
DEFAULT_FEE = FEE_TIERS["MEDIUM"]  # 0.3% is most common

# Slippage tolerance (0.5% = 0.005)
DEFAULT_SLIPPAGE = 0.005  # 0.5%

# Transaction deadline (20 minutes from now)
DEADLINE_SECONDS = 1200

# CONTRACT ABIs 

SWAP_ROUTER_ABI = [
    {
        "inputs": [
            {
                "components": [
                    {"internalType": "address", "name": "tokenIn", "type": "address"},
                    {"internalType": "address", "name": "tokenOut", "type": "address"},
                    {"internalType": "uint24", "name": "fee", "type": "uint24"},
                    {"internalType": "address", "name": "recipient", "type": "address"},
                    {"internalType": "uint256", "name": "deadline", "type": "uint256"},
                    {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
                    {"internalType": "uint256", "name": "amountOutMinimum", "type": "uint256"},
                    {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
                ],
                "internalType": "struct ISwapRouter.ExactInputSingleParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "exactInputSingle",
        "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}],
        "stateMutability": "payable",
        "type": "function"
    }
]

QUOTER_V2_ABI = [
    {
        "inputs": [
            {
                "components": [
                    {"internalType": "address", "name": "tokenIn", "type": "address"},
                    {"internalType": "address", "name": "tokenOut", "type": "address"},
                    {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
                    {"internalType": "uint24", "name": "fee", "type": "uint24"},
                    {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
                ],
                "internalType": "struct IQuoterV2.QuoteExactInputSingleParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "quoteExactInputSingle",
        "outputs": [
            {"internalType": "uint256", "name": "amountOut", "type": "uint256"},
            {"internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160"},
            {"internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32"},
            {"internalType": "uint256", "name": "gasEstimate", "type": "uint256"}
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

ERC20_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": False,
        "inputs": [
            {"name": "_spender", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [
            {"name": "_owner", "type": "address"},
            {"name": "_spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }
]

# CONTRACT INSTANCES

router_contract = w3.eth.contract(address=UNISWAP_V3_ROUTER, abi=SWAP_ROUTER_ABI)
quoter_contract = w3.eth.contract(address=UNISWAP_V3_QUOTER_V2, abi=QUOTER_V2_ABI)


# HELPER FUNCTIONS

def get_account(agent_id: str):
    """Get the web3 account object for a given agent ID."""
    accounts = {
        "agent_1": account_1,
        "agent_2": account_2,
        "agent_3": account_3,
        "agent_4": account_4,
    }
    if agent_id not in accounts:
        raise ValueError(f"Invalid agent_id: {agent_id}")
    return accounts[agent_id]


def get_token_address(token_symbol: str) -> str:
    """Get the contract address for a token symbol."""
    token_symbol = token_symbol.upper()
    if token_symbol not in TOKEN_ADDRESSES:
        raise ValueError(f"Unsupported token: {token_symbol}. Supported: {list(TOKEN_ADDRESSES.keys())}")
    return TOKEN_ADDRESSES[token_symbol]


def get_token_decimals(token_address: str) -> int:
    """Get the decimals for a token (usually 6 for USDC, 18 for most others)."""
    token_contract = w3.eth.contract(address=token_address, abi=ERC20_ABI)
    return token_contract.functions.decimals().call()


def to_token_units(amount: float, decimals: int) -> int:
    """Convert human-readable amount to token units (wei-like)."""
    return int(amount * (10 ** decimals))


def from_token_units(amount: int, decimals: int) -> float:
    """Convert token units to human-readable amount."""
    return float(amount) / (10 ** decimals)


def get_token_balance(token_address: str, wallet_address: str) -> float:
    """Get the balance of a token for a wallet address (in human-readable units)."""
    token_contract = w3.eth.contract(address=token_address, abi=ERC20_ABI)
    decimals = get_token_decimals(token_address)
    balance_raw = token_contract.functions.balanceOf(wallet_address).call()
    return from_token_units(balance_raw, decimals)


# ============================================================================
# APPROVAL FUNCTIONS
# ============================================================================

def check_allowance(token_address: str, owner_address: str, spender_address: str) -> float:
    """Check the current allowance for a spender (in human-readable units)."""
    token_contract = w3.eth.contract(address=token_address, abi=ERC20_ABI)
    decimals = get_token_decimals(token_address)
    allowance_raw = token_contract.functions.allowance(owner_address, spender_address).call()
    return from_token_units(allowance_raw, decimals)


def approve_token(token_address: str, spender_address: str, amount: float, account) -> str:
    """
    Approve a spender to use tokens on behalf of the account.
    Returns transaction hash.
    """
    token_contract = w3.eth.contract(address=token_address, abi=ERC20_ABI)
    decimals = get_token_decimals(token_address)
    amount_raw = to_token_units(amount, decimals)

    # Build transaction
    txn = token_contract.functions.approve(spender_address, amount_raw).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 100000,  # Approval usually needs ~50k gas
        'maxFeePerGas': w3.eth.gas_price,
        'maxPriorityFeePerGas': w3.eth.max_priority_fee,
    })

    # Sign and send
    signed_txn = account.sign_transaction(txn)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)

    # Wait for confirmation
    receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=120)

    if receipt['status'] != 1:
        raise Exception(f"Approval transaction failed: {txn_hash.hex()}")

    return txn_hash.hex()


def ensure_approval(token_address: str, owner_address: str, spender_address: str,
                   required_amount: float, account) -> Optional[str]:
    """
    Check if approval is sufficient, and approve if needed.
    Returns transaction hash if approval was needed, None otherwise.
    """
    current_allowance = check_allowance(token_address, owner_address, spender_address)

    if current_allowance >= required_amount:
        return None  # Already approved

    # Approve with a buffer (2x the required amount to reduce future approvals)
    approval_amount = required_amount * 2
    return approve_token(token_address, spender_address, approval_amount, account)


# ============================================================================
# QUOTE FUNCTIONS
# ============================================================================

def get_quote(token_in_symbol: str, token_out_symbol: str, amount_in: float,
             fee_tier: int = DEFAULT_FEE) -> Tuple[float, Dict]:
    """
    Get a quote for swapping tokens using Uniswap V3 Quoter.

    Parameters
    ----------
    token_in_symbol : str
        Symbol of token to swap from (e.g., "USDC", "ETH")
    token_out_symbol : str
        Symbol of token to swap to
    amount_in : float
        Amount of input token (in human-readable units)
    fee_tier : int
        Pool fee tier (500, 3000, or 10000)

    Returns
    -------
    Tuple[float, Dict]
        (amount_out, metadata) where amount_out is in human-readable units
        metadata includes gas estimate and other info
    """
    token_in_address = get_token_address(token_in_symbol)
    token_out_address = get_token_address(token_out_symbol)

    decimals_in = get_token_decimals(token_in_address)
    decimals_out = get_token_decimals(token_out_address)

    amount_in_raw = to_token_units(amount_in, decimals_in)

    # Call quoter
    params = {
        'tokenIn': token_in_address,
        'tokenOut': token_out_address,
        'amountIn': amount_in_raw,
        'fee': fee_tier,
        'sqrtPriceLimitX96': 0  # No price limit
    }

    try:
        result = quoter_contract.functions.quoteExactInputSingle(params).call()
        amount_out_raw, sqrt_price_after, ticks_crossed, gas_estimate = result

        amount_out = from_token_units(amount_out_raw, decimals_out)

        metadata = {
            'amount_out_raw': amount_out_raw,
            'gas_estimate': gas_estimate,
            'ticks_crossed': ticks_crossed,
            'effective_price': amount_out / amount_in if amount_in > 0 else 0
        }

        return amount_out, metadata

    except Exception as e:
        raise Exception(f"Failed to get quote: {str(e)}")


# ============================================================================
# SWAP FUNCTION
# ============================================================================

def swap_exact_input(
    agent_id: str,
    token_in_symbol: str,
    token_out_symbol: str,
    amount_in: float,
    slippage: float = DEFAULT_SLIPPAGE,
    fee_tier: int = DEFAULT_FEE
) -> Dict:
    """
    Execute a swap using exactInputSingle on Uniswap V3.
    Handles approvals automatically.

    Parameters
    ----------
    agent_id : str
        Agent identifier (e.g., "agent_1")
    token_in_symbol : str
        Symbol of token to swap from (e.g., "USDC" for buy, "ETH" for sell)
    token_out_symbol : str
        Symbol of token to swap to
    amount_in : float
        Amount of input token to swap (in human-readable units)
    slippage : float
        Slippage tolerance (e.g., 0.005 = 0.5%)
    fee_tier : int
        Pool fee tier (default: 3000 = 0.3%)

    Returns
    -------
    Dict
        {
            'tx_hash': transaction hash,
            'amount_in': actual amount swapped in,
            'amount_out': actual amount received,
            'token_in': input token symbol,
            'token_out': output token symbol,
            'gas_used': gas used,
            'effective_price': price per unit
        }
    """
    account = get_account(agent_id)

    token_in_address = get_token_address(token_in_symbol)
    token_out_address = get_token_address(token_out_symbol)

    decimals_in = get_token_decimals(token_in_address)
    decimals_out = get_token_decimals(token_out_address)

    # 1. Get quote to calculate minimum output
    amount_out_expected, quote_metadata = get_quote(
        token_in_symbol, token_out_symbol, amount_in, fee_tier
    )

    # 2. Calculate minimum output with slippage protection
    amount_out_minimum = amount_out_expected * (1 - slippage)

    # 3. Check balance (allow for tiny floating point precision errors)
    balance = get_token_balance(token_in_address, account.address)
    if balance < amount_in * 0.9999:  # Allow 0.01% tolerance for precision
        raise ValueError(
            f"Insufficient balance. Have {balance} {token_in_symbol}, need {amount_in}"
        )

    # 4. Ensure approval
    approval_txn = ensure_approval(
        token_in_address,
        account.address,
        UNISWAP_V3_ROUTER,
        amount_in,
        account
    )
    if approval_txn:
        print(f"Approved {token_in_symbol} for router: {approval_txn}")

    # 5. Build swap transaction
    amount_in_raw = to_token_units(amount_in, decimals_in)
    amount_out_min_raw = to_token_units(amount_out_minimum, decimals_out)

    deadline = int(time.time()) + DEADLINE_SECONDS

    swap_params = {
        'tokenIn': token_in_address,
        'tokenOut': token_out_address,
        'fee': fee_tier,
        'recipient': account.address,
        'deadline': deadline,
        'amountIn': amount_in_raw,
        'amountOutMinimum': amount_out_min_raw,
        'sqrtPriceLimitX96': 0
    }

    # Build transaction
    swap_txn = router_contract.functions.exactInputSingle(swap_params).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': int(quote_metadata['gas_estimate'] * 1.2),  # Add 20% buffer to gas estimate
        'maxFeePerGas': w3.eth.gas_price,
        'maxPriorityFeePerGas': w3.eth.max_priority_fee,
        'value': 0  # No ETH sent (for ERC20 swaps)
    })

    # 6. Sign and send
    signed_swap = account.sign_transaction(swap_txn)
    txn_hash = w3.eth.send_raw_transaction(signed_swap.raw_transaction)

    print(f"Swap transaction sent: {txn_hash.hex()}")

    # 7. Wait for confirmation
    receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=120)

    if receipt['status'] != 1:
        raise Exception(f"Swap transaction failed: {txn_hash.hex()}")

    # 8. Get actual amount out from logs (optional - could parse logs for exact amount)
    # For now, we'll use the expected amount as the actual
    amount_out_actual = amount_out_expected  # In production, parse logs for exact amount

    # 9. Return result
    result = {
        'tx_hash': txn_hash.hex(),
        'amount_in': amount_in,
        'amount_out': amount_out_actual,
        'token_in': token_in_symbol,
        'token_out': token_out_symbol,
        'gas_used': receipt['gasUsed'],
        'effective_price': amount_out_actual / amount_in if amount_in > 0 else 0,
        'block_number': receipt['blockNumber']
    }

    print(f"Swap successful! {amount_in} {token_in_symbol} → {amount_out_actual} {token_out_symbol}")

    return result


# ============================================================================
# CONVENIENCE FUNCTIONS FOR BUY/SELL
# ============================================================================

def buy_token_with_usdc(agent_id: str, token_symbol: str, usdc_amount: float) -> Dict:
    """
    Buy a token using USDC (USDC → Token swap).

    Parameters
    ----------
    agent_id : str
        Agent identifier
    token_symbol : str
        Token to buy (e.g., "ETH", "WETH")
    usdc_amount : float
        Amount of USDC to spend

    Returns
    -------
    Dict
        Swap result with transaction details
    """
    return swap_exact_input(agent_id, "USDC", token_symbol, usdc_amount)


def sell_token_for_usdc(agent_id: str, token_symbol: str, token_amount: float) -> Dict:
    """
    Sell a token for USDC (Token → USDC swap).

    Parameters
    ----------
    agent_id : str
        Agent identifier
    token_symbol : str
        Token to sell (e.g., "ETH", "WETH")
    token_amount : float
        Amount of token to sell

    Returns
    -------
    Dict
        Swap result with transaction details
    """
    return swap_exact_input(agent_id, token_symbol, "USDC", token_amount)
