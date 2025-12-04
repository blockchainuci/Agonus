"use client";

import { motion } from "framer-motion";

// BACKEND FORMAT — do not add fields
export interface Position {
  agent_id: string;
  tournament_id: string;
  token: string;
  amount: number;
  current_value_usd: number;
}

// TEMP MOCK (will be replaced with real hook)
import { mockPositions } from "@/app/home/data/mockPositions";

export default function AgentPositions({ tournamentId }: { tournamentId: number }) {
  // Filter for this tournament only
  const positions: Position[] = mockPositions.filter(
    (p) => String(p.tournament_id) === String(tournamentId)
  );

  // Total portfolio value
  const totalValue = positions.reduce(
    (sum, p) => sum + p.current_value_usd,
    0
  );

  return (
    <motion.div
      className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40
                 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg p-6"
      key={tournamentId}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
            <svg width="20" height="20" fill="#FFD700"><circle cx="10" cy="10" r="6" /></svg>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Agent Positions</h3>
            <p className="text-xs text-gray-400">Tournament #{tournamentId}</p>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {positions.length === 0 ? (
          <p className="text-center text-gray-400 py-6">
            No positions for this tournament
          </p>
        ) : (
          positions.map((p, index) => {
            const pct =
              totalValue > 0 ? (p.current_value_usd / totalValue) * 100 : 0;

            return (
              <motion.div
                key={`${p.agent_id}-${p.token}-${index}`}
                className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* TOKEN + VALUE */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br
                                    from-blue-500 to-cyan-500 
                                    flex items-center justify-center text-white font-bold">
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

      {/* SUMMARY */}
      {positions.length > 0 && (
        <div className="border-t border-white/10 mt-6 pt-6">
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
    </motion.div>
  );
}
