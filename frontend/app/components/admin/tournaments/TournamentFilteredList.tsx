"use client";

import { useState } from "react";
import { TournamentWithMetrics, TournamentStatus, AgentState } from "@/types/admin";
import TournamentStatusBadge from "../common/TournamentStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils/admin/formatters";
import { motion, AnimatePresence } from "framer-motion";
import { getAgentStatesByTournament } from "@/lib/mock/adminMockData";
import { formatDistanceToNow } from "date-fns";

interface TournamentFilteredListProps {
  tournaments: TournamentWithMetrics[];
  onSelectTournament: (tournament: TournamentWithMetrics) => void;
}

export default function TournamentFilteredList({
  tournaments,
  onSelectTournament,
}: TournamentFilteredListProps) {
  const [filter, setFilter] = useState<TournamentStatus | "all">("all");
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  const filteredTournaments =
    filter === "all"
      ? tournaments
      : tournaments.filter((t) => t.status === filter);

  return (
    <div>
      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "all"
              ? "bg-white/10 text-white border border-white/20"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter(TournamentStatus.UPCOMING)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === TournamentStatus.UPCOMING
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter(TournamentStatus.LIVE)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === TournamentStatus.LIVE
              ? "bg-white/10 text-white border border-white/30"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          Live
        </button>
        <button
          onClick={() => setFilter(TournamentStatus.COMPLETED)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === TournamentStatus.COMPLETED
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          Completed
        </button>
      </div>

      {/* Tournament Cards */}
      <div className="space-y-3">
        {filteredTournaments.map((tournament, index) => {
          const agentStates = getAgentStatesByTournament(tournament.id);

          return (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer transition-all group"
            >
              <div
                onClick={() => onSelectTournament(tournament)}
                className="flex items-center justify-between mb-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                      {tournament.name}
                    </h3>
                    <TournamentStatusBadge status={tournament.status} size="sm" />
                  </div>
                  <p className="text-sm text-gray-400">
                    {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-400">
                    {formatCurrency(tournament.prize_pool)}
                  </p>
                  <p className="text-xs text-gray-400">{tournament.agent_count} agents</p>
                </div>
              </div>

              {/* Agent Roster */}
              {agentStates.length > 0 && (
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <p className="text-xs text-gray-500 mr-1">Agents:</p>
                  <div className="flex gap-1">
                    {agentStates.slice(0, 8).map((agentState) => (
                      <div
                        key={agentState.agent_id}
                        className="relative"
                        onMouseEnter={() => setHoveredAgent(`${tournament.id}-${agentState.agent_id}`)}
                        onMouseLeave={() => setHoveredAgent(null)}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 hover:border-blue-400 transition-all cursor-pointer"
                        >
                          <img
                            src={agentState.agent?.avatar_url}
                            alt={agentState.agent?.name || "Agent"}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>

                        {/* Hover Tooltip */}
                        <AnimatePresence>
                          {hoveredAgent === `${tournament.id}-${agentState.agent_id}` && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
                            >
                              <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-xl min-w-[220px]">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-400">
                                    <img
                                      src={agentState.agent?.avatar_url}
                                      alt={agentState.agent?.name || "Agent"}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-white text-sm">
                                      {agentState.agent?.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      Rank #{agentState.rank}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-1.5 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Portfolio Value:</span>
                                    <span className="text-green-400 font-medium">
                                      {formatCurrency(agentState.portfolio_value_usd)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Trades:</span>
                                    <span className="text-white">{agentState.trades_count}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Last Updated:</span>
                                    <span className="text-white">
                                      {formatDistanceToNow(new Date(agentState.updated_at), {
                                        addSuffix: true
                                      })}
                                    </span>
                                  </div>
                                  {agentState.last_decision && (
                                    <div className="pt-1.5 border-t border-white/10">
                                      <p className="text-gray-400 mb-0.5">Last Decision:</p>
                                      <p className="text-white text-xs leading-tight">
                                        {agentState.last_decision}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    {agentStates.length > 8 && (
                      <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                        <span className="text-xs text-gray-400">+{agentStates.length - 8}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {filteredTournaments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No tournaments found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
