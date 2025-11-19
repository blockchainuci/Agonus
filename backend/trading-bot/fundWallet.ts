import { ethers } from 'ethers'
import { CurrentConfig, USDC_TOKEN } from './config'
import * as dotenv from 'dotenv'

dotenv.config()

// USDC whale on Base with large balance
const USDC_WHALE = '0x20FE51A9229EEf2cF8Ad9E89d91CAb9312cF3b7A'

async function fundWallet() {
  const provider = new ethers.JsonRpcProvider(CurrentConfig.rpc.local)
  const agentAddress = CurrentConfig.wallet.address

  console.log('Funding Agent 1:', agentAddress)

  // Fund with 10 ETH for gas
  await provider.send('anvil_setBalance', [
    agentAddress,
    ethers.parseEther('10').toString()
  ])

  const ethBalance = await provider.getBalance(agentAddress)
  console.log('ETH Balance:', ethers.formatEther(ethBalance))

  // Fund with USDC using whale account
  const USDC_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
  ]

  const usdcContract = new ethers.Contract(USDC_TOKEN.address, USDC_ABI, provider) as any

  // Impersonate whale and transfer USDC
  await provider.send('anvil_impersonateAccount', [USDC_WHALE])
  const whaleSigner = await provider.getSigner(USDC_WHALE)

  const amountToTransfer = ethers.parseUnits('1000', 6) // 1000 USDC
  const tx = await usdcContract.connect(whaleSigner).transfer(agentAddress, amountToTransfer)
  await tx.wait()

  await provider.send('anvil_stopImpersonatingAccount', [USDC_WHALE])

  const agentUSDCBalance = await usdcContract.balanceOf(agentAddress)
  console.log('USDC Balance:', ethers.formatUnits(agentUSDCBalance, 6))

  console.log('✅ Funding complete')
}

fundWallet()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
