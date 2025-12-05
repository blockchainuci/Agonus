'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, XCircle, Clock, Zap, Hourglass } from "lucide-react";

import { mockBets } from "@/app/home/data/mockBets";
import { mockTournaments } from "@/app/home/data/mockTournament";
import { ClaimWinnings } from "@/src/betting/ClaimWinnings";

// ---------------------------------------
// Backend Bet Format (Do Not Modify)
// ---------------------------------------
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

interface ActiveBetsProps {
  tournamentId: number;
}

// ---------------------------------------
// UI - Enriched Bet
// ---------------------------------------
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

  // ---------------------------------------
  // Tournament Status
  // ---------------------------------------
  const tournament = mockTournaments.find((t) => t.id === tournamentId);
  const isLive = tournament?.status === "LIVE";
  const isEnded = tournament?.status === "ENDED";

  // ---------------------------------------
  // Enrich Backend Bets
  // ---------------------------------------
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

  // ---------------------------------------
  // Mock Claim Function (replace with Web3)
  // ---------------------------------------
  const handleClaim = async (bet: EnrichedBet): Promise<void> => {
    console.log("Claim clicked:", bet);
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));
    console.log("Claim complete!");
  };

  return (
    <div className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 p-6">

      {/* HEADER */}
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

      {/* FILTER TABS */}
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

      {/* BETS LIST */}
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
                {/* Agent bubble */}
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

                {/* Status Badge */}
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

              {/* CLAIM LOGIC */}
              {filter === "past" && bet.status === "won" && bet.payout && bet.payout > 0 && (
                <div className="mt-4">

                  {/* 🔵 If tournament LIVE → show pending */}
                  {isLive && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-3 py-2 rounded-lg flex items-center gap-2">
                      <Hourglass className="w-4 h-4" />
                      <p className="text-sm font-medium">Pending settlement — tournament still live</p>
                    </div>
                  )}

                  {/* 🟢 If tournament ENDED → allow claim */}
                  {isEnded && (
                    <ClaimWinnings
                      payoutAmountEth={bet.payout.toString()}
                      tournamentId={Number(bet.tournament_id)}
                      alreadyClaimed={false}
                      onClaim={() => handleClaim(bet)}
                    />
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
