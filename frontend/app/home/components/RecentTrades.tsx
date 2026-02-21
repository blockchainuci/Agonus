"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Filter,
  Download,
  X,
  Hash,
  DollarSign,
  Calendar,
  TrendingUp,
  Coins,
} from "lucide-react";
import { useTournamentTrades } from "@/src/hooks/useTrades";
import { useAgents } from "@/src/hooks/useAgents";
import { useTournament } from "@/src/hooks/useTournaments";
import { Trade } from "@/src/types";
import { findAgentById } from "@/src/util/findAgentById";

interface RecentTradesProps {
  tournamentId: string;
}

// Crypto token logos mapping
const TOKEN_LOGOS: Record<string, string> = {
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  WETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  CBBTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  TBTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
  AVAX: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  LINK: "https://cryptologos.cc/logos/chainlink-link-logo.png",
  SUI: "https://cryptologos.cc/logos/sui-sui-logo.png",
  BNB: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  DOGE: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
  XRP: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
  TRX: "https://cryptologos.cc/logos/tron-trx-logo.png",
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
};

// Filter options
type ActionFilter = "all" | "buy" | "sell";

export default function RecentTrades({ tournamentId }: RecentTradesProps) {
  const { data: trades, isLoading } = useTournamentTrades(tournamentId);
  const { data: agents } = useAgents();
  const { data: tournament } = useTournament(tournamentId);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Close modal
  const closeModal = () => {
    setSelectedTrade(null);
  };

  // Get unique assets from trades
  const uniqueAssets = useMemo(() => {
    if (!trades) return [];
    const assets = new Set(trades.map((t) => t.asset));
    return Array.from(assets);
  }, [trades]);

  // Apply filters
  const filteredTrades = useMemo(() => {
    if (!trades) return [];
    return trades.filter((trade) => {
      // Action filter
      if (
        actionFilter !== "all" &&
        trade.action.toLowerCase() !== actionFilter
      ) {
        return false;
      }
      // Asset filter
      if (assetFilter !== "all" && trade.asset !== assetFilter) {
        return false;
      }
      return true;
    });
  }, [trades, actionFilter, assetFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTrades.length === 0) return;

    const headers = [
      "ID",
      "Action",
      "Asset",
      "Amount",
      "Price",
      "Timestamp",
      "Amount USD",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredTrades.map((trade) =>
        [
          trade.id,
          trade.action,
          trade.asset,
          trade.amount,
          trade.price,
          trade.timestamp,
          parseFloat(trade.amount) * parseFloat(trade.price),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `trades_tournament_${tournamentId}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all filters
  const clearFilters = () => {
    setActionFilter("all");
    setAssetFilter("all");
  };

  const hasActiveFilters = actionFilter !== "all" || assetFilter !== "all";

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

  const getTokenLogo = (asset: string) => {
    return TOKEN_LOGOS[asset] || null;
  };

  return (
    <motion.div
      className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: "#0a0e17", border: "1px solid rgba(255,255,255,0.05)" }}
      key={tournamentId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* header */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-4 relative z-20"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent Trades</h3>
            <p className="text-[11px] text-zinc-500">
              {tournament?.name || "Loading..."}
            </p>
          </div>
        </div>

        {/* inline volume summary */}
        {filteredTrades.length > 0 && (
          <div className="flex items-center gap-3 mx-4">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Buy</span>
              <span className="text-[12px] font-bold text-emerald-400 tabular-nums">
                ${filteredTrades
                  .filter((t: Trade) => t.action.toLowerCase() === "buy")
                  .reduce((sum: number, t: Trade) => sum + parseFloat(t.amount) * parseFloat(t.price), 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Sell</span>
              <span className="text-[12px] font-bold text-red-400 tabular-nums">
                ${filteredTrades
                  .filter((t: Trade) => t.action.toLowerCase() === "sell")
                  .reduce((sum: number, t: Trade) => sum + parseFloat(t.amount) * parseFloat(t.price), 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}

        {/* action buttons */}
        <div className="flex items-center gap-2">
          {/* Filter button */}
          <div className="relative">
            <button
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                hasActiveFilters
                  ? "bg-amber-500/15 border-amber-500/25 text-amber-400"
                  : "bg-white/5 hover:bg-white/8 border-white/8 text-zinc-500"
              }`}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full text-[8px] text-white flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* Filter dropdown menu */}
            {showFilterMenu && (
              <div className="absolute right-0 top-12 w-64 bg-[#0d1422] border border-white/10 rounded-xl shadow-2xl p-4 z-[100]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Filters</h4>
                  <button
                    onClick={() => setShowFilterMenu(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Action filter */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white pb-3">
                    Actions
                  </h4>
                  <div className="flex gap-2">
                    {(["all", "buy", "sell"] as ActionFilter[]).map(
                      (action) => (
                        <button
                          key={action}
                          onClick={() => setActionFilter(action)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                            actionFilter === action
                              ? action === "buy"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                : action === "sell"
                                  ? "bg-red-500/15 text-red-400 border border-red-500/25"
                                  : "bg-white/10 text-white border border-white/15"
                              : "bg-white/5 text-zinc-500 border border-white/8 hover:bg-white/8"
                          }`}
                        >
                          {action.charAt(0).toUpperCase() + action.slice(1)}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Asset filter */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white pb-3">
                    Assets
                  </h4>
                  <select
                    value={assetFilter}
                    onChange={(e) => setAssetFilter(e.target.value)}
                    className="w-full bg-[#0a0e17] border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 cursor-pointer appearance-none"
                  >
                    <option value="all">All Assets</option>
                    {uniqueAssets.map((asset) => (
                      <option key={asset} value={asset}>
                        {asset}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear filters button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Download button */}
          <button
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
              filteredTrades.length > 0
                ? "bg-white/5 hover:bg-white/10 border-white/10 text-gray-400 hover:text-green-400"
                : "bg-white/5 border-white/10 text-gray-600 cursor-not-allowed"
            }`}
            onClick={handleExportCSV}
            disabled={filteredTrades.length === 0}
            title={
              filteredTrades.length > 0
                ? "Export to CSV"
                : "No trades to export"
            }
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-4 px-6 relative z-10">
          <span className="text-xs text-gray-400">Active filters:</span>
          {actionFilter !== "all" && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                actionFilter === "buy"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {actionFilter.toUpperCase()}
            </span>
          )}
          {assetFilter !== "all" && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
              {assetFilter}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-white ml-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* trades list */}
      <div className="space-y-2 flex-1 min-h-0 overflow-y-auto px-6 py-3 custom-scrollbar relative z-10">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading trades...</p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">
              No trades for this tournament
            </p>
          </div>
        ) : (
          filteredTrades.map((trade, index: number) => {
            const isBuy = trade.action.toLowerCase() === "buy";
            const amount = parseFloat(trade.amount);
            const price = parseFloat(trade.price);
            const amountUsd = amount * price;
            const logoUrl = getTokenLogo(trade.asset);

            return (
              <motion.div
                key={trade.id}
                className="flex items-center justify-between p-4 rounded-xl border cursor-pointer group relative overflow-hidden transition-colors hover:bg-white/[0.02]"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedTrade(trade)}
              >
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: isBuy ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.04)" }}
                />

                {/* left side: icon + info */}
                <div className="flex items-center gap-3 relative z-10">
                  {/* action icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isBuy ? "bg-green-500/20" : "bg-red-500/20"
                    }`}
                  >
                    {isBuy ? (
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    )}
                  </div>

                  <div>
                    {/* trade action & token with logo */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-bold text-xs uppercase ${
                          isBuy ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {trade.action}
                      </span>
                      <div className="flex items-center gap-2">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={trade.asset}
                            className="w-5 h-5 rounded-full bg-white/10"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-[8px] font-bold text-white">
                            {trade.asset.slice(0, 2)}
                          </div>
                        )}
                        <span className="font-semibold text-white text-sm">
                          {trade.asset}
                        </span>
                      </div>
                    </div>

                    {/* amount */}
                    <p className="text-sm text-gray-400">
                      Amount: {formatCurrency(amountUsd)}
                    </p>
                  </div>
                </div>

                {/* right side: price + time */}
                <div className="text-right relative z-10">
                  <p className="font-bold text-white mb-1">
                    ${price.toLocaleString()}
                  </p>

                  <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                    <Clock className="w-3 h-3" />
                    {formatTime(trade.timestamp)}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>



      {/* Trade Detail Modal */}
      {selectedTrade &&
        (() => {
          const isBuy = selectedTrade.action.toLowerCase() === "buy";
          const amount = parseFloat(selectedTrade.amount);
          const price = parseFloat(selectedTrade.price);
          const totalValue = amount * price;
          const agent = findAgentById(agents, selectedTrade.agent_id);
          const logoUrl = getTokenLogo(selectedTrade.asset);

          const cardStyle = {
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          };
          const accentColor = isBuy ? "#10b981" : "#ef4444";

          return (
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
              onClick={closeModal}
            >
              <div
                className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                style={{ background: "#0a0e17", border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div
                  className="flex items-center justify-between p-6"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
                    >
                      {isBuy ? (
                        <ArrowUpRight className="w-6 h-6" style={{ color: accentColor }} />
                      ) : (
                        <ArrowDownRight className="w-6 h-6" style={{ color: accentColor }} />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={selectedTrade.asset}
                          className="w-9 h-9 rounded-full"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: "rgba(255,255,255,0.08)" }}
                        >
                          {selectedTrade.asset.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-bold" style={{ color: accentColor }}>
                          {selectedTrade.action.toUpperCase()}
                        </h2>
                        <p className="text-sm font-semibold text-white">{selectedTrade.asset}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.05]"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-3">
                  {/* Total Value */}
                  <div className="rounded-xl p-4" style={{ background: `${accentColor}0f`, border: `1px solid ${accentColor}25` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <DollarSign className="w-4 h-4 text-zinc-500" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.12em]">Total Value</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: accentColor }}>
                      ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-4" style={cardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.12em]">Amount</span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">{selectedTrade.asset}</p>
                    </div>
                    <div className="rounded-xl p-4" style={cardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.12em]">Price</span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        ${price.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">per {selectedTrade.asset}</p>
                    </div>
                  </div>

                  {/* Agent Info */}
                  <div className="rounded-xl p-4" style={cardStyle}>
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-3.5 h-3.5 text-zinc-600" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.12em]">Executed By</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <img
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agent?.name || selectedTrade.agent_id)}`}
                          alt={agent?.name || "Agent"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-white">
                          {agent?.name || `Agent ${selectedTrade.agent_id.slice(0, 8)}...`}
                        </p>
                        <p className="text-xs text-zinc-600">{agent?.strategy_type || ""}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trade ID */}
                  <div className="rounded-xl p-4" style={cardStyle}>
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-3.5 h-3.5 text-zinc-600" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.12em]">Trade ID</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono break-all">{selectedTrade.id}</p>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-600 pt-1">
                    <Calendar className="w-3 h-3" />
                    <span>Executed: {new Date(selectedTrade.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </motion.div>
  );
}
