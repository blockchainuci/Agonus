'use client';

import { useEffect } from 'react';
import UserProfileCard from './components/UserInfo';
import TournamentContainer from './components/TournamentStatusBar';
import RecentTrades from './components/RecentTrades';
import AgentPerformanceChart from './components/AgentPerformanceChart';
import { useTournaments } from '@/src/hooks/useTournaments';
import { useTournamentStore } from '@/src/store/useTournamentStore';

export default function HomePage() {
  // Fetch tournaments from backend (optional - for syncing with backend data)
  const { data: tournaments } = useTournaments();

  // Use Zustand store for tournament selection (same as TournamentStatusBar)
  // Store has default '5' so we always have a selectedTournamentId
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
    <div className="relative min-h-screen">
      {/* Static gradient background - no animations for performance */}
      <div className="fixed inset-0 -z-10 gradient-animate-slow">
        {/* Static decorative orbs - using CSS transforms instead of animate-pulse */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      {/* Main Content - Always render with default tournament ID from store */}
      <div className="pt-24 max-w-7xl mx-auto flex flex-col gap-8 p-6">
        {/* Section 1: User Profile & Tournament */}
        <section className="relative">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* User Profile Card */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <UserProfileCard />
            </div>

            {/* Tournament Container - uses Zustand store internally */}
            <div className="w-full flex-grow">
              <TournamentContainer />
            </div>
          </div>
        </section>

        {/* Section 2: Agent Performance Chart */}
        <section id="performance" className="relative">
          <AgentPerformanceChart tournamentId={selectedTournamentId} />
        </section>

        {/* Section 3: Recent Trades */}
        <section id="recent-trades" className="relative pb-12">
          <RecentTrades tournamentId={selectedTournamentId} />
        </section>
      </div>
    </div>
  );
}
