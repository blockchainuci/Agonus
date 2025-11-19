import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ExampleConfig, Environment } from './types'
import * as dotenv from 'dotenv'

dotenv.config()

// Base Mainnet Chain ID
const CHAIN_ID = 8453

// Token definitions
export const WETH_TOKEN = new Token(
  CHAIN_ID,
  '0x4200000000000000000000000000000000000006',
  18,
  'WETH',
  'Wrapped Ether'
)

export const USDC_TOKEN = new Token(
  CHAIN_ID,
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  6,
  'USDC',
  'USD Coin'
)

export const cbBTC_TOKEN = new Token(
  CHAIN_ID,
  '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  8,
  'cbBTC',
  'Coinbase Wrapped BTC'
)

// Pool fees (found from actual pools on Base)
export const POOL_FEES = {
  WETH_USDC: 500,    // 0.05%
  cbBTC_USDC: 500,   // 0.05% - may need to verify
}

// Main config - follows Uniswap docs structure
export const CurrentConfig: ExampleConfig = {
  env: Environment.LOCAL,
  rpc: {
    local: process.env.RPC_LOCAL || 'http://localhost:8545',
    mainnet: process.env.RPC_MAINNET || '',
  },
  wallet: {
    address: process.env.AGENT_1_ADDRESS || '',
    privateKey: process.env.AGENT_1_PRIVATE_KEY || '',
  },
  tokens: {
    in: USDC_TOKEN,
    amountIn: 100, // 100 USDC
    out: WETH_TOKEN,
    poolFee: FeeAmount.LOW, // 0.05% - matches the actual pool
  },
}
