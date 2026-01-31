'use client';

import { useEffect } from 'react';
import TournamentContainer from './components/TournamentStatusBar';
import RecentTrades from './components/RecentTrades';
import AgentPerformanceChart from './components/AgentPerformanceChart';
import { useTournaments } from '@/src/hooks/useTournaments';
import { useTournamentStore } from '@/src/store/useTournamentStore';
import SectionBackground from '../components/background/SectionBackground';
import BetModal from '@/src/betting/BetModal';

export default function HomePage() {
  // Fetch tournaments from backend (optional - for syncing with backend data)
  const { data: tournaments } = useTournaments();

  // Use Zustand store for tournament selection (same as TournamentStatusBar)
  const selectedTournamentId = useTournamentStore((s) => s.selectedTournamentId);
  const setTournamentId = useTournamentStore((s) => s.setTournamentId);

  // Sync with backend tournaments when they load (optional - updates default if needed)
  useEffect(() => {
    if (tournaments && tournaments.length > 0) {
      // Only update if the current ID doesn't exist in backend tournaments
      const currentExists = tournaments.some(t => String(t.id) === selectedTournamentId);
      if (!currentExists) {
        setTournamentId(String(tournaments[0].id));
      }
    }
  }, [tournaments, selectedTournamentId, setTournamentId]);

  return (
    <div className="min-h-screen">
      <SectionBackground id="tournaments" variant="base" className="pt-8">
        <div className="max-w-7xl mx-auto p-6">
          <div className="scroll-mt-24 relative">
            <TournamentContainer />
          </div>
        </div>
      </SectionBackground>

      <SectionBackground
        id="performance"
        variant="grid"
        baseClass="bg-deep-performance"
        gridClass="bg-grid-gold-bright grid-flicker"
        className="py-12"
        parallax
      >
        <div className="max-w-7xl mx-auto p-6">
          <div className="scroll-mt-24 relative">
            <AgentPerformanceChart tournamentId={selectedTournamentId} />
          </div>
        </div>
      </SectionBackground>

      <SectionBackground id="recent-trades" variant="inverse" className="pb-12">
        <div className="max-w-7xl mx-auto p-6">
          <div className="scroll-mt-24 relative">
            <RecentTrades tournamentId={selectedTournamentId} />
          </div>
        </div>
      </SectionBackground>

      <BetModal />
    </div>
  );
}
