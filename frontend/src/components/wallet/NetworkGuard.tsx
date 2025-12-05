'use client';

import { ReactNode } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

interface GuardProps {
  children: ReactNode;
}

export function NetworkGuard({ children }: GuardProps) {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const TARGET_CHAIN = 84532; // Base Sepolia
  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN;

  return (
    <>
      {wrongNetwork && (
        <div
          className="
            fixed top-20 left-0 right-0 z-[99999]
            bg-red-500/20 text-red-300 border border-red-600
            px-4 py-2 text-center backdrop-blur-md
          "
        >
          ⚠ You are on the wrong network. Please switch to{" "}
          <span className="font-semibold text-red-200">Base Sepolia</span>.
          <button
            onClick={() => switchChain({ chainId: TARGET_CHAIN })}
            className="ml-3 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Switch Now
          </button>
        </div>
      )}

      {/* disable entire UI while on wrong network */}
      <div className={wrongNetwork ? "opacity-40 pointer-events-none select-none" : ""}>
        {children}
      </div>
    </>
  );
}
