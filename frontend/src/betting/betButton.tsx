"use client";

import { useBettingStore } from "@/src/store/useBettingStore";

interface BetButtonProps {
  tournamentId: string | number;
  agentId: string | number;
  agentName?: string;
  defaultAmountEth?: string;
  className?: string;
}

export function BetButton({
  tournamentId,
  agentId,
  agentName,
  defaultAmountEth,
  className = "",
}: BetButtonProps) {
  const openBetModal = useBettingStore((s) => s.openBetModal);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    openBetModal({
      tournament_id: tournamentId,
      agent_id: agentId,
      agent_name: agentName,
      amount_eth: defaultAmountEth,
    });
  }

  return (
    <button
      onClick={handleClick}
      className={`px-3 py-1.5 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 ${className}`}
    >
      Bet
    </button>
  );
}
