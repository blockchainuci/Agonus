'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  PieChart,
  Sparkles,
  X,
  Brain,
  DollarSign,
  Trophy,
  Activity,
  Coins,
  Info,
} from 'lucide-react';
import { useTournamentAgentStates } from '@/src/hooks/useAgentStates';
import { useAgents } from '@/src/hooks/useAgents';
import { AgentState } from '@/src/types';

interface AgentPositionsProps {
  tournamentId: string;
}

// Tooltip component for explaining metrics
function MetricTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <Info
        className="w-3.5 h-3.5 text-gray-500 hover:text-blue-400 cursor-help transition-colors inline-block ml-1"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-gray-700 w-64 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentPositions({ tournamentId }: AgentPositionsProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);

  // Fetch real data from backend
  const { data: agentStates, isLoading: statesLoading } =
    useTournamentAgentStates(tournamentId);
  const { data: agents, isLoading: agentsLoading } = useAgents();

  const isLoading = statesLoading || agentsLoading;

  // calculate total portfolio value for this tournament
  const totalValue =
    agentStates?.reduce(
      (sum, state) => sum + parseFloat(state.portfolio_value_usd),
      0,
    ) || 0;

  return (
    <>
      <motion.div
        className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg p-6 h-fit relative overflow-hidden"
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
        <div className="space-y-3 mb-6 relative z-10">
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

              // Get top asset from portfolio
              const portfolioEntries = Object.entries(
                agentState.portfolio as Record<string, number>,
              );
              const topAsset =
                portfolioEntries.length > 0
                  ? portfolioEntries.reduce((max, current) =>
                      current[1] > max[1] ? current : max,
                    )
                  : null;

              return (
                <motion.div
                  key={agentState.agent_id}
                  className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 transition-all cursor-pointer group relative overflow-hidden"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedAgent(agentState)}
                >
                  {/* background gradient on hover */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FFD700]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    {/* agent info row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* agent avatar or icon */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">
                          {agent?.avatar_url ? (
                            <img
                              src={agent.avatar_url}
                              alt={agentName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            agentName[0].toUpperCase()
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-white">{agentName}</p>
                          <p className="text-xs text-gray-400">
                            Rank #{agentState.rank} •{' '}
                            {agentState.trades_count} trades
                          </p>
                        </div>
                      </div>

                      {/* value and rank */}
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
                  <p className="text-xl font-bold text-[#FFD700]">
                    ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {agentStates.length} agent{agentStates.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Agent Detail Modal */}
      {selectedAgent && (() => {
        const agent = agents?.find((a) => a.id === selectedAgent.agent_id);
        const portfolioValue = parseFloat(selectedAgent.portfolio_value_usd);

        return (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setSelectedAgent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedAgent(null)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* Agent Header */}
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-white/10">
                {agent?.avatar_url ? (
                  <img
                    src={agent.avatar_url}
                    alt={agent.name}
                    className="w-20 h-20 rounded-full border-2 border-purple-500/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border-2 border-purple-500/30">
                    <Brain className="w-10 h-10 text-purple-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{agent?.name || 'Unknown Agent'}</h2>
                    <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-lg">
                      <Trophy className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-bold text-purple-300">Rank #{selectedAgent.rank}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 mb-2">{agent?.strategy_type || 'Strategy N/A'}</p>
                  <p className="text-sm text-gray-500">{agent?.personality || 'No personality defined'}</p>
                </div>
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Portfolio Value */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-1 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">
                      Portfolio Value
                      <MetricTooltip text="Total value of the agent's portfolio including all assets and cash." />
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Rank */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-1 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-400">
                      Rank
                      <MetricTooltip text="Current ranking in the tournament based on portfolio value. Lower numbers are better." />
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">
                    #{selectedAgent.rank}
                  </p>
                </div>

                {/* Total Trades */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-1 mb-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-gray-400">
                      Total Trades
                      <MetricTooltip text="Total number of trades executed by this agent during the tournament." />
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">{selectedAgent.trades_count}</p>
                </div>

                {/* Assets Held */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-1 mb-2">
                    <Coins className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-400">
                      Assets Held
                      <MetricTooltip text="Number of different assets currently in the portfolio." />
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {Object.keys(selectedAgent.portfolio).length}
                  </p>
                </div>
              </div>

              {/* Portfolio Holdings */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  Portfolio Holdings
                  <MetricTooltip text="Individual crypto/token assets currently owned by the agent. Shows the quantity of each asset. If empty, the agent is 100% in cash (no positions)." />
                </h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  {Object.keys(selectedAgent.portfolio).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(selectedAgent.portfolio).map(([asset, quantity]) => (
                        <div key={asset} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <span className="text-gray-300 font-medium">{asset}</span>
                          <span className="text-white font-semibold">{quantity.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-2">No assets currently held</p>
                      <p className="text-xs text-gray-600">Agent is 100% in cash (no open positions)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Decision */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Latest Decision
                </h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-gray-300">{selectedAgent.last_decision || 'No decision recorded yet'}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Updated: {new Date(selectedAgent.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </>
  );
}
