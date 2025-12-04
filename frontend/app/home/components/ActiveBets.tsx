'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, XCircle, Clock, Zap } from "lucide-react";

import { mockBets } from "@/app/home/data/mockBets";

interface ActiveBetsProps {
  tournamentId: number;
}

// ------------------------------
// BACKEND FORMAT — DO NOT MODIFY
// ------------------------------
export interface Bet {
  id: string;
  tournament_id: string;
  user_address: string;
  agent_id: string;
  amount: number;
  direction: "up" | "down";
  settled: boolean;
  payout: number | null;
  created_at: string;
}

// ------------------------------
// UI-only enrichment
// ------------------------------
interface EnrichedBet extends Bet {
  status: "active" | "won" | "lost";
}

function getBetStatus(b: Bet): "active" | "won" | "lost" {
  if (!b.settled) return "active";
  if (b.payout && b.payout > 0) return "won";
  return "lost";
}

const getAgentColor = (id: string) =>
  ({
    "1": "from-blue-500 to-cyan-500",
    "2": "from-purple-500 to-pink-500",
    "3": "from-green-500 to-emerald-500",
  }[id] || "from-gray-500 to-slate-500");

export default function ActiveBets({ tournamentId }: ActiveBetsProps) {
  const [filter, setFilter] = useState<"active" | "past">("active");

  // ------------------------------
  // Enrich backend data for UI use
  // ------------------------------
  const enriched: EnrichedBet[] = mockBets.map((b) => ({
    ...b,
    status: getBetStatus(b),
  }));

  const active = enriched.filter(
    (b) => b.status === "active" && b.tournament_id === String(tournamentId)
  );

  const past = enriched.filter(
    (b) => b.status !== "active" && b.tournament_id === String(tournamentId)
  );

  const displayed = filter === "active" ? active : past;

  return (
    <div className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your Bets</h3>
            <p className="text-xs text-gray-400">Tournament #{tournamentId}</p>
          </div>
        </div>

        <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
          <span className="text-xs text-cyan-400 font-semibold">
            {displayed.length} Bets
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-lg">
        <button
          onClick={() => setFilter("active")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold ${
            filter === "active"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Active ({active.length})
        </button>

        <button
          onClick={() => setFilter("past")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold ${
            filter === "past"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Past ({past.length})
        </button>
      </div>

      {/* Bets List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        <AnimatePresence>
          {displayed.map((bet, index) => (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10"
            >
              {/* TOP ROW */}
              <div className="flex items-center justify-between mb-3">
                
                {/* Agent pill */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAgentColor(
                      bet.agent_id
                    )} flex items-center justify-center text-white font-bold`}
                  >
                    {bet.agent_id}
                  </div>

                  <div>
                    <p className="font-bold text-white text-sm">
                      Agent #{bet.agent_id}
                    </p>

                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      {bet.direction === "up" ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span>{bet.direction.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                {bet.status === "active" && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span className="text-xs text-cyan-400 font-semibold uppercase">
                      Active
                    </span>
                  </div>
                )}

                {bet.status === "won" && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                    <Trophy className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400 font-semibold uppercase">
                      Won +{bet.payout} ETH
                    </span>
                  </div>
                )}

                {bet.status === "lost" && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                    <XCircle className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400 font-semibold uppercase">
                      Lost
                    </span>
                  </div>
                )}
              </div>

              {/* AMOUNT + TIMESTAMP */}
              <div className="pt-3 border-t border-white/5">
                <p className="text-xs text-gray-400 mb-1">Bet Amount</p>
                <p className="font-bold text-white text-lg mb-1">
                  {bet.amount} ETH
                </p>

                <p className="text-[10px] text-gray-500">
                  Placed: {new Date(bet.created_at).toLocaleString()}
                </p>
              </div>

            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
