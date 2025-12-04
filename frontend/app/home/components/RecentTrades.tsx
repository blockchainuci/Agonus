'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Filter,
  Download,
} from 'lucide-react';

import { mockTrades } from "@/app/home/data/mockTrades";
import { mockTournaments } from "@/app/home/data/mockTournament";

// -------- BACKEND FORMAT (DO NOT MODIFY) --------
export interface Trade {
  price: number;      
  amount: number;    
  timestamp: string; 
}

// -------- UI-ONLY FIELDS (SAFE TO MODIFY) --------
interface EnrichedTrade extends Trade {
  id: number;
  agent_id: number;
  tournament_id: number;
  action: "buy" | "sell";
  token: string;
  amount_usd: number;
  price_usd: number;
  isBuy: boolean;
  timeAgo: string;
  formattedAmount: string;
  formattedPrice: string;
}

interface RecentTradesProps {
  tournamentId: number;
}

export default function RecentTrades({ tournamentId }: RecentTradesProps) {

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
  };

  // -------------------------------
  // ENRICH BACKEND + MOCK DATA
  // -------------------------------
  const enriched: EnrichedTrade[] = mockTrades
  .filter((t) => String(t.tournament_id) === String(tournamentId))
  .map((t) => ({
    ...t,

    // Narrow type: convert string → literal union
    action: t.action.toLowerCase() as "buy" | "sell",

    // backend required fields
    price: t.price_usd,
    amount: t.amount_usd,

    // ui-only
    isBuy: t.action.toLowerCase() === "buy",
    timeAgo: formatTime(t.timestamp),
    formattedAmount: formatCurrency(t.amount_usd),
    formattedPrice: `$${t.price_usd.toLocaleString()}`,
  }));


  const tournament = mockTournaments.find((t) => t.id === tournamentId);
  const isLiveTournament = tournament?.status === "LIVE";

  return (
    <motion.div
      className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg p-6 relative overflow-hidden"
      key={tournamentId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Recent Trades</h3>
            <p className="text-xs text-gray-400">
              Tournament #{tournamentId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors">
            <Filter className="w-4 h-4 text-gray-400" />
          </motion.button>

          <motion.button className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors">
            <Download className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* Trades list */}
      <div className="space-y-2 max-h-[500px] overflow-y-scroll pr-2 custom-scrollbar relative z-10">
        {enriched.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">No trades for this tournament</p>
          </div>
        ) : (
          enriched.map((trade, index) => (
            <motion.div
              key={trade.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.01] cursor-pointer group relative overflow-hidden ${
                trade.isBuy
                  ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10"
                  : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Left */}
              <div className="flex items-center gap-3 relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    trade.isBuy ? "bg-green-500/20" : "bg-red-500/20"
                  }`}
                >
                  {trade.isBuy ? (
                    <ArrowUpRight className="w-5 h-5 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-bold text-xs uppercase ${
                        trade.isBuy ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {trade.action}
                    </span>
                    <span className="font-semibold text-white">
                      {trade.token}
                    </span>
                  </div>

                  <p className="text-sm text-gray-400">
                    Amount: {trade.formattedAmount}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="text-right relative z-10">
                <p className="font-bold text-white mb-1">
                  {trade.formattedPrice}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                  <Clock className="w-3 h-3" />
                  {trade.timeAgo}
                </div>
              </div>

              {/* Pulse indicator */}
              {index === 0 && isLiveTournament && (
                <motion.div
                  className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                    trade.isBuy ? "bg-green-400" : "bg-red-400"
                  }`}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
