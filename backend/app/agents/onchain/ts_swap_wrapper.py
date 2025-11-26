"""
Python wrapper for executing TypeScript-based Uniswap swaps.

This module provides a bridge to the working TypeScript swap implementation
that uses ethers.js and the Uniswap SDK.
"""

import os
import json
import subprocess
from typing import Dict, Literal


def execute_ts_swap(
    agent_id: str,
    from_token: Literal["USDC", "WETH", "CBBTC"],
    to_token: Literal["USDC", "WETH", "CBBTC"],
    amount: float,
    slippage: int = 50
) -> Dict[str, any]:
    """
    Execute a swap using the TypeScript implementation.

    Args:
        agent_id: Agent identifier (e.g., "agent_1")
        from_token: Source token symbol
        to_token: Destination token symbol
        amount: Amount to swap (in token units, not wei)
        slippage: Slippage tolerance in basis points (default: 50 = 0.5%)

    Returns:
        Dict with:
            - tx_hash: Transaction hash
            - amount_out: Output amount received (as string)

    Raises:
        ValueError: If swap fails
    """
    # Get agent private key from env
    private_key_var = f"{agent_id.upper()}_PRIVATE_KEY"
    agent_private_key = os.getenv(private_key_var)

    if not agent_private_key:
        raise ValueError(f"Missing environment variable: {private_key_var}")

    # Get RPC URL (prioritize RPC_URL for testnet/mainnet, fallback to RPC_LOCAL for local dev)
    rpc_url = os.getenv("RPC_URL") or os.getenv("RPC_LOCAL", "http://127.0.0.1:8545")

    # Map Python token names to TypeScript token names
    # Python uses "CBBTC" but TypeScript uses "cbBTC"
    token_mapping = {
        "USDC": "USDC",
        "WETH": "WETH",
        "CBBTC": "cbBTC"
    }

    ts_from_token = token_mapping.get(from_token, from_token)
    ts_to_token = token_mapping.get(to_token, to_token)

    # Create TypeScript code to execute the swap
    ts_code = f"""
import {{ simpleSwap }} from './simpleSwap';

async function main() {{
  try {{
    const result = await simpleSwap({{
      from: '{ts_from_token}',
      to: '{ts_to_token}',
      amount: '{amount}',
      agentPrivateKey: '{agent_private_key}',
      rpcUrl: '{rpc_url}',
      slippage: {slippage}
    }});

    console.log(JSON.stringify({{
      success: true,
      txHash: result.txHash,
      amountOut: result.amountOut.toString()
    }}));
  }} catch (error) {{
    console.log(JSON.stringify({{
      success: false,
      error: error.message
    }}));
    process.exit(1);
  }}
}}

main();
"""

    # Write temporary TS file
    trading_bot_dir = os.path.join(
        os.path.dirname(__file__),
        "..", "..", "..", "trading-bot"
    )
    temp_file = os.path.join(trading_bot_dir, "temp_swap.ts")

    try:
        with open(temp_file, "w") as f:
            f.write(ts_code)

        # Execute with ts-node
        result = subprocess.run(
            ["npx", "ts-node", temp_file],
            cwd=trading_bot_dir,
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode != 0:
            # Try to parse error from stderr
            try:
                error_lines = result.stderr.strip().split('\n')
                for line in reversed(error_lines):
                    if line.startswith('{'):
                        error_data = json.loads(line)
                        raise ValueError(f"Swap failed: {error_data.get('error', 'Unknown error')}")
            except json.JSONDecodeError:
                raise ValueError(f"Swap failed: {result.stderr}")

        # Parse successful output
        output_lines = result.stdout.strip().split('\n')
        for line in reversed(output_lines):
            if line.startswith('{'):
                data = json.loads(line)
                if data.get('success'):
                    return {
                        'tx_hash': data['txHash'],
                        'amount_out': data['amountOut']
                    }
                elif data.get('success') == False:
                    # Handle explicit failure with error message
                    raise ValueError(f"Swap failed: {data.get('error', 'Unknown error')}")

        # If we get here, parsing failed - provide helpful error
        error_details = f"Could not parse swap result.\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
        raise ValueError(error_details)

    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)
