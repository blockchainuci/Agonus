/**
 * simpleSwap.ts - Convenience wrapper around executeSwap()
 *
 * Use this for quick swaps in your agent code without specifying all parameters
 */

import { ethers } from 'ethers'
import { executeSwap } from './swap'
import { USDC_TOKEN, WETH_TOKEN, cbBTC_TOKEN, POOL_FEES, CurrentConfig } from './config'

// Token registry for easy lookup
const TOKENS = {
  USDC: USDC_TOKEN,
  WETH: WETH_TOKEN,
  cbBTC: cbBTC_TOKEN,
}

type TokenSymbol = keyof typeof TOKENS

/**
 * Simple swap helper - just specify tokens and amount
 * Uses Agent 1's wallet and local RPC by default
 */
export async function simpleSwap(params: {
  from: TokenSymbol
  to: TokenSymbol
  amount: string
  agentPrivateKey?: string
  rpcUrl?: string
  slippage?: number
}) {
  const tokenIn = TOKENS[params.from]
  const tokenOut = TOKENS[params.to]

  // Determine fee based on token pair
  let fee: number
  if ((params.from === 'USDC' && params.to === 'WETH') || (params.from === 'WETH' && params.to === 'USDC')) {
    fee = POOL_FEES.WETH_USDC
  } else if ((params.from === 'USDC' && params.to === 'cbBTC') || (params.from === 'cbBTC' && params.to === 'USDC')) {
    fee = POOL_FEES.cbBTC_USDC
  } else {
    throw new Error(`No pool fee defined for ${params.from}/${params.to}`)
  }

  return await executeSwap({
    tokenInAddress: tokenIn.address,
    tokenInDecimals: tokenIn.decimals,
    tokenInSymbol: tokenIn.symbol!,
    tokenOutAddress: tokenOut.address,
    tokenOutDecimals: tokenOut.decimals,
    tokenOutSymbol: tokenOut.symbol!,
    fee,
    amountIn: ethers.parseUnits(params.amount, tokenIn.decimals),
    slippageTolerance: params.slippage || 50, // Default 0.5%
    walletPrivateKey: params.agentPrivateKey || CurrentConfig.wallet.privateKey,
    rpcUrl: params.rpcUrl || CurrentConfig.rpc.local,
  })
}

// Example usage if running directly
if (require.main === module) {
  simpleSwap({
    from: 'USDC',
    to: 'WETH',
    amount: '100',
  })
    .then((result) => {
      console.log('Swap complete!', result)
      process.exit(0)
    })
    .catch((error) => {
      console.error('Error:', error.message)
      process.exit(1)
    })
}
