import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ExampleConfig, Environment } from './types'
import * as dotenv from 'dotenv'

dotenv.config()

// Chain ID from environment variable (Base Sepolia = 84532, Base Mainnet = 8453)
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '84532')

// Determine if we're on testnet or mainnet
const IS_TESTNET = CHAIN_ID === 84532

// Token addresses - different for testnet vs mainnet
const TOKEN_ADDRESSES = IS_TESTNET ? {
  // Base Sepolia (testnet) addresses
  WETH: '0x4200000000000000000000000000000000000006', // WETH is same on both
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
  CBBTC: '0x627825ef01eff9b4cf94595ce5727598cb3c7292', // Tokenized BTC on Base Sepolia
} : {
  // Base Mainnet addresses
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  CBBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
}

// Token definitions
export const WETH_TOKEN = new Token(
  CHAIN_ID,
  TOKEN_ADDRESSES.WETH,
  18,
  'WETH',
  'Wrapped Ether'
)

export const USDC_TOKEN = new Token(
  CHAIN_ID,
  TOKEN_ADDRESSES.USDC,
  6,
  'USDC',
  'USD Coin'
)

export const cbBTC_TOKEN = new Token(
  CHAIN_ID,
  TOKEN_ADDRESSES.CBBTC,
  8,
  'cbBTC',
  IS_TESTNET ? 'Tokenized BTC' : 'Coinbase Wrapped BTC'
)

// Pool fees (Base Sepolia may have different fees - typically 0.3% on testnets)
export const POOL_FEES = {
  WETH_USDC: IS_TESTNET ? 3000 : 500,    // 0.3% on testnet, 0.05% on mainnet  
  cbBTC_USDC: IS_TESTNET ? 3000 : 500,   // 0.3% on testnet, 0.05% on mainnet
}

// Main config - follows Uniswap docs structure
export const CurrentConfig: ExampleConfig = {
  env: IS_TESTNET ? Environment.MAINNET : Environment.LOCAL, // Use MAINNET env for testnet RPC
  rpc: {
    local: process.env.RPC_LOCAL || 'http://localhost:8545',
    mainnet: process.env.RPC_URL || 'https://base-sepolia.g.alchemy.com/v2/YOUR_KEY',
  },
  wallet: {
    address: process.env.AGENT_1_ADDRESS || '',
    privateKey: process.env.AGENT_1_PRIVATE_KEY || '',
  },
  tokens: {
    in: USDC_TOKEN,
    amountIn: 100, // 100 USDC
    out: WETH_TOKEN,
    poolFee: IS_TESTNET ? FeeAmount.MEDIUM : FeeAmount.LOW, // 0.3% on testnet, 0.05% on mainnet
  },
}
