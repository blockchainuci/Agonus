'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';

export function WrongNetworkBanner() {
  const { chainId, isConnected } = useAccount();
  const TARGET_CHAIN = 84532;

  const [dismissed, setDismissed] = useState(false);

  const wrong = isConnected && chainId !== TARGET_CHAIN;

  if (!wrong || dismissed) return null;

  return (
    <div className="w-full bg-yellow-600/20 text-yellow-300 py-2 px-4 text-sm flex items-center justify-between">
      <span>
        ⚠️ You are connected to <strong>{chainId}</strong>.  
        Please switch to <strong>Base Sepolia (84532)</strong> to place bets.
      </span>

      <button
        onClick={() => setDismissed(true)}
        className="ml-3 px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-400 transition"
      >
        Dismiss
      </button>
    </div>
  );
}
