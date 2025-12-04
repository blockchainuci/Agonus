'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
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

  // ⭐ Zustand bet modal
  const openBetModal = useTournamentStore((s) => s.openBetModal);

  // Sync global expand/collapse
  React.useEffect(() => {
    if (forceExpand !== undefined) {
      setExpanded(forceExpand);
    }
  }, [forceExpand]);

  return (
    <div
      className={`rounded-xl p-4 text-white shadow-lg border transition-all duration-300 ease-out
      ${expanded ? 'bg-[#050b18] border-blue-400/60' : 'bg-[#0f172a] border-[#1e293b]'}`}
    >
      {/* MAIN ROW */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-blue-300">
            {agent.name}
          </span>
          <span className="text-sm text-gray-400">
            Win rate: {agent.winRate}%
          </span>
          <span className="text-sm text-gray-400">
            Portfolio: ${agent.portfolioValue.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-yellow-400 text-lg font-bold">
            {agent.odds}x
          </span>

          {/* ⭐ FIXED — Bet button opens modal */}
          <button
            className="mt-2 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg"
            onClick={(e) => {
              e.stopPropagation();   // prevent accordion toggling
              openBetModal(agent);   // ⭐ open modal
            }}
          >
            Bet on Agent
          </button>

          <button
            className="text-gray-300 mt-2 flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <>
                Collapse <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                Expand <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {expanded && (
        <div className="mt-4 border-t border-gray-700 pt-4 space-y-4">
          {agent.personality && (
            <div className="text-gray-300">
              <span className="font-semibold text-white">Personality:</span>{' '}
              {agent.personality}
            </div>
          )}

          <div className="text-gray-400 italic">
            "{agent.quote || 'This agent has not posted recently.'}"
          </div>

          <div className="grid grid-cols-2 gap-4 text-gray-300">
            {agent.rank !== undefined && (
              <div className="relative group">
                <span className="font-semibold text-white">Rank:</span>{' '}
                {agent.rank} of {totalAgents}
                <Info className="h-4 w-4 ml-1 inline text-gray-500 cursor-pointer" />
                <div className="absolute z-50 hidden group-hover:block w-52 rounded-lg bg-black/80 p-2 text-xs text-gray-200 shadow-lg top-6 left-0">
                  Rank shows this agent’s current position in the tournament leaderboard out of all agents.
                </div>
              </div>
            )}

            <div>
              <span className="font-semibold text-white">P&L:</span>{' '}
              {agent.pnl !== undefined ? `$${agent.pnl.toLocaleString()}` : '—'}
            </div>

            {agent.volatility !== undefined && (
              <div className="relative group">
                <span className="font-semibold text-white">Volatility:</span>{' '}
                {agent.volatility}
                <Info className="h-4 w-4 ml-1 inline text-gray-500 cursor-pointer" />
                <div className="absolute z-50 hidden group-hover:block w-56 rounded-lg bg-black/80 p-2 text-xs text-gray-200 shadow-lg top-6 left-0">
                  Volatility measures how much this agent’s portfolio value swings over time.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
