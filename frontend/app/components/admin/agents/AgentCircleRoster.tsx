"use client";

import { Agent } from "@/types/admin";
import { motion } from "framer-motion";
import { useState } from "react";

interface AgentCircleRosterProps {
  agents: Agent[];
}

export default function AgentCircleRoster({ agents }: AgentCircleRosterProps) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      {agents.map((agent, index) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative flex flex-col items-center"
          onMouseEnter={() => setHoveredAgent(agent.id)}
          onMouseLeave={() => setHoveredAgent(null)}
        >
          {/* Avatar Circle */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-110 hover:border-blue-400">
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agent.name)}`}
                alt={agent.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Hover Stats Tooltip */}
            {hoveredAgent === agent.id && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-64 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-xl"
              >
                <h3 className="text-white font-semibold mb-2">{agent.name}</h3>
                <p className="text-gray-400 text-xs mb-3">{agent.personality}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Strategy:</span>
                    <span className="text-blue-400 font-medium">{agent.strategy_type}</span>
                  </div>

                  {agent.stats.total_tournaments !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Tournaments:</span>
                      <span className="text-white">{agent.stats.total_tournaments}</span>
                    </div>
                  )}

                  {agent.stats.wins !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Wins:</span>
                      <span className="text-green-400 font-medium">{agent.stats.wins}</span>
                    </div>
                  )}

                  {agent.stats.win_rate !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Win Rate:</span>
                      <span className="text-yellow-400 font-medium">
                        {(agent.stats.win_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {agent.stats.total_trades !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Trades:</span>
                      <span className="text-white">{agent.stats.total_trades}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Agent Name */}
          <p className="mt-3 text-white font-medium text-center">{agent.name}</p>
          <p className="text-xs text-gray-400 text-center">{agent.strategy_type}</p>
        </motion.div>
      ))}
    </div>
  );
}
