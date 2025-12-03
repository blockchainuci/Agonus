'use client';

import React, { useState } from 'react';
import AgentPositions from './AgentPositions';
import ActiveBets from './ActiveBets';
import { useTournaments, useTournament } from '@/src/hooks/useTournaments';

interface TournamentContainerProps {
  selectedTournamentId: string;
  onTournamentChange: (id: string) => void;
}

function TournamentStatusBar({
  tournament,
  onTournamentChange,
  allTournaments,
}: {
  tournament: any;
  onTournamentChange: (tournamentId: string) => void;
  allTournaments: any[];
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!tournament) {
    return (
      <div className="p-6 flex items-center justify-center border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent">
        <p className="text-gray-400">Loading tournament...</p>
      </div>
    );
  }

  // Format the end time nicely
  const formattedEndTime = new Date(tournament.end_date).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-gray-500/20 text-gray-400';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-2 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent relative">
      <div className="flex items-center gap-3">
        <div className="text-yellow-400 font-bold text-2xl">TOURNAMENT</div>

        {/* Dropdown Button with Triangle */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-300 transition-colors"
          >
            <svg
              className="w-4 h-4 text-blue-900"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-50">
              <div className="py-1">
                {allTournaments.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onTournamentChange(t.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors ${
                      t.id === tournament.id ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">
                          {t.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          ${parseFloat(t.prize_pool).toLocaleString()} •{' '}
                          {new Date(t.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-md font-semibold uppercase text-xs ${getStatusColor(t.status)}`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-gray-400 text-sm flex flex-wrap gap-4 items-center">
        <span className="flex items-center gap-2">
          Status:{' '}
          <span
            className={`px-2 py-1 rounded-md font-semibold uppercase text-xs ${getStatusColor(tournament.status)}`}
          >
            {tournament.status}
          </span>
        </span>
        <span>
          Prize Pool:{' '}
          <span className="text-white font-semibold">
            ${parseFloat(tournament.prize_pool).toLocaleString()}
          </span>
        </span>
        <span>
          Ends: <span className="text-white font-mono">{formattedEndTime}</span>
        </span>
      </div>
    </div>
  );
}

export default function TournamentContainer({
  selectedTournamentId,
  onTournamentChange,
}: TournamentContainerProps) {
  const { data: tournaments, isLoading } = useTournaments();
  const { data: selectedTournament } = useTournament(selectedTournamentId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-0 w-full bg-black/20 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 flex items-center justify-center">
          <p className="text-gray-400">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 w-full bg-black/20 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
      {/* Tournament Status Bar - Header */}
      <TournamentStatusBar
        tournament={selectedTournament}
        onTournamentChange={onTournamentChange}
        allTournaments={tournaments || []}
      />

      {/* Agent Positions and Active Bets - Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <AgentPositions tournamentId={selectedTournamentId} />
        <ActiveBets tournamentId={selectedTournamentId} />
      </div>
    </div>
  );
}
