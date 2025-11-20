'use client';

import { mockTournament } from '../data/mockTournament';
import AgentPositions from './AgentPositions';
import ActiveBets from './ActiveBets';

function TournamentStatusBar() {
  const t = mockTournament;

  // Format the end time nicely
  const formattedEndTime = new Date(t.end_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-2 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent">
      <div className="flex items-center gap-3">
        <div className="text-yellow-400 font-bold text-2xl">TOURNAMENT</div>
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-blue-900"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </div>

      <div className="text-gray-400 text-sm flex flex-wrap gap-4 items-center">
        <span className="flex items-center gap-2">
          Status:{' '}
          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md font-semibold uppercase text-xs">
            {t.status}
          </span>
        </span>
        <span>
          Prize Pool:{' '}
          <span className="text-white font-semibold">
            ${t.prize_pool_usd.toLocaleString()}
          </span>
        </span>
        <span>
          Ends: <span className="text-white font-mono">{formattedEndTime}</span>
        </span>
      </div>
    </div>
  );
}

export default function TournamentContainer() {
  return (
    <div className="flex flex-col gap-0 w-full bg-black/20 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
      {/* Tournament Status Bar - Header */}
      <TournamentStatusBar />

      {/* Agent Positions and Active Bets - Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <AgentPositions />
        <ActiveBets />
      </div>
    </div>
  );
}
