'use client';

import { useAccount } from 'wagmi';
import { WalletOptionsMenu } from '@/src/components/wallet-options';
import UserDropdown from './UserDropdown';

export default function NavbarAccount() {
  const { isConnected } = useAccount();

  // disconnected: show existing connect wallet UI
  if (!isConnected) {
    return <WalletOptionsMenu />;
  }

  // connected: show profile icon + dropdown
  return <UserDropdown />;
}
