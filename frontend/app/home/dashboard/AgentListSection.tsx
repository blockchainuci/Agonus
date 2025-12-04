'use client';

import React, { useState, useMemo } from 'react';
import AgentCard from './AgentCard';
import { agents as mockAgents } from '../data/mockAgents';
import { motion } from 'framer-motion';
import { Search, SortAsc, SortDesc, Maximize, Minimize, Filter } from 'lucide-react';

// Zustand
import { useTournamentStore } from '@/src/store/useTournamentStore';

export default function AgentListSection() {
  const [forceExpandAll, setForceExpandAll] = useState<boolean | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openId, setOpenId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rank' | 'winRate' | 'odds'>('rank');
  const [search, setSearch] = useState('');

  // 🔥 Read tournament ID from Zustand
  const selectedTournamentId = Number(
    useTournamentStore((s) => s.selectedTournamentId)
  );

  // -------------------------------
  // PROCESSING (filter + search + sort)
  // -------------------------------
  const processedAgents = useMemo(() => {
    // 🔥 1) FILTER agents by tournament
    let list = mockAgents.filter(
      (a) => Number(a.tournamentId) === selectedTournamentId
    );

    // 2) Search
    if (search.trim() !== '') {
      list = list.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 3) Sorting
    list.sort((a, b) => {
      let result = 0;

      if (sortBy === 'rank') result = (a.rank ?? 999) - (b.rank ?? 999);
      if (sortBy === 'winRate') result = b.winRate - a.winRate;
      if (sortBy === 'odds') result = a.odds - b.odds;

      return sortDirection === 'asc' ? result : -result;
    });

    return list;
  }, [sortBy, sortDirection, search, selectedTournamentId]);

  const totalAgentsInTournament = mockAgents.filter(
    (a) => Number(a.tournamentId) === selectedTournamentId
  ).length;
  const totalAgentsShown = processedAgents.length;


  // Accordion toggle
  const handleAccordionToggle = (id: string) => {
    setForceExpandAll(undefined);
    setOpenId((prev) => (prev === id ? null : id));
  };
  

  return (
    <div className="border border-white/10 rounded-xl bg-black/20 backdrop-blur p-6 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/60 backdrop-blur-xl px-5 pt-4 pb-5 mb-6 border-b border-white/10 rounded-xl -mx-1">
      <div className="flex items-center justify-between mb-4">
  <div>
    <h2 className="text-2xl font-bold text-white mb-1">
      Tournament Agents
    </h2>
    <p className="text-sm text-gray-400">
      Select an agent to place your bet
    </p>
  </div>

      <div className="flex items-center gap-3">
        {/* Agent Count Badge */}
        <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Total Agents</div>
          <div className="text-xl font-bold text-blue-400">{totalAgentsInTournament}</div>
        </div>
        
        {/* Showing Count (if filtered) */}
        {totalAgentsShown !== totalAgentsInTournament && (
          <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Showing</div>
            <div className="text-xl font-bold text-yellow-400">{totalAgentsShown}</div>
          </div>
        )}
      </div>
  </div>
       
        {/* Controls */}
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
  
          <motion.button
            onClick={() => {
              setForceExpandAll(true);
              setOpenId(null);
            }}
            className="px-3 py-2 text-sm bg-transparent hover:bg-white/10 text-white rounded-md transition-all flex items-center gap-1.5"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Maximize className="w-4 h-4" />
            Expand All
          </motion.button>

          <motion.button
            onClick={() => {
              setForceExpandAll(false);
              setOpenId(null);
            }}
            className="px-3 py-2 text-sm bg-transparent hover:bg-white/10 text-white rounded-md transition-all flex items-center gap-1.5"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Minimize className="w-4 h-4" />
            Collapse All
          </motion.button>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-9 pr-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-white/10 transition-colors appearance-none cursor-pointer"
              >
                <option value="rank">Sort: Rank</option>
                <option value="winRate">Sort: Win Rate</option>
                <option value="odds">Sort: Odds</option>
              </select>
          </div>

              {/*sort direction*/}
                  <motion.button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-white/10 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortDirection === 'asc' ? (
                      <SortAsc className="w-4 h-4" />
                    ) : (
                      <SortDesc className="w-4 h-4" />
                    )}
                  </motion.button>
              </div>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search agents by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-white/10 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.5);
            border-radius: 10px;
            transition: background 0.3s;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.7);
          }
        `}</style>    

        {processedAgents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg mb-2">No agents found</p>
            <p className="text-gray-500 text-sm">
              {search ? 'Try a different search term' : 'No agents available for this tournament'}
            </p>
          </div>
        ) : (
          processedAgents.map((agent, index) => {
            let forceExpandProp: boolean | undefined = undefined;

            if (forceExpandAll !== undefined) {
              forceExpandProp = forceExpandAll;
            } else {
              forceExpandProp = openId === agent.id;
            }

            return (
              <motion.div
                key={agent.id}
                onClick={() => handleAccordionToggle(agent.id)}
                className="cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <AgentCard
                  agent={agent}
                  totalAgents={totalAgentsInTournament}
                  forceExpand={forceExpandProp}
                />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
