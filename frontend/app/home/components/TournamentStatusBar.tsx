'use client';

import React, { useEffect, useState } from 'react';
import { useTournaments } from '@/src/hooks/useTournaments';

import AgentPositions from './AgentPositions';
import ActiveBets from './ActiveBets';

import { useTournamentStore } from '@/src/store/useTournamentStore';
import type { TournamentStatus } from '@/src/store/useTournamentStore';

/* ---------------------------------------------------------
   TOURNAMENT STATUS BAR (Named Export)
--------------------------------------------------------- */
export function TournamentStatusBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedTournamentId = useTournamentStore((s) => s.selectedTournamentId);
  const setTournamentId = useTournamentStore((s) => s.setTournamentId);
  const setTournamentStatus = useTournamentStore((s) => s.setTournamentStatus);
  const { data: tournaments } = useTournaments();

  const normalizeStatus = (status?: string): TournamentStatus => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'live') return 'LIVE';
    if (normalized === 'completed' || normalized === 'ended') return 'ENDED';
    if (normalized === 'upcoming') return 'UPCOMING';
    return 'UPCOMING';
  };

  const backendTournament = tournaments?.find(
    (t) => String(t.id) === String(selectedTournamentId)
  );

  const uiTournament = backendTournament
    ? {
        id: String(backendTournament.id),
        name: backendTournament.name,
        status: normalizeStatus(backendTournament.status),
        prize_pool_usd: Number(backendTournament.prize_pool),
        end_time: backendTournament.end_date,
      }
    : undefined;

  useEffect(() => {
    if (uiTournament?.status) {
      setTournamentStatus(uiTournament.status);
    }
  }, [uiTournament?.status, setTournamentStatus]);

  useEffect(() => {
    if (tournaments && tournaments.length > 0 && !selectedTournamentId) {
      setTournamentId(String(tournaments[0].id), tournaments[0].name);
    }
  }, [tournaments, selectedTournamentId, setTournamentId]);

  const formattedEndTime = uiTournament?.end_time
    ? new Date(uiTournament.end_time).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'TBD';

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
      {/* Left Section: Title + Dropdown */}
      <div className="flex items-center gap-3">
        <div className="text-yellow-400 font-bold text-2xl">
          {uiTournament?.name || 'TOURNAMENT'}
        </div>

        {/* Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-300 transition-colors"
          >
            <svg className="w-4 h-4 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-50">
              <div className="py-1">
                {(tournaments ?? []).map((t) => {
                  const status = normalizeStatus(t.status);
                  const prizePool = Number(t.prize_pool);
                  const endTime = t.end_date;
                  const idStr = String(t.id);
                  const active = uiTournament ? idStr === String(uiTournament.id) : false;
                  return (
                  <button
                    key={idStr}
                    onClick={() => {
                      setTournamentId(idStr, t.name);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors ${
                      active ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">{t.name || `Tournament ${idStr.slice(0, 8)}`}</p>
                        <p className="text-xs text-gray-400">
                          ${Number(prizePool).toLocaleString()} *{' '}
                          {endTime ? new Date(endTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          }) : 'TBD'}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-1 rounded-md font-semibold uppercase text-xs ${getStatusColor(status)}`}
                      >
                        {status}
                      </span>
                    </div>
                  </button>
                );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Status Info */}
      <div className="text-gray-400 text-sm flex flex-wrap gap-4 items-center">
        <span className="flex items-center gap-2">
          Status:{' '}
          <span
            className={`px-2 py-1 rounded-md font-semibold uppercase text-xs ${getStatusColor(
              uiTournament?.status ?? 'UPCOMING'
            )}`}
          >
            {uiTournament?.status ?? "UPCOMING"}
          </span>
        </span>

        <span>
          Prize Pool:{' '}
          <span className="text-white font-semibold">
            {uiTournament ? `$${Number(uiTournament.prize_pool_usd).toLocaleString()}` : "—"}
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
   TOURNAMENT CONTAINER (Default Export)
--------------------------------------------------------- */
export default function TournamentContainer() {
  const selectedTournamentId = useTournamentStore((s) => s.selectedTournamentId);

  return (
    <div className="flex flex-col gap-0 w-full bg-black/20 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <TournamentStatusBar />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Left: Agent holdings */}
        <AgentPositions tournamentId={selectedTournamentId} />

        {/* Right: Bets (active + my bets) */}
        <div className="flex flex-col gap-6">
          <ActiveBets tournamentId={selectedTournamentId} />
        </div>
      </div>
    </div>
  );
}
