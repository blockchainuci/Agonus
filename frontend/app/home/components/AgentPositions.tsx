'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
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
import { useTournament } from '@/src/hooks/useTournaments';
import { AgentState, Agent } from '@/src/types';
import { useBettingStore } from '@/src/store/useBettingStore';
import { useTournamentStore } from '@/src/store/useTournamentStore';

interface AgentPositionsProps {
  tournamentId: string;
}

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
  const { data: tournament } = useTournament(tournamentId);
  const openBetModal = useBettingStore((s) => s.openBetModal);
  const tournamentStatus = useTournamentStore((s) => s.selectedTournamentStatus);

  const isLoading = statesLoading || agentsLoading;

  // State for selected agent modal
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgentData | null>(null);

  // calculate total portfolio value for this tournament
  const totalValue =
    agentStates?.reduce(
      (sum, state) => sum + parseFloat(state.portfolio_value_usd),
      0,
    ) || 0;

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
      className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg p-6 h-[720px] relative overflow-hidden flex flex-col"
      key={tournamentId} // Re-animate when tournament changes
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

      {/* header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Agent Positions</h3>
            <p className="text-xs text-gray-400">Tournament #{tournamentId}</p>
          </div>
        </div>

        {/* view toggle */}
        <motion.button
          className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PieChart className="w-4 h-4 text-gray-400" />
        </motion.button>
      </div>

      {/* positions list */}
      <div className="space-y-3 mb-6 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading agent data...</p>
          </div>
        ) : !agentStates || agentStates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No agents for this tournament</p>
          </div>
        ) : (
          agentStates.map((agentState, index) => {
            const agent = agents?.find((a) => a.id === agentState.agent_id);
            const agentName = agent?.name || `Agent ${index + 1}`;
            const portfolioValue = parseFloat(agentState.portfolio_value_usd);
            const percentOfTotal =
              totalValue > 0 ? (portfolioValue / totalValue) * 100 : 0;

            // Get top asset from portfolio holdings
            const holdings = (agentState.portfolio as { holdings?: Record<string, number> })?.holdings || {};
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
              >
                {/* background gradient on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FFD700]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  {/* agent info row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* agent avatar using DiceBear */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden shadow-lg">
                        <img
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agentName)}`}
                          alt={agentName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <p className="font-bold text-white">{agentName}</p>
                        <p className="text-xs text-gray-400">
                          Rank #{agentState.rank} •{' '}
                          {agentState.trades_count} trades
                        </p>
                      </div>
                    </div>

                  {/* value and actions */}
                  <div className="text-right">
                    <p className="font-bold text-white">
                      ${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1 text-xs justify-end text-gray-400">
                      {topAsset && (
                        <>
                          Top: {topAsset[0]}
                        </>
                      )}
                    </div>
                    {tournamentStatus !== 'ENDED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (tournamentStatus !== 'LIVE') return;
                          openBetModal({
                            tournament_id: tournamentId,
                            agent_id: agentState.agent_id,
                            agent_name: agentName,
                            contract_tournament_id: tournament?.contract_tournament_id ?? null,
                            contract_agent_id:
                              tournament?.agent_contract_mapping?.[agentState.agent_id] ?? null,
                          });
                        }}
                        disabled={tournamentStatus !== 'LIVE'}
                        className="mt-2 inline-flex items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition disabled:opacity-50 disabled:hover:bg-cyan-500/20 disabled:cursor-not-allowed"
                      >
                        {tournamentStatus === 'UPCOMING' ? 'Bet Not Allowed' : 'Place Bet'}
                      </button>
                    )}
                  </div>
                  </div>

                  {/* progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        Tournament share
                      </span>
                      <span className="text-[#FFD700] font-semibold">
                        {percentOfTotal.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFC300] relative overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentOfTotal}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      >
                        {/* shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{
                            x: ['-100%', '200%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: index * 0.3,
                          }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* total portfolio summary */}
      {agentStates && agentStates.length > 0 && (
        <div className="pt-6 border-t border-white/10 relative z-10">
          <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#FFC300]/5 rounded-xl p-4 border border-[#FFD700]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FFD700]" />
                <span className="text-gray-300 text-sm font-medium">
                  Total Portfolio Value
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#FFD700]">
                  ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {agentStates.length} agents
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden shadow-lg">
                  <img
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(selectedAgent.agent?.name || 'Agent')}`}
                    alt={selectedAgent.agent?.name || 'Agent'}
                    className="w-full h-full object-cover"
                  />
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
                const portfolio = selectedAgent.agentState.portfolio as { holdings?: Record<string, number> };
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
    </motion.div>
  );
}
