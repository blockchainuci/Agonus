'use client';

import React, { useState } from 'react';
import { mockTournaments } from '../data/mockTournament';
import AgentPositions from './AgentPositions';
import ActiveBets from './ActiveBets';
import { useTournamentStore } from '@/src/store/useTournamentStore';
import { motion } from 'framer-motion';
import {
  Trophy,
  Clock,
  CheckCircle,
  Calendar,
  DollarSign,
  Zap,
} from 'lucide-react';

type TournamentStatus = 'LIVE' | 'UPCOMING' | 'ENDED';

/* ---------------------------------------------------------
   STATUS FILTER PILLS
--------------------------------------------------------- */
interface StatusFilterProps {
  activeFilter: TournamentStatus;
  onFilterChange: (status: TournamentStatus) => void;
  counts: { LIVE: number; UPCOMING: number; ENDED: number };
}

function StatusFilterPills({
  activeFilter,
  onFilterChange,
  counts,
}: StatusFilterProps) {
  const filters: {
    status: TournamentStatus;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { status: 'LIVE', label: 'Live', icon: <Zap size={14} /> },
    { status: 'UPCOMING', label: 'Upcoming', icon: <Clock size={14} /> },
    { status: 'ENDED', label: 'Ended', icon: <CheckCircle size={14} /> },
  ];

  return (
    <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
      {filters.map(({ status, label, icon }) => (
        <button
          key={status}
          onClick={() => onFilterChange(status)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeFilter === status
              ? 'bg-yellow-400 text-blue-900'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {icon}
          <span>{label}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeFilter === status
                ? 'bg-blue-900/20 text-blue-900'
                : 'bg-white/10 text-gray-400'
            }`}
          >
            {counts[status]}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------
   TOURNAMENT CARD (for the list)
--------------------------------------------------------- */
interface TournamentCardProps {
  tournament: (typeof mockTournaments)[0];
  isSelected: boolean;
  onSelect: () => void;
}

function TournamentCard({
  tournament,
  isSelected,
  onSelect,
}: TournamentCardProps) {
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
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ENDED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'UPCOMING':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <motion.button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isSelected
          ? 'bg-yellow-400/10 border-yellow-400/50 shadow-[0_0_15px_rgba(255,215,0,0.15)]'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Tournament icon */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isSelected
                ? 'bg-yellow-400 text-blue-900'
                : 'bg-white/10 text-white'
            }`}
          >
            <Trophy size={18} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">
                Tournament #{tournament.id}
              </span>
              {isSelected && (
                <CheckCircle size={16} className="text-yellow-400" />
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
              <span className="flex items-center gap-1">
                <DollarSign size={12} />$
                {tournament.prize_pool_usd.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formattedEndTime}
              </span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase border ${getStatusColor(tournament.status)}`}
        >
          {tournament.status}
        </span>
      </div>
    </motion.button>
  );
}

/* ---------------------------------------------------------
   TOURNAMENT STATUS BAR (shows active tournament)
--------------------------------------------------------- */
export function TournamentStatusBar() {
  const selectedTournamentId = useTournamentStore(
    (s) => s.selectedTournamentId
  );

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
    <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
          <Trophy size={20} className="text-blue-900" />
        </div>
        <div>
          <div className="text-yellow-400 font-bold text-xl">
            Tournament #{tournament.id}
          </div>
          <div className="text-gray-400 text-sm">Active Tournament</div>
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
            ${tournament.prize_pool_usd.toLocaleString()}
          </span>
        </span>

        <span>
          Ends: <span className="text-white font-mono">{formattedEndTime}</span>
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   TOURNAMENT SELECTOR (filter + list)
--------------------------------------------------------- */
function TournamentSelector() {
  const [statusFilter, setStatusFilter] = useState<TournamentStatus>('LIVE');
  const selectedTournamentId = useTournamentStore(
    (s) => s.selectedTournamentId
  );
  const setTournamentId = useTournamentStore((s) => s.setTournamentId);

  // Count tournaments by status
  const counts = {
    LIVE: mockTournaments.filter((t) => t.status === 'LIVE').length,
    UPCOMING: mockTournaments.filter((t) => t.status === 'UPCOMING').length,
    ENDED: mockTournaments.filter((t) => t.status === 'ENDED').length,
  };

  // Filter tournaments by selected status
  const filteredTournaments = mockTournaments.filter(
    (t) => t.status === statusFilter
  );

  return (
    <div className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Select Tournament</h3>
      </div>

      {/* Filter Pills */}
      <div className="mb-4">
        <StatusFilterPills
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          counts={counts}
        />
      </div>

      {/* Tournament List - Scrollable */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
        <style jsx>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: rgba(255, 215, 0, 0.3);
            border-radius: 10px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 215, 0, 0.5);
          }
        `}</style>

        {filteredTournaments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">
              No {statusFilter.toLowerCase()} tournaments
            </p>
          </div>
        ) : (
          filteredTournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              isSelected={tournament.id === selectedTournamentId}
              onSelect={() => setTournamentId(tournament.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   TOURNAMENT CONTAINER (default export)
--------------------------------------------------------- */
export default function TournamentContainer() {
  const selectedTournamentId = useTournamentStore(
    (s) => s.selectedTournamentId
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Tournament Selector Card */}
      <TournamentSelector />

      {/* Main Tournament Content */}
      <div className="bg-black/20 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
        <TournamentStatusBar />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          <AgentPositions tournamentId={selectedTournamentId} />
          <ActiveBets tournamentId={selectedTournamentId} />
        </div>
      </div>
    </div>
  );
}
