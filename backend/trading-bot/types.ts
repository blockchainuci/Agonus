import { Token } from '@uniswap/sdk-core'

/**
 * Environment types
 */
export enum Environment {
  LOCAL = 'local',
  MAINNET = 'mainnet',
}

/**
 * Configuration interface for trading
 */
export interface ExampleConfig {
  env: Environment
  rpc: {
    local: string
    mainnet: string
  }
  wallet: {
    address: string
    privateKey: string
  }
  tokens: {
    in: Token
    amountIn: number
    out: Token
    poolFee: number
  }
}

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  address: string
  privateKey: string
}
