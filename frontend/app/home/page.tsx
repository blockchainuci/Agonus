'use client';

import { useState, useEffect } from 'react';
import UserProfileCard from './components/UserInfo';
import TournamentContainer from './components/TournamentStatusBar';
import CandleChart from './components/CandleChart';
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
    console.log('HomePage useEffect:', { tournaments, isLoading, selectedTournamentId });
    if (tournaments && tournaments.length > 0 && !selectedTournamentId) {
      console.log('Setting tournament ID to:', tournaments[0].id);
      setSelectedTournamentId(tournaments[0].id);
    }
  }, [tournaments, isLoading]);

  // Debug logging
  useEffect(() => {
    if (error) {
      console.error('Error loading tournaments:', error);
    }
  }, [error]);

  return (
    <div className="relative min-h-screen">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        {/* Animated orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {error ? (
        <div className="pt-24 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-red-400 text-lg">Error loading tournaments</p>
          <p className="text-gray-400 text-sm">{error.message}</p>
        </div>
      ) : isLoading ? (
        <div className="pt-24 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-gray-400 text-lg">Loading tournaments...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : !selectedTournamentId ? (
        <div className="pt-24 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-gray-400 text-lg">No tournaments available</p>
          <p className="text-gray-500 text-sm">Tournaments loaded: {tournaments?.length || 0}</p>
        </div>
      ) : (
        <div className="pt-24 max-w-7xl mx-auto flex flex-col gap-12 p-6">
          {/* Section 1: User Profile & Tournament - Blue tint */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent rounded-3xl blur-xl -z-10"></div>
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
          </div>

          {/* Section 2: Agent Performance Chart - Purple tint */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent rounded-3xl blur-xl -z-10"></div>
            <AgentPerformanceChart tournamentId={selectedTournamentId} />
          </div>

          {/* Section 3: Recent Trades - Cyan tint */}
          <div className="relative pb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent rounded-3xl blur-xl -z-10"></div>
            <RecentTrades tournamentId={selectedTournamentId} />
          </div>
        </div>
      )}
    </div>
  );
}
