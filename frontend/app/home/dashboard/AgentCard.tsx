'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { AgentBet } from '@/lib/types/AgentBet';
import { useTournamentStore } from '@/src/store/useTournamentStore';   // ⭐ ADDED

interface AgentCardProps {
  agent: AgentBet;
  totalAgents: number;
  forceExpand?: boolean;
}

export default function AgentCard({
  agent,
  totalAgents,
  forceExpand,
}: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // ⭐ Zustand bet modal
  const openBetModal = useTournamentStore((s) => s.openBetModal);

  // Sync global expand/collapse
  React.useEffect(() => {
    if (forceExpand !== undefined) {
      setExpanded(forceExpand);
    }
  }, [forceExpand]);

  return (
    <motion.div
      className={`rounded-xl p-5 text-white shadow-lg border transition-all duration-300 ease-out relative overflow-hidden group/card
      ${expanded ? 'bg-gradient-to-br from-[#0a1628] to-[#050b18] border-blue-400/60 shadow-blue-500/20' : 'bg-gradient-to-br from-[#0f172a] to-[#0a1220] border-[#1e293b] hover:border-blue-500/30'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
    <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none`} />
      {/* MAIN ROW */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl font-bold text-blue-200">
            {agent.name}
          </span>
          {agent.rank !== undefined && agent.rank <= 3 && (
            <div className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
              <span className="text-xs font-bold text-yellow-400">
                #{agent.rank}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Win Rate */}
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Win Rate:</span>
            <span className="text-sm font-semibold text-green-400">
              {agent.winRate}%
            </span>
          </div>

          {/* Portfolio */}
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Portfolio:</span>
            <span className="text-sm font-semibold text-blue-300">
              ${agent.portfolioValue.toLocaleString()}
            </span>
          </div>
        </div>
        </div>

        <div className="flex flex-col items-end justify-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400 uppercase tracking-wide mb-1">Odds</span>
            <span className="text-3xl font-bold text-yellow-400 leading-none">
              {agent.odds}x
            </span>
          </div>
    

          <motion.button
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-bold rounded-lg shadow-lg hover:shadow-yellow-500/50 transition-all relative overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              openBetModal(agent);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Bet on Agent</span>
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: isHovered ? '200%' : '-100%' }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>
            

            <button
              className="text-gray-300 mt-2 flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <>
                  <span>Less Info</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>More Info</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>


     {/* EXPANDED CONTENT */}
     <motion.div
        initial={false}
        animate={{
          height: expanded ? 'auto' : 0,
          opacity: expanded ? 1 : 0,
          marginTop: expanded ? '1rem' : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={expanded ? "overflow-visible" : "overflow-hidden"}
      >
        <div className="border-t border-gray-700/50 pt-4 space-y-4 relative z-10">
          {/* Personality */}
          {agent.personality && (
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <span className="font-semibold text-white text-sm">Personality:</span>{' '}
              <span className="text-gray-300 text-sm">{agent.personality}</span>
            </div>
          )}

          {/* Quote */}
          <div className="bg-blue-500/5 border-l-4 border-blue-500/50 rounded-r-lg p-3">
            <p className="text-gray-300 italic text-sm">
              "{agent.quote || 'This agent has not posted recently.'}"
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-20">
            {/* Rank */}
            {agent.rank !== undefined && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-gray-400 uppercase">Rank</span>
                <div className="relative group/rank">
                  <Info className="h-3 w-3 text-gray-500 cursor-pointer" />
                  {/* Tooltip */}
                  <div className="absolute z-50 hidden group-hover/rank:block w-48 rounded-lg bg-black/90 p-2 text-xs text-gray-200 shadow-lg left-full ml-2 top-0">
                  Rank shows this agent's current position in the tournament leaderboard.
                  <div className="absolute right-full top-3 border-4 border-transparent border-r-black/90"></div>
                </div>
                </div>
              </div>
              <span className="text-lg font-bold text-white">
                #{agent.rank}
              </span>
              <span className="text-xs text-gray-400"> of {totalAgents}</span>
            </div>
              
            )}

            {/* P&L */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-xs text-gray-400 uppercase mb-1">P&L</div>
              <span className={`text-lg font-bold ${agent.pnl !== undefined && agent.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {agent.pnl !== undefined ? `$${agent.pnl.toLocaleString()}` : '—'}
              </span>
            </div>

            {/* Volatility */}
            {agent.volatility !== undefined && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 col-span-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-gray-400 uppercase">Volatility</span>
                <div className="relative group/volatility">
                  <Info className="h-3 w-3 text-gray-500 cursor-pointer" />
                  {/* Tooltip */}
                  <div className="absolute z-50 hidden group-hover/volatility:block w-52 rounded-lg bg-black/90 p-2 text-xs text-gray-200 shadow-lg left-full ml-2 top-0">
                    Volatility measures how much this agent's portfolio value swings over time.
                    <div className="absolute right-full top-3 border-4 border-transparent border-r-black/90"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{agent.volatility}</span>
                {/* Visual indicator */}
                <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-red-500"
                    style={{ width: `${Math.min(agent.volatility, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
 
