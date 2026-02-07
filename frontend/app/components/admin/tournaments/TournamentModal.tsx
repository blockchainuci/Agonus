"use client";

import { useState } from "react";
import { Tournament, AgentState, Trade } from "@/types/admin";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Calendar, DollarSign, Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/admin/formatters";
import TournamentStatusBadge from "../common/TournamentStatusBadge";
import HealthDot from "../common/HealthDot";
import { formatDistanceToNow } from "date-fns";

interface TournamentModalProps {
  tournament: Tournament;
  agentStates?: AgentState[];
  trades?: Trade[];
  isOpen: boolean;
  onClose: () => void;
}

export default function TournamentModal({
  tournament,
  agentStates = [],
  trades = [],
  isOpen,
  onClose,
}: TournamentModalProps) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sort agents by rank
  const sortedAgents = [...agentStates].sort((a, b) => a.rank - b.rank);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{tournament.name}</h2>
                    <TournamentStatusBadge status={tournament.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(tournament.prize_pool)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-400">Agents</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{agentStates.length}</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-400">Total Trades</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {agentStates.reduce((sum, a) => sum + a.trades_count, 0)}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-400">Prize Pool</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">
                      {formatCurrency(tournament.prize_pool)}
                    </p>
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Leaderboard
                  </h3>

                  <div className="space-y-2">
                    {sortedAgents.map((state, index) => (
                      <div
                        key={state.agent_id}
                        className="relative"
                        onMouseEnter={() => setHoveredAgent(state.agent_id)}
                        onMouseLeave={() => setHoveredAgent(null)}
                      >
                        <div
                          className={`
                            flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all
                            ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20' : ''}
                            ${index === 1 ? 'bg-gray-400/10 border-gray-400/30 hover:bg-gray-400/20' : ''}
                            ${index === 2 ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20' : ''}
                            ${index > 2 ? 'bg-white/5 border-white/10 hover:bg-white/10' : ''}
                          `}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`
                              text-2xl font-bold
                              ${index === 0 ? 'text-yellow-400' : ''}
                              ${index === 1 ? 'text-gray-300' : ''}
                              ${index === 2 ? 'text-orange-400' : ''}
                              ${index > 2 ? 'text-gray-500' : ''}
                            `}>
                              {index === 0 && '🥇'}
                              {index === 1 && '🥈'}
                              {index === 2 && '🥉'}
                              {index > 2 && `${state.rank}`}
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                                <img
                                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(state.agent?.name || state.agent_id)}`}
                                  alt={state.agent?.name || 'Agent'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-white font-medium">{state.agent?.name || 'Unknown'}</p>
                                <p className="text-sm text-gray-400">{state.trades_count} trades</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="text-lg font-bold text-white">
                                {formatCurrency(state.portfolio_value_usd)}
                              </p>
                              <p className="text-xs text-gray-400">Portfolio Value</p>
                            </div>
                            <HealthDot status="healthy" />
                          </div>
                        </div>

                        {/* Hover Tooltip */}
                        <AnimatePresence>
                          {hoveredAgent === state.agent_id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 z-50 pointer-events-none"
                            >
                              <div className="bg-gray-900 border border-white/20 rounded-lg p-4 shadow-xl">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400">
                                    <img
                                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(state.agent?.name || state.agent_id)}`}
                                      alt={state.agent?.name || 'Agent'}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-white">
                                      {state.agent?.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      Rank #{state.rank}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-gray-400 text-xs mb-1">Portfolio Value</p>
                                    <p className="text-green-400 font-medium">
                                      {formatCurrency(state.portfolio_value_usd)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 text-xs mb-1">Trades</p>
                                    <p className="text-white">{state.trades_count}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 text-xs mb-1">Strategy</p>
                                    <p className="text-white">{state.agent?.strategy_type}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 text-xs mb-1">Last Updated</p>
                                    <p className="text-white">
                                      {formatDistanceToNow(new Date(state.updated_at), {
                                        addSuffix: true
                                      })}
                                    </p>
                                  </div>
                                  {state.last_decision && (
                                    <div className="col-span-2 pt-2 border-t border-white/10">
                                      <p className="text-gray-400 text-xs mb-1">Last Decision</p>
                                      <p className="text-white text-xs leading-tight">
                                        {state.last_decision}
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
                  </div>
                </div>

                {/* Recent Trades */}
                {trades.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>
                    <div className="space-y-2">
                      {trades.slice(0, 5).map((trade) => (
                        <div
                          key={trade.id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg text-sm"
                        >
                          <div>
                            <span className="text-white font-medium">{trade.agent?.name}</span>
                            <span className="text-gray-400"> {trade.action} </span>
                            <span className="text-blue-400">{trade.amount} {trade.asset}</span>
                          </div>
                          <span className="text-gray-500">{formatCurrency(trade.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
