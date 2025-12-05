'use client';

import React, { useState, useMemo } from 'react';
import AgentCard from './AgentCard';
import { mockAgents } from '../data/mockAgents';

// Zustand
import { useTournamentStore } from '@/src/store/useTournamentStore';

// -----------------------------------------
// 1. Normalize backend -> frontend fields
// -----------------------------------------
function normalizeAgents() {
  return mockAgents.map((a, index) => ({
    ...a,

    // Backend snake_case → camelCase
    winRate: a.win_rate,
    roiPercent: a.roi_percent,
    riskScore: a.risk_score,
    holdingsValue: a.holdings_value,
    totalValue: a.total_value,
    numTrades: a.num_trades,

    // Defaults for fields the UI expects
    tournamentId: a.tournament_id,  // now comes from mock data
    rank: index + 1,                // simple placeholder ranking
    odds: Number((1 + Math.random()).toFixed(2)), // mock odds
  }));
}

export default function AgentListSection() {
  const [forceExpandAll, setForceExpandAll] = useState<boolean | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openId, setOpenId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rank' | 'winRate' | 'odds'>('rank');
  const [search, setSearch] = useState('');

  // Zustand tournament ID
  const selectedTournamentId = Number(
    useTournamentStore((s) => s.selectedTournamentId)
  );

  // Normalize backend agents once
  const agents = useMemo(() => normalizeAgents(), []);

  // ----------------------------------------------------
  // FILTER + SEARCH + SORT PROCESSING PIPELINE
  // ----------------------------------------------------
  const processedAgents = useMemo(() => {
    let list = agents.filter(
      (a) => Number(a.tournamentId) === selectedTournamentId
    );

    // Search filter
    if (search.trim() !== '') {
      list = list.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sorting logic
    list.sort((a, b) => {
      let result = 0;

      if (sortBy === 'rank') result = (a.rank ?? 999) - (b.rank ?? 999);
      if (sortBy === 'winRate') result = b.winRate - a.winRate;
      if (sortBy === 'odds') result = a.odds - b.odds;

      return sortDirection === 'asc' ? result : -result;
    });

    return list;
  }, [agents, sortBy, sortDirection, search, selectedTournamentId]);

  const totalAgentsShown = processedAgents.length;

  // Accordion toggle
  const handleAccordionToggle = (id: string) => {
    setForceExpandAll(undefined);
    setOpenId((prev) => (prev === id ? null : id));
  };

  // ------------------------------------------
  // RENDER
  // ------------------------------------------
  return (
    <div className="border border-white/10 rounded-xl bg-black/20 backdrop-blur p-6 flex flex-col">
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/40 backdrop-blur px-4 pt-3 pb-4 mb-4 border-b border-white/5 rounded-t-xl">

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-white">
            Agents in This Tournament
          </h2>

          <span className="text-sm text-gray-300">
            Total Agents: {agents.filter(a =>
              Number(a.tournamentId) === selectedTournamentId
            ).length}
            {totalAgentsShown !== agents.length && (
              <> • Showing: {totalAgentsShown}</>
            )}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap mt-2 pl-1">
          <button
            onClick={() => {
              setForceExpandAll(true);
              setOpenId(null);
            }}
            className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            Expand All
          </button>

          <button
            onClick={() => {
              setForceExpandAll(false);
              setOpenId(null);
            }}
            className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            Collapse All
          </button>

          {/* Sort Mode */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-sm bg-slate-800 text-white rounded-lg"
          >
            <option value="rank">Sort: Rank</option>
            <option value="winRate">Sort: Win Rate</option>
            <option value="odds">Sort: Odds</option>
          </select>

          {/* Sort Direction */}
          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as any)}
            className="px-3 py-2 text-sm bg-slate-800 text-white rounded-lg"
          >
            <option value="asc">Asc ↑</option>
            <option value="desc">Desc ↓</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-900 text-white rounded-lg border border-white/10 w-80"
          />
        </div>
      </div>

      {/* Agent List */}
      <div className="space-y-4 overflow-y-auto max-h-[540px] pr-2">
        {processedAgents.map((agent) => {
          let forceExpandProp: boolean | undefined =
            forceExpandAll !== undefined
              ? forceExpandAll
              : openId === agent.id;

          return (
            <div
              key={agent.id}
              onClick={() => handleAccordionToggle(agent.id)}
              className="cursor-pointer"
            >
              <AgentCard
                agent={agent}
                totalAgents={processedAgents.length}
                forceExpand={forceExpandProp}
                rank={agent.rank}     // <-- FIXED
              />

            </div>
          );
        })}
      </div>
    </div>
  );
}
