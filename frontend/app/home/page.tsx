'use client';

import { useState } from 'react';
import UserProfileCard from './components/UserInfo';
import TournamentContainer from './components/TournamentStatusBar';
import CandleChart from './components/CandleChart';
import RecentTrades from './components/RecentTrades';

export default function HomePage() {
  // Add tournament state management
  const [selectedTournamentId, setSelectedTournamentId] = useState(5);

  return (
    <div className="relative pt-24 max-w-7xl mx-auto flex flex-col gap-12 p-6">
      {/* User Profile and Tournament Section - Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* User Profile Card - Wider */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <UserProfileCard />
        </div>

        {/* Tournament Container - Takes Remaining Space */}
        {/* AgentPositions and ActiveBets are INSIDE TournamentContainer */}
        <div className="w-full flex-grow">
          <TournamentContainer
            selectedTournamentId={selectedTournamentId}
            onTournamentChange={setSelectedTournamentId}
          />
        </div>
      </div>

      <CandleChart tournamentId={selectedTournamentId} />

      <RecentTrades tournamentId={selectedTournamentId} />
    </div>
  );
}
