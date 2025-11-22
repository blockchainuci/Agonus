import { ethers } from 'ethers'
import { SWAP_ROUTER_ADDRESS, ERC20_ABI } from './constants'
import { getQuote, QuoteParams } from './quote'

const SWAP_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'
]

export interface SwapParams {
  tokenInAddress: string
  tokenInDecimals: number
  tokenInSymbol: string
  tokenOutAddress: string
  tokenOutDecimals: number
  tokenOutSymbol: string
  fee: number
  amountIn: bigint
  slippageTolerance: number // in basis points (e.g., 50 = 0.5%)
  walletPrivateKey: string
  rpcUrl: string
}

export async function executeSwap(params: SwapParams) {
  const provider = new ethers.JsonRpcProvider(params.rpcUrl)
  const wallet = new ethers.Wallet(params.walletPrivateKey, provider)

  console.error(`\nSwapping ${ethers.formatUnits(params.amountIn, params.tokenInDecimals)} ${params.tokenInSymbol} -> ${params.tokenOutSymbol}`)

  // 1. Get quote
  const quote = await getQuote({
    tokenIn: params.tokenInAddress,
    tokenOut: params.tokenOutAddress,
    amountIn: params.amountIn,
    fee: params.fee,
    rpcUrl: params.rpcUrl,
  })

  const quoteFormatted = ethers.formatUnits(quote, params.tokenOutDecimals)
  console.error(`Expected output: ${quoteFormatted} ${params.tokenOutSymbol}`)

  // 2. Calculate minimum output with slippage
  const slippageFactor = BigInt(10000 - params.slippageTolerance)
  const amountOutMinimum = (quote * slippageFactor) / 10000n

  // 3. Approve token
  const tokenInContract = new ethers.Contract(params.tokenInAddress, ERC20_ABI, provider)
  const allowance = await tokenInContract.allowance(wallet.address, SWAP_ROUTER_ADDRESS)

  if (allowance < params.amountIn) {
    console.error('Approving token...')
    const tokenWithSigner = tokenInContract.connect(wallet) as any
    const approveTx = await tokenWithSigner.approve(SWAP_ROUTER_ADDRESS, ethers.MaxUint256)
    await approveTx.wait()
    console.error('Approval complete')

    // Wait for nonce to sync
    await new Promise(resolve => setTimeout(resolve, 1000))
  } else {
    console.error('Already approved')
  }

  // 4. Execute swap
  const router = new ethers.Contract(SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI, wallet) as any

  const swapParams = {
    tokenIn: params.tokenInAddress,
    tokenOut: params.tokenOutAddress,
    fee: params.fee,
    recipient: wallet.address,
    amountIn: params.amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0,
  }

  console.error('Executing swap...')
  const tx = await router.exactInputSingle(swapParams)
  const receipt = await tx.wait()
  console.error(`✅ Swap complete! Block: ${receipt.blockNumber}`)

  // 5. Check balances
  const tokenOutContract = new ethers.Contract(params.tokenOutAddress, ERC20_ABI, provider)
  const balanceOut = await tokenOutContract.balanceOf(wallet.address)
  console.error(`Final balance: ${ethers.formatUnits(balanceOut, params.tokenOutDecimals)} ${params.tokenOutSymbol}\n`)

  return {
    txHash: tx.hash,
    amountOut: balanceOut,
  }
}
