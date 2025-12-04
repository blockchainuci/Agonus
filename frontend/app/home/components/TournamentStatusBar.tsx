'use client';

import React, { useState } from 'react';
import { mockTournaments } from '../data/mockTournament';
import AgentPositions from './AgentPositions';
import ActiveBets from './ActiveBets';
import { useTournamentStore } from '@/src/store/useTournamentStore';

/* ---------------------------------------------------------
   TOURNAMENT STATUS BAR  (now a NAMED export, NOT default)
--------------------------------------------------------- */
export function TournamentStatusBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Zustand store
  const selectedTournamentId = useTournamentStore((s) => s.selectedTournamentId);
  const setTournamentId = useTournamentStore((s) => s.setTournamentId);

  const tournament =
    mockTournaments.find((t) => t.id === selectedTournamentId) ||
    mockTournaments[0];

  const formattedEndTime = new Date(tournament.end_time).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-green-500/20 text-green-400';
      case 'ENDED':
        return 'bg-gray-500/20 text-gray-400';
      case 'UPCOMING':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-2 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent relative">
      <div className="flex items-center gap-3">
        <div className="text-yellow-400 font-bold text-2xl">TOURNAMENT</div>

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

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-50">
              <div className="py-1">
                {mockTournaments.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTournamentId(t.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors ${
                      t.id === tournament.id ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">Tournament #{t.id}</p>
                        <p className="text-xs text-gray-400">
                          ${t.prize_pool_usd.toLocaleString()} •{' '}
                          {new Date(t.end_time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-1 rounded-md font-semibold uppercase text-xs ${getStatusColor(
                          t.status
                        )}`}
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
            className={`px-2 py-1 rounded-md font-semibold uppercase text-xs ${getStatusColor(
              tournament.status
            )}`}
          >
            {tournament.status}
          </span>
        </span>

        <span>
          Prize Pool:{' '}
          <span className="text-white font-semibold">
            ${tournament.prize_pool_usd.toLocaleString()}
          </span>
        </span>

        <span>
          Ends:{' '}
          <span className="text-white font-mono">{formattedEndTime}</span>
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   TOURNAMENT CONTAINER  (default export)
--------------------------------------------------------- */
export default function TournamentContainer() {
  const selectedTournamentId = useTournamentStore((s) => s.selectedTournamentId);

  return (
    <div className="flex flex-col gap-0 w-full bg-black/20 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
      <TournamentStatusBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <AgentPositions tournamentId={selectedTournamentId} />
        <ActiveBets tournamentId={selectedTournamentId} />
      </div>
    </div>
  );
}
