'use client';

import { useAccount } from 'wagmi';
import { Account } from './account';
import { WalletOptionsMenu } from './wallet-options';

interface ConnectWalletProps {
  variant?: 'default' | 'hero';
  className?: string;
}

export function ConnectWallet({ variant = 'default', className = '' }: ConnectWalletProps) {
  const { isConnected } = useAccount();
  
  if (isConnected) {
    return <Account variant={variant} className={className} />;
  }

  return <WalletOptionsMenu variant={variant} className={className} />;
}