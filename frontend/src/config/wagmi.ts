// src/config/wagmi.ts
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Project ID is gitignored in the .env.local file for security
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Build connectors array - using injected() instead of metaMask() to avoid SSR issues
// injected() will detect MetaMask and other browser wallets automatically
const baseConnectors = [
  injected({ shimDisconnect: true }),
  coinbaseWallet({ appName: 'Agonus' }),
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
  ssr: true, // Enable SSR support
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
  },
});