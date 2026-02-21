'use client';

import { useState } from 'react';
import AgentSidebar from './components/AgentSidebar';
import AgentPerformanceChart from './components/AgentPerformanceChart';
import RecentTrades from './components/RecentTrades';
import { useTournamentStore } from '@/src/store/useTournamentStore';
import BetModal from '@/src/betting/BetModal';

export default function HomePage() {
  const selectedTournamentId = useTournamentStore((s) => s.selectedTournamentId);
  const [highlightedAgentId, setHighlightedAgentId] = useState<string | null>(null);

  return (
    // h-full fills the <main> content area (h-screen minus 64px navbar via pt-16)
    <div className="h-full flex flex-col px-8 py-4 gap-4 overflow-hidden">

      {/* Main area — fills all remaining height */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">

        {/* Left: Agent sidebar (agents list + your bets accordion) */}
        <div className="lg:w-[280px] lg:shrink-0 lg:h-full min-h-[300px]">
          <AgentSidebar
            tournamentId={selectedTournamentId}
            onAgentHover={setHighlightedAgentId}
            highlightedAgentId={highlightedAgentId}
          />
        </div>

        {/* Right: Chart on top, Recent Trades pinned at bottom */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 h-full overflow-hidden">
          {/* Performance chart fills remaining vertical space */}
          <div className="flex-1 min-h-0">
            <AgentPerformanceChart
              tournamentId={selectedTournamentId}
              highlightedAgentId={highlightedAgentId}
            />
          </div>

          {/* Recent Trades — fixed height strip at the bottom */}
          <div className="h-[220px] shrink-0">
            <RecentTrades tournamentId={selectedTournamentId} />
          </div>
        </div>
      </div>

      <BetModal />
    </div>
  );
}
