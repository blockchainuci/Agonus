'use client';

import { useState } from 'react';
import UserProfileCard from './components/UserInfo';
import TournamentContainer from './components/TournamentStatusBar';
import CandleChart from './components/CandleChart';
import RecentTrades from './components/RecentTrades';
import ActiveBets from './components/ActiveBets';

export default function HomePage() {
  // Add tournament state management
  const [selectedTournamentId, setSelectedTournamentId] = useState(5);

  return (
    <div className="pt-24 max-w-7xl mx-auto flex flex-col gap-16 p-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8"></div>

      <RecentTrades tournamentId={selectedTournamentId} />
    </div>
  );
}
