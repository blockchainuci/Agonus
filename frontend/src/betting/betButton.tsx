'use client';

import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useTournamentStore } from '@/src/store/useTournamentStore';

interface BetButtonProps {
  agent: { name: string; id: string };
  className?: string;
}

export function BetButton({ agent, className = "" }: BetButtonProps) {
  const openBetModal = useTournamentStore((state) => state.openBetModal);
  const { chainId, isConnected } = useAccount();

  const TARGET_CHAIN = 84532;
  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN;

  function handleClick() {
    if (wrongNetwork) {
      toast.error("You must switch to Base Sepolia (84532) to place a bet.");
      return;
    }
    openBetModal(agent);
  }

  return (
    <button
      onClick={handleClick}
      className={`
        px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black 
        font-semibold transition shadow-md hover:shadow-lg
        ${className}
      `}
    >
      Bet on {agent.name}
    </button>
  );
}
