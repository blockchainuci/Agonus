'use client';

import { motion } from 'framer-motion';
import { BarChart2, Trophy, Loader2 } from 'lucide-react';
import { useBettingPools } from '@/src/hooks/useBettingPools';
import { useEthPrice } from '@/src/hooks/useEthPrice';
import { useAgents } from '@/src/hooks/useAgents';
import { findAgentById } from '@/src/util/findAgentById';

interface BettingPoolChartProps {
  tournamentId: string;
}

export default function BettingPoolChart({ tournamentId }: BettingPoolChartProps) {
  const { data: pools, isLoading } = useBettingPools(tournamentId);
  const { ethPriceUsd } = useEthPrice();
  const { data: agents } = useAgents();

  const nonZeroPools = (pools ?? [])
    .filter(p => parseFloat(p.total_eth) > 0)
    .sort((a, b) => parseFloat(b.total_eth) - parseFloat(a.total_eth));

  const maxEth = nonZeroPools.length > 0 ? parseFloat(nonZeroPools[0].total_eth) : 1;
  const topAgent = nonZeroPools[0] ?? null;

  return (
    <motion.div
      className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg p-6 h-[720px] flex flex-col"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Betting Pools</h3>
            <p className="text-xs text-gray-400">ETH staked per agent</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        ) : nonZeroPools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <BarChart2 className="w-8 h-8 text-white/10 mb-2" />
            <p className="text-gray-400 text-sm">No bets placed yet</p>
            <p className="text-gray-600 text-xs mt-1">
              Betting pool data will appear here once bets are placed
            </p>
          </div>
        ) : (
          <>
            {/* Most Backed badge */}
            {topAgent && (
              <div className="bg-gradient-to-r from-[#FFD700]/15 to-[#FFC300]/5 rounded-xl p-3 border border-[#FFD700]/30 flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-[#FFD700] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400">Most Backed</p>
                  <p className="text-sm font-bold text-[#FFD700] truncate">{topAgent.agent_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">
                    {parseFloat(topAgent.total_eth).toFixed(4)} ETH
                  </p>
                  {ethPriceUsd && (
                    <p className="text-xs text-gray-400">
                      ≈ ${(parseFloat(topAgent.total_eth) * ethPriceUsd).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bars */}
            {nonZeroPools.map((pool, index) => {
              const ethVal = parseFloat(pool.total_eth);
              const barWidth = maxEth > 0 ? (ethVal / maxEth) * 100 : 0;
              const agent = findAgentById(agents, pool.agent_id);
              const agentName = agent?.name ?? pool.agent_name;
              const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agentName)}`;

              return (
                <div key={pool.agent_id} className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt={agentName}
                      className="w-7 h-7 rounded-full shrink-0"
                    />
                    <span className="text-sm text-white truncate flex-1">{agentName}</span>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-white">{ethVal.toFixed(4)} ETH</p>
                      {ethPriceUsd && (
                        <p className="text-xs text-gray-400">
                          ≈ ${(ethVal * ethPriceUsd).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </motion.div>
  );
}
