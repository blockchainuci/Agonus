// src/config/wagmi.ts
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';
import { injected, metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Project ID is gitignored in the .env.local file for security
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Build connectors array - guard against SSR for connectors that access window
const getConnectors = () => {
  const baseConnectors = [
    // Only create MetaMask connector on client side to avoid SSR errors
    ...(typeof window !== 'undefined' ? [metaMask()] : []),
    coinbaseWallet({ appName: 'Agonus' }),
    injected(),
  ];

  // Add WalletConnect if project ID is properly configured
  if (walletConnectProjectId && walletConnectProjectId !== 'a7265c85f8d632dd4a9c0c035ec56da6') {
    return [
      ...baseConnectors,
      walletConnect({
        projectId: walletConnectProjectId,
        showQrModal: true,
      }),
    ];
  }

  return baseConnectors;
};

export const config = createConfig({
  chains: [mainnet, sepolia, base],
  connectors: getConnectors(),
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
  },
});