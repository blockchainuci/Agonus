'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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


// -------------------------------------
// Backend Trade Type
// -------------------------------------
export interface Trade {
  price: number;
  amount: number;
  timestamp: string;
}


// -------------------------------------
// Enriched Trade Type
// -------------------------------------
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

  // -------------------------------------
  // TIME FORMATTER
  // -------------------------------------
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


  // -------------------------------------
  // FILTER STATE (Advanced Panel)
  // -------------------------------------
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const uniqueTokens = Array.from(new Set(mockTrades.map((t) => t.token)));

  const [filters, setFilters] = useState({
    buys: true,
    sells: true,
    tokens: {} as Record<string, boolean>,
    minAmount: 0,
    maxAmount: Infinity,
    timeRange: "ALL" as "ALL" | "1H" | "6H" | "24H",
  });

  // Initialize token filters
  useEffect(() => {
    setFilters((f) => ({
      ...f,
      tokens: Object.fromEntries(uniqueTokens.map((t) => [t, true])),
    }));
  }, []);


  // -------------------------------------
  // ENRICH BACKEND TRADES
  // -------------------------------------
  const enriched = useMemo(() => {
    let list: EnrichedTrade[] = mockTrades
      .filter((t) => String(t.tournament_id) === String(tournamentId))
      .map((t) => ({
        ...t,
        action: t.action.toLowerCase() as "buy" | "sell",
        price: t.price_usd,
        amount: t.amount_usd,
        isBuy: t.action.toLowerCase() === "buy",
        timeAgo: formatTime(t.timestamp),
        formattedAmount: formatCurrency(t.amount_usd),
        formattedPrice: `$${t.price_usd.toLocaleString()}`,
      }));


    // -------------------------------------
    // APPLY FILTERS
    // -------------------------------------
    list = list.filter((t) => {
      if (t.isBuy && !filters.buys) return false;
      if (!t.isBuy && !filters.sells) return false;

      if (!filters.tokens[t.token]) return false;

      if (t.amount_usd < filters.minAmount) return false;
      if (t.amount_usd > filters.maxAmount) return false;

      const now = Date.now();
      const diffMs = now - new Date(t.timestamp).getTime();

      if (filters.timeRange === "1H" && diffMs > 3600000) return false;
      if (filters.timeRange === "6H" && diffMs > 21600000) return false;
      if (filters.timeRange === "24H" && diffMs > 86400000) return false;

      return true;
    });

    return list;
  }, [tournamentId, filters]);


  // -------------------------------------
  // EXPORT CSV
  // -------------------------------------
  const exportCSV = () => {
    const header = "action,token,price,amount,timestamp\n";
    const rows = enriched
      .map((t) => `${t.action},${t.token},${t.price_usd},${t.amount_usd},${t.timestamp}`)
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `recent_trades_t${tournamentId}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };


  // -------------------------------------
  // TOURNAMENT INFO
  // -------------------------------------
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
      {/* HEADER */}
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

          {/* FILTER BUTTON */}
          <motion.button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
          >
            <Filter className="w-4 h-4 text-gray-400" />
          </motion.button>

          {/* EXPORT BUTTON */}
          <motion.button
            onClick={exportCSV}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
          >
            <Download className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>
      </div>



      {/* FILTER PANEL */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-black/40 border border-white/10 rounded-xl text-white space-y-4"
          >
            {/* BUY / SELL */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.buys}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, buys: e.target.checked }))
                  }
                />
                <span>Buy Trades</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.sells}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, sells: e.target.checked }))
                  }
                />
                <span>Sell Trades</span>
              </label>
            </div>

            {/* TOKEN FILTERS */}
            <div>
              <p className="text-sm text-gray-300 mb-2">Tokens</p>
              <div className="flex flex-wrap gap-3">
                {uniqueTokens.map((tk) => (
                  <label key={tk} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.tokens[tk]}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          tokens: { ...f.tokens, [tk]: e.target.checked },
                        }))
                      }
                    />
                    <span>{tk}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* AMOUNT RANGE */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Min Amount (USD)"
                className="bg-black/20 border border-white/10 rounded-lg p-2"
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minAmount: Number(e.target.value || 0),
                  }))
                }
              />

              <input
                type="number"
                placeholder="Max Amount (USD)"
                className="bg-black/20 border border-white/10 rounded-lg p-2"
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxAmount: Number(e.target.value || Infinity),
                  }))
                }
              />
            </div>

            {/* TIME FILTER */}
            <select
              className="bg-black/20 border border-white/10 rounded-lg p-2"
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  timeRange: e.target.value as "ALL" | "1H" | "6H" | "24H",
                }))
              }
            >
              <option value="ALL">All Time</option>
              <option value="1H">Last Hour</option>
              <option value="6H">Last 6 Hours</option>
              <option value="24H">Last 24 Hours</option>
            </select>

            <div className="flex justify-between mt-4">
              <button
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
                onClick={() => setShowFilterPanel(false)}
              >
                Apply Filters
              </button>

              <button
                className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500"
                onClick={() =>
                  setFilters({
                    buys: true,
                    sells: true,
                    tokens: Object.fromEntries(uniqueTokens.map((t) => [t, true])),
                    minAmount: 0,
                    maxAmount: Infinity,
                    timeRange: "ALL",
                  })
                }
              >
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* TRADES LIST */}
      <div className="space-y-2 max-h-[500px] overflow-y-scroll pr-2 custom-scrollbar relative z-10">
        {enriched.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">No trades found</p>
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
              {/* LEFT */}
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

              {/* RIGHT */}
              <div className="text-right relative z-10">
                <p className="font-bold text-white mb-1">
                  {trade.formattedPrice}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                  <Clock className="w-3 h-3" />
                  {trade.timeAgo}
                </div>
              </div>

              {/* PULSE FOR LIVE MARKET */}
              {index === 0 && isLiveTournament && (
                <motion.div
                  className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                    trade.isBuy ? "bg-green-400" : "bg-red-400"
                  }`}
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
