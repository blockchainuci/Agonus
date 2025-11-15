// src/config/wagmi.ts
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';
import { injected, metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Project ID is gitignored in the .env.local file for security
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Build connectors array
const baseConnectors = [
  metaMask(),
  coinbaseWallet({ appName: 'Agonus' }),
  injected(),
];

// Add WalletConnect if project ID is properly configured
const connectors = walletConnectProjectId && walletConnectProjectId !== 'YOUR_PROJECT_ID'
  ? [
      ...baseConnectors,
      walletConnect({
        projectId: walletConnectProjectId,
        showQrModal: true,
      }),
    ]
  : baseConnectors;

export const config = createConfig({
  chains: [mainnet, sepolia, base],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
  },
});