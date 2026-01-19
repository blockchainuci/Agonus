'use client';

import { useState, useEffect, useMemo } from 'react';
import UserProfileCard from './components/UserInfo';
import TournamentContainer from './components/TournamentStatusBar';
import RecentTrades from './components/RecentTrades';
import AgentPerformanceChart from './components/AgentPerformanceChart';
import { useTournaments } from '@/src/hooks/useTournaments';

export default function HomePage() {
  // Fetch tournaments from backend
  const { data: tournaments, isLoading, error } = useTournaments();

  // Add tournament state management - will be set to first tournament ID
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  // Set initial tournament ID when tournaments load
  useEffect(() => {
    if (tournaments && tournaments.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(tournaments[0].id);
    }
  }, [tournaments, selectedTournamentId]);

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

      {error ? (
        <div className="pt-24 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="glass-card p-8 rounded-2xl text-center">
            <p className="text-red-400 text-lg font-semibold mb-2">Error loading tournaments</p>
            <p className="text-gray-400 text-sm">{error.message}</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="pt-24 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="glass-card p-8 rounded-2xl text-center">
            <p className="text-gray-300 text-lg mb-4">Loading tournaments...</p>
            <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      ) : !selectedTournamentId ? (
        <div className="pt-24 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="glass-card p-8 rounded-2xl text-center">
            <p className="text-gray-300 text-lg mb-2">No tournaments available</p>
            <p className="text-gray-500 text-sm">Tournaments loaded: {tournaments?.length || 0}</p>
          </div>
        </div>
      ) : (
        <div className="pt-24 max-w-7xl mx-auto flex flex-col gap-8 p-6">
          {/* Section 1: User Profile & Tournament */}
          <section className="relative">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* User Profile Card */}
              <div className="w-full lg:w-96 flex-shrink-0">
                <UserProfileCard />
              </div>

              {/* Tournament Container */}
              <div className="w-full flex-grow">
                <TournamentContainer
                  selectedTournamentId={selectedTournamentId}
                  onTournamentChange={setSelectedTournamentId}
                />
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
      )}
    </div>
  );
}
