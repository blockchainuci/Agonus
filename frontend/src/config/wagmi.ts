// src/config/wagmi.ts
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';
import { injected, metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia, base],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: 'Agonus' }),
    /* Wallet place holder to test sign-in*/
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID' 
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
  },
});