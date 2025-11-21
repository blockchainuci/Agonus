/**
 * testPipeline.ts - Test all swap pairs
 * Tests USDC ↔ WETH and USDC ↔ cbBTC swaps
 */

import { simpleSwap } from './simpleSwap'

async function testCompletePipeline() {
  console.log('=== Testing Complete Swap Pipeline ===\n')

  // Test 1: USDC -> WETH
  console.log('--- Test 1: USDC -> WETH ---')
  await simpleSwap({ from: 'USDC', to: 'WETH', amount: '100' })

  await new Promise(resolve => setTimeout(resolve, 2000))

  // Test 2: WETH -> USDC
  console.log('--- Test 2: WETH -> USDC ---')
  await simpleSwap({ from: 'WETH', to: 'USDC', amount: '0.01' })

  await new Promise(resolve => setTimeout(resolve, 2000))

  // Test 3: USDC -> cbBTC
  console.log('--- Test 3: USDC -> cbBTC ---')
  await simpleSwap({ from: 'USDC', to: 'cbBTC', amount: '100' })

  await new Promise(resolve => setTimeout(resolve, 2000))

  // Test 4: cbBTC -> USDC
  console.log('--- Test 4: cbBTC -> USDC ---')
  await simpleSwap({ from: 'cbBTC', to: 'USDC', amount: '0.001' })

  console.log('\n=== All tests complete ===')
}

testCompletePipeline()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error.message)
    process.exit(1)
  })
