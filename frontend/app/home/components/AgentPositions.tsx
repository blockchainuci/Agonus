'use client';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Sparkles,
} from 'lucide-react';
import { useTournamentAgentStates } from '@/src/hooks/useAgentStates';
import { useAgents } from '@/src/hooks/useAgents';

interface AgentPositionsProps {
  tournamentId: string;
}

export default function AgentPositions({ tournamentId }: AgentPositionsProps) {
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
    </motion.div>
  );
}
