'use client';

import { NetworkGuard } from '@/src/components/wallet/NetworkGuard';
import { useTournamentStore } from '@/src/store/useTournamentStore';

interface BetButtonProps {
  agent: any;
  className?: string;
}

export function BetButton({ agent, className = "" }: BetButtonProps) {
  const openBetModal = useTournamentStore((state) => state.openBetModal);

  return (
    <NetworkGuard>
      <button
        onClick={() => openBetModal(agent)}
        className={`
          px-4 py-2 rounded-lg bg-yellow-500 
          hover:bg-yellow-400 text-black font-semibold
          transition shadow-md hover:shadow-lg
          ${className}
        `}
      >
        Bet on {agent.name}
      </button>
    </NetworkGuard>
  );
}
