'use client';

import AgentPositions from './AgentPositions';
import ActiveBets from './ActiveBets';
import { TournamentStatusBar } from './TournamentStatusBar';
import { useTournamentStore } from '@/src/store/useTournamentStore';

export default function TournamentContainer() {
  const selectedTournamentId = useTournamentStore((s) => s.selectedTournamentId);

  return (
    <div className="flex flex-col gap-0 w-full bg-black/20 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">

      <TournamentStatusBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <AgentPositions tournamentId={selectedTournamentId} />
        <ActiveBets tournamentId={selectedTournamentId} />
      </div>
    </div>
  );
}
