// Contract addresses on Base Mainnet
export const QUOTER_CONTRACT_ADDRESS = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a' // QuoterV2
export const SWAP_ROUTER_ADDRESS = '0x2626664c2603336E57B271c5C0b26F421741e481' // SwapRouter02

// ERC20 ABI
export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
]
