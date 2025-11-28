'use client';

import { useState } from 'react';
import UserProfileCard from './components/UserInfo';
import TournamentContainer from './components/TournamentStatusBar';
import CandleChart from './components/CandleChart';
import RecentTrades from './components/RecentTrades';
import AgentListSection from './dashboard/AgentListSection';
import { agents } from './data/mockAgents';


export default function HomePage() {
  // Add tournament state management
  const [selectedTournamentId, setSelectedTournamentId] = useState(5);

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

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent rounded-3xl blur-xl -z-10"></div>
          <AgentListSection />
        </div>

        {/* Section 2: Chart - Purple tint */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent rounded-3xl blur-xl -z-10"></div>
          <CandleChart tournamentId={selectedTournamentId} />
        </div>

        {/* Section 3: Recent Trades - Cyan tint */}
        <div className="relative pb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent rounded-3xl blur-xl -z-10"></div>
          <RecentTrades tournamentId={selectedTournamentId} />
        </div>
      </div>
    </div>
  );
}
