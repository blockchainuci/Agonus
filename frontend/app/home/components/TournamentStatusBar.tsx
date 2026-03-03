'use client';

import React, { useEffect, useState } from 'react';
import { useTournaments } from '@/src/hooks/useTournaments';
import { ChevronDown } from 'lucide-react';

import { useTournamentStore } from '@/src/store/useTournamentStore';
import type { TournamentStatus } from '@/src/store/useTournamentStore';

/* ---------------------------------------------------------
   TOURNAMENT STATUS BAR (Named Export) — Compact single-line
--------------------------------------------------------- */
export function TournamentStatusBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedTournamentId = useTournamentStore(
    (s) => s.selectedTournamentId
  );
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
      })
    : 'TBD';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-emerald-500/15 text-emerald-400';
      case 'ENDED':
        return 'bg-zinc-500/15 text-zinc-400';
      case 'UPCOMING':
        return 'bg-blue-500/15 text-blue-400';
      default:
        return 'bg-zinc-500/15 text-zinc-400';
    }
  };

  return (
    <div className="px-4 py-2.5 flex items-center gap-3 bg-[#0a0e17]">
      {/* Tournament name + dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <span className="text-sm font-semibold text-white truncate max-w-[200px]">
            {uiTournament?.name || 'Tournament'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute top-full left-0 mt-1 w-72 bg-[#111827] rounded-lg shadow-2xl border border-white/10 z-50 max-h-[50vh] overflow-y-auto">
              {(tournaments ?? []).map((t) => {
                const status = normalizeStatus(t.status);
                const idStr = String(t.id);
                const active = uiTournament
                  ? idStr === String(uiTournament.id)
                  : false;
                return (
                  <button
                    key={idStr}
                    onClick={() => {
                      setTournamentId(idStr, t.name);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors text-sm ${
                      active ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white truncate">
                        {t.name || `Tournament ${idStr.slice(0, 8)}`}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase flex-shrink-0 ${getStatusColor(status)}`}
                      >
                        {status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-white/10" />

      {/* Status badge */}
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${getStatusColor(uiTournament?.status ?? 'UPCOMING')}`}
      >
        {uiTournament?.status ?? 'UPCOMING'}
      </span>

      {/* Inline metadata */}
      <span className="text-xs text-zinc-500">
        Prize:{' '}
        <span className="text-zinc-300">
          {uiTournament
            ? `$${Number(uiTournament.prize_pool_usd).toLocaleString()}`
            : '—'}
        </span>
      </span>

      <span className="text-xs text-zinc-500">
        Ends: <span className="text-zinc-300">{formattedEndTime}</span>
      </span>
    </div>
  );
}

/* ---------------------------------------------------------
   Default export kept for backward compatibility
   (page.tsx now uses TournamentStatusBar directly)
--------------------------------------------------------- */
export default TournamentStatusBar;
