'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';

export function WrongNetworkBanner() {
  const chainId = useChainId();
  const { chainId: connectedChain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  // Base Sepolia chain ID
  const TARGET_CHAIN = 84532;

  const isWrong = isConnected && connectedChain !== TARGET_CHAIN;

  if (!isWrong) return null;

  return (
    <div className="w-full bg-red-600/20 text-red-300 py-3 px-4 text-sm flex items-center justify-between">
      <span>
        ⚠️ You are connected to <strong>{connectedChain}</strong>.  
        Please switch to <strong>Base Sepolia</strong>.
      </span>

      <button
        onClick={() => switchChain({ chainId: TARGET_CHAIN })}
        disabled={isPending}
        className="px-3 py-1 rounded-md bg-red-500 text-white text-xs hover:bg-red-400 transition disabled:opacity-50"
      >
        {isPending ? 'Switching...' : 'Switch Network'}
      </button>
    </div>
  );
}
