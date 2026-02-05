"use client";

import { useBettingStore } from "@/src/store/useBettingStore";

interface BetButtonProps {
  tournamentId: string | number;
  agentId: string | number;
  agentName?: string;
  contractTournamentId?: number | null;
  contractAgentId?: number | null;
  defaultAmountEth?: string;
  className?: string;
}

export function BetButton({
  tournamentId,
  agentId,
  agentName,
  contractTournamentId,
  contractAgentId,
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
      contract_tournament_id: contractTournamentId ?? null,
      contract_agent_id: contractAgentId ?? null,
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
