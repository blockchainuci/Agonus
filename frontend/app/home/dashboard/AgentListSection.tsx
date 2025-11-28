'use client';

import React, { useState, useMemo } from 'react';
import AgentCard from './AgentCard';
import { agents as mockAgents } from '../data/mockAgents';

export default function AgentListSection() {
  const [forceExpandAll, setForceExpandAll] = useState<boolean | undefined>(undefined);

  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');


  // Accordion: store ID of open card OR null
  const [openId, setOpenId] = useState<string | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<'rank' | 'winRate' | 'odds'>('rank');

  // Search bar
  const [search, setSearch] = useState('');

  // -------------------------------
  // PROCESSING (search + sorting)
  // -------------------------------
  const processedAgents = useMemo(() => {
    let list = [...mockAgents];

    // ⭐ SEARCH FILTER
    if (search.trim() !== '') {
      list = list.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    list.sort((a, b) => {
    let result = 0;

    if (sortBy === 'rank') result = (a.rank ?? 999) - (b.rank ?? 999);
    if (sortBy === 'winRate') result = b.winRate - a.winRate;
    if (sortBy === 'odds') result = a.odds - b.odds;

    return sortDirection === 'asc' ? result : -result;
    });


    return list;
  }, [sortBy, search]);

  // Total AFTER filtering
  const totalAgentsShown = processedAgents.length;

  // -------------------------------
  // HANDLE ACCORDION TOGGLE
  // -------------------------------
  const handleAccordionToggle = (id: string) => {
    setForceExpandAll(undefined); // turn off global expand mode

    // If clicking the same open card → close it
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="border border-white/10 rounded-xl bg-black/20 backdrop-blur p-6 flex flex-col">

      {/* ======================================================= */}
      {/* HEADER (Sticky) */}
      {/* ======================================================= */}
      <div className="sticky top-0 z-20 bg-black/40 backdrop-blur px-4 pt-3 pb-4 mb-4 border-b border-white/5 rounded-t-xl">


        {/* Title + Count */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-white">
            Agents in This Tournament
          </h2>

          <span className="text-sm text-gray-300">
            Total Agents: {mockAgents.length}
            {totalAgentsShown !== mockAgents.length && (
              <> • Showing: {totalAgentsShown}</>
            )}
          </span>
        </div>

        {/* ======================================================= */}
        {/* CONTROLS ROW */}
        {/* ======================================================= */}
        <div className="flex items-center gap-4 flex-wrap mt-2 pl-1">


          {/* Expand All */}
          <button
            onClick={() => {
              setForceExpandAll(true);
              setOpenId(null);
            }}
            className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            Expand All
          </button>

          {/* Collapse All */}
          <button
            onClick={() => {
              setForceExpandAll(false);
              setOpenId(null);
            }}
            className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            Collapse All
          </button>

          {/* Sorting Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-sm bg-slate-800 text-white rounded-lg"
          >
            <option value="rank">Sort: Rank</option>
            <option value="winRate">Sort: Win Rate</option>
            <option value="odds">Sort: Odds</option>
          </select>

          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as any)}
            className="px-3 py-2 text-sm bg-slate-800 text-white rounded-lg">
          <option value="asc">Asc ↑</option>
            <option value="desc">Desc ↓</option>
            </select>


          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-900 text-white rounded-lg border border-white/10 w-80"
          />
        </div>
      </div>

      {/* ======================================================= */}
      {/* AGENT LIST */}
      {/* ======================================================= */}
      <div className="space-y-4 overflow-y-auto max-h-[540px] pr-2">

        {processedAgents.map((agent) => {
          let forceExpandProp: boolean | undefined = undefined;

          // ⭐ Global expand/collapse has priority
          if (forceExpandAll !== undefined) {
            forceExpandProp = forceExpandAll;
          } else {
            // ⭐ Accordion mode: only open the selected card
            forceExpandProp = openId === agent.id;
          }

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
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
