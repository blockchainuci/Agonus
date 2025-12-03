'use client';

import { useState } from 'react';
import { mockBets } from '../data/mockBet';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, XCircle, Clock, Zap } from 'lucide-react';

// ADD THIS INTERFACE
interface ActiveBetsProps {
  tournamentId: string;
}

// UPDATE THIS LINE TO ACCEPT THE PROP
export default function ActiveBets({ tournamentId }: ActiveBetsProps) {
  const [filter, setFilter] = useState<'active' | 'past'>('active');

  // Filter bets based on status AND tournament_id
  const activeBets = mockBets.filter(
    (b) => b.status === 'active' && b.tournament_id.toString() === tournamentId
  );
  const pastBets = mockBets.filter(
    (b) =>
      (b.status === 'won' || b.status === 'lost') &&
      b.tournament_id.toString() === tournamentId
  );

  const displayedBets = filter === 'active' ? activeBets : pastBets;

  // Get agent avatar color based on name
  const getAgentColor = (agent: string) => {
    const colors: { [key: string]: string } = {
      'Diamond Hands Dan': 'from-blue-500 to-cyan-500',
      'YOLO Trader': 'from-purple-500 to-pink-500',
      'Sniper Bot': 'from-green-500 to-emerald-500',
      'Paper Hands Pete': 'from-orange-500 to-red-500',
      'Safe Mode Sarah': 'from-indigo-500 to-blue-500',
    };
    return colors[agent] || 'from-gray-500 to-slate-500';
  };

  return (
    <div className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your Bets</h3>
            <p className="text-xs text-gray-400">Tournament #{tournamentId}</p>
          </div>
        </div>

        {/* Total stats badge */}
        <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
          <span className="text-xs text-cyan-400 font-semibold">
            {displayedBets.length} Bets
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 relative z-10 bg-white/5 p-1 rounded-lg">
        <button
          onClick={() => setFilter('active')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            filter === 'active'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Active ({activeBets.length})
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            filter === 'past'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Past ({pastBets.length})
        </button>
      </div>

      {/* Bets Display - Card Grid */}
      <div className="relative z-10">
        {displayedBets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">No {filter} bets</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 relative z-10 scrollbar-always-visible">
            <style jsx>{`
              .scrollbar-always-visible::-webkit-scrollbar {
                width: 8px;
              }
              .scrollbar-always-visible::-webkit-scrollbar-track {
                background: rgba(255, 215, 0, 0.05);
                border-radius: 10px;
              }
              .scrollbar-always-visible::-webkit-scrollbar-thumb {
                background: rgba(255, 215, 0, 0.3);
                border-radius: 10px;
                transition: background 0.3s;
              }
              .scrollbar-always-visible::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 215, 0, 0.5);
              }
              .scrollbar-always-visible::-webkit-scrollbar-thumb {
                min-height: 40px;
              }
            `}</style>
            <AnimatePresence mode="wait">
              {displayedBets.map((bet, index) => (
                <motion.div
                  key={bet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 transition-all group relative overflow-hidden"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    {/* Top row: Agent info & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Agent avatar */}
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAgentColor(bet.agent)} flex items-center justify-center text-white font-bold shadow-lg`}
                        >
                          {bet.agent
                            .split(' ')
                            .map((w) => w[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">
                            {bet.agent}
                          </p>
                          <p className="text-xs text-gray-400">
                            Tournament #{bet.tournament_id}
                          </p>
                        </div>
                      </div>

                      {/* Status badge */}
                      {bet.status === 'active' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span className="text-xs text-cyan-400 font-semibold uppercase">
                            Active
                          </span>
                        </div>
                      )}
                      {bet.status === 'won' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                          <Trophy className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-400 font-semibold uppercase">
                            Won
                          </span>
                        </div>
                      )}
                      {bet.status === 'lost' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                          <XCircle className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-red-400 font-semibold uppercase">
                            Lost
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom row: Bet amount */}
                    <div className="pt-3 border-t border-white/5">
                      <p className="text-xs text-gray-400 mb-1">Bet Amount</p>
                      <p className="font-bold text-white text-lg">
                        {bet.amount_eth} ETH
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Summary footer for past bets */}
      {filter === 'past' && pastBets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400 uppercase">Won</span>
              </div>
              <p className="text-lg font-bold text-green-400">
                {pastBets.filter((b) => b.status === 'won').length}
              </p>
            </div>

            <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400 uppercase">Lost</span>
              </div>
              <p className="text-lg font-bold text-red-400">
                {pastBets.filter((b) => b.status === 'lost').length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30" />
    </div>
  );
}
