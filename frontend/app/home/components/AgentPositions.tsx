<<<<<<< Updated upstream
"use client";
=======
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Sparkles,
  X,
  Brain,
  Activity,
  Clock,
  Target,
} from 'lucide-react';
import { useTournamentAgentStates } from '@/src/hooks/useAgentStates';
import { useAgents } from '@/src/hooks/useAgents';
import { AgentState, Agent } from '@/src/types';
>>>>>>> Stashed changes

import { motion } from "framer-motion";

// BACKEND FORMAT — do not add fields
export interface Position {
  agent_id: string;
  tournament_id: string;
  token: string;
  amount: number;
  current_value_usd: number;
}

<<<<<<< Updated upstream
// TEMP MOCK (replace with real hook later)
import { mockPositions } from "@/app/home/data/mockPositions";
=======
interface SelectedAgentData {
  agentState: AgentState;
  agent: Agent | undefined;
  portfolioValue: number;
  percentOfTotal: number;
}

export default function AgentPositions({ tournamentId }: AgentPositionsProps) {
  // Fetch real data from backend
  const { data: agentStates, isLoading: statesLoading } =
    useTournamentAgentStates(tournamentId);
  const { data: agents, isLoading: agentsLoading } = useAgents();
>>>>>>> Stashed changes

export default function AgentPositions({ tournamentId }: { tournamentId: number }) {
  // Filter positions for this tournament
  const positions: Position[] = mockPositions.filter(
    (p) => String(p.tournament_id) === String(tournamentId)
  );

<<<<<<< Updated upstream
  // Total portfolio value
  const totalValue = positions.reduce(
    (sum, p) => sum + p.current_value_usd,
    0
  );
=======
  // State for selected agent modal
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgentData | null>(null);

  // calculate total portfolio value for this tournament
  const totalValue =
    agentStates?.reduce(
      (sum, state) => sum + parseFloat(state.portfolio_value_usd),
      0,
    ) || 0;
>>>>>>> Stashed changes

  // Handle agent click
  const handleAgentClick = (agentState: AgentState, agent: Agent | undefined, portfolioValue: number, percentOfTotal: number) => {
    setSelectedAgent({ agentState, agent, portfolioValue, percentOfTotal });
  };

  // Close modal
  const closeModal = () => {
    setSelectedAgent(null);
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40
                 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg
                 p-6 flex flex-col h-[480px]"
      key={tournamentId}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
            <svg width="20" height="20" fill="#FFD700">
              <circle cx="10" cy="10" r="6" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Agent Positions</h3>
            <p className="text-xs text-gray-400">Tournament #{tournamentId}</p>
          </div>
        </div>
      </div>

      {/* LIST (scrollable middle section) */}
      <div
        className="flex-1 space-y-3 overflow-y-auto pr-2
                   scrollbar-thin scrollbar-thumb-[#FFD700]/40 
                   scrollbar-track-transparent"
      >
        {positions.length === 0 ? (
          <p className="text-center text-gray-400 py-6">
            No positions for this tournament
          </p>
        ) : (
<<<<<<< Updated upstream
          positions.map((p, index) => {
            const pct = totalValue > 0
              ? (p.current_value_usd / totalValue) * 100
              : 0;

            return (
              <motion.div
                key={`${p.agent_id}-${p.token}-${index}`}
                className="bg-white/5 hover:bg-white/10 rounded-xl p-4 
                           border border-white/10"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
=======
          agentStates.map((agentState, index) => {
            const agent = agents?.find((a) => a.id === agentState.agent_id);
            const agentName = agent?.name || `Agent ${index + 1}`;
            const portfolioValue = parseFloat(agentState.portfolio_value_usd);
            const percentOfTotal =
              totalValue > 0 ? (portfolioValue / totalValue) * 100 : 0;

            // Get top asset from portfolio holdings
            const holdings = (agentState.portfolio as any)?.holdings || {};
            const portfolioEntries = Object.entries(holdings) as [string, number][];
            const topAsset =
              portfolioEntries.length > 0
                ? portfolioEntries.reduce((max, current) =>
                    current[1] > max[1] ? current : max,
                  )
                : null;

            return (
              <motion.div
                key={agentState.agent_id}
                className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 cursor-pointer group relative overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAgentClick(agentState, agent, portfolioValue, percentOfTotal)}
>>>>>>> Stashed changes
              >
                {/* TOKEN + VALUE */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br
                                    from-blue-500 to-cyan-500 
                                    flex items-center justify-center 
                                    text-white font-bold">
                      {p.token[0]}
                    </div>

                    <div>
                      <p className="font-bold text-white">{p.token}</p>
                      <p className="text-xs text-gray-400">
                        {p.amount} {p.token}
                      </p>
                    </div>
                  </div>

                  <p className="font-bold text-white">
                    ${p.current_value_usd.toLocaleString()}
                  </p>
                </div>

                {/* ALLOCATION BAR */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Portfolio allocation</span>
                    <span className="text-[#FFD700] font-semibold">
                      {pct.toFixed(1)}%
                    </span>
                  </div>

                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFC300]"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* SUMMARY (sticky bottom section) */}
      {positions.length > 0 && (
        <div className="border-t border-white/10 mt-4 pt-4">
          <div className="bg-[#FFD700]/10 p-4 rounded-xl border border-[#FFD700]/20">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Total Portfolio Value</span>

              <div className="text-right">
                <p className="text-2xl font-bold text-[#FFD700]">
                  ${totalValue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {positions.length} assets
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
<<<<<<< Updated upstream
=======

      {/* bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-30" />

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          onClick={closeModal}
        >
          <div
            className="bg-[#001D3D] border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {selectedAgent.agent?.avatar_url ? (
                    <img
                      src={selectedAgent.agent.avatar_url}
                      alt={selectedAgent.agent?.name || 'Agent'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (selectedAgent.agent?.name || 'A')[0].toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedAgent.agent?.name || 'Unknown Agent'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Rank #{selectedAgent.agentState.rank}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Portfolio Value */}
              <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#FFC300]/5 rounded-xl p-4 border border-[#FFD700]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-[#FFD700]" />
                  <span className="text-sm text-gray-400" title="Total value of cash + holdings">Portfolio Value</span>
                </div>
                <p className="text-3xl font-bold text-[#FFD700]">
                  ${selectedAgent.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedAgent.percentOfTotal.toFixed(1)}% of tournament total
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400" title="Number of trades executed">Total Trades</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {selectedAgent.agentState.trades_count}
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400" title="Trading strategy approach">Strategy</span>
                  </div>
                  <p className="text-lg font-bold text-white truncate">
                    {selectedAgent.agent?.strategy_type || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Last Decision */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400 uppercase" title="Most recent trading decision">Last Decision</span>
                </div>
                <p className="text-sm text-white leading-relaxed">
                  {selectedAgent.agentState.last_decision || 'No decision recorded'}
                </p>
              </div>

              {/* Personality */}
              {selectedAgent.agent?.personality && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-gray-400 uppercase" title="Agent's trading personality type">Personality</span>
                  </div>
                  <p className="text-sm text-white leading-relaxed">
                    {selectedAgent.agent.personality}
                  </p>
                </div>
              )}

              {/* Portfolio Holdings - Only show actual crypto holdings, not all portfolio fields */}
              {(() => {
                const portfolio = selectedAgent.agentState.portfolio as any;
                const holdings = portfolio?.holdings || {};
                const hasHoldings = Object.keys(holdings).length > 0;

                return hasHoldings && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <PieChart className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-gray-400 uppercase" title="Crypto assets currently owned">Holdings</span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(holdings).map(([asset, amount]) => (
                        <div key={asset} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <span className="text-sm text-white font-medium">{asset}</span>
                          <span className="text-sm text-gray-400">{(amount as number).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Updated At */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>
                  Last updated: {new Date(selectedAgent.agentState.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
>>>>>>> Stashed changes
    </motion.div>
  );
}
