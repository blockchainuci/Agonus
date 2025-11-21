import { ethers } from 'ethers'
import { QUOTER_CONTRACT_ADDRESS } from './constants'

// QuoterV2 ABI - only what we need
const QUOTER_ABI = [
  'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)'
]

export interface QuoteParams {
  tokenIn: string
  tokenOut: string
  amountIn: bigint
  fee: number
  rpcUrl: string
}

export async function getQuote(params: QuoteParams): Promise<bigint> {
  const provider = new ethers.JsonRpcProvider(params.rpcUrl)
  const quoter = new ethers.Contract(QUOTER_CONTRACT_ADDRESS, QUOTER_ABI, provider) as any

  const quoteParams = {
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    fee: params.fee,
    sqrtPriceLimitX96: 0
  }

  const [amountOut] = await quoter.quoteExactInputSingle.staticCall(quoteParams)
  return amountOut
}
