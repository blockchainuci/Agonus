'use client';

import TournamentContainerWithStatusBar from './TournamentStatusBar';
import { useTournamentStore } from '@/src/store/useTournamentStore';

export default function TournamentContainer() {
  const selectedTournamentId = useTournamentStore((s) => s.selectedTournamentId);
  const setTournamentId = useTournamentStore((s) => s.setTournamentId);

  return (
    <TournamentContainerWithStatusBar
      selectedTournamentId={String(selectedTournamentId)}
      onTournamentChange={(id) => setTournamentId(Number(id))}
    />
  );
}
