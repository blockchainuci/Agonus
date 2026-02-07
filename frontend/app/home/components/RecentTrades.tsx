'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useTournamentTrades } from '@/src/hooks/useTrades';
import { useAgents } from '@/src/hooks/useAgents';
import { useTournament } from '@/src/hooks/useTournaments';
import { Trade } from '@/src/types';
import { findAgentById } from '@/src/util/findAgentById';

interface RecentTradesProps {
  tournamentId: string;
}

// Filter options
type ActionFilter = 'all' | 'buy' | 'sell';

export default function RecentTrades({ tournamentId }: RecentTradesProps) {
  const { data: trades, isLoading } = useTournamentTrades(tournamentId);
  const { data: agents } = useAgents();
  const { data: tournament } = useTournament(tournamentId);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');
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
      if (actionFilter !== 'all' && trade.action.toLowerCase() !== actionFilter) {
        return false;
      }
      // Asset filter
      if (assetFilter !== 'all' && trade.asset !== assetFilter) {
        return false;
      }
      return true;
    });
  }, [trades, actionFilter, assetFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTrades.length === 0) return;

    const headers = ['ID', 'Action', 'Asset', 'Amount', 'Price', 'Timestamp', 'Amount USD'];
    const csvContent = [
      headers.join(','),
      ...filteredTrades.map((trade) =>
        [
          trade.id,
          trade.action,
          trade.asset,
          trade.amount,
          trade.price,
          trade.timestamp,
          parseFloat(trade.amount) * parseFloat(trade.price),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trades_tournament_${tournamentId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all filters
  const clearFilters = () => {
    setActionFilter('all');
    setAssetFilter('all');
  };

  const hasActiveFilters = actionFilter !== 'all' || assetFilter !== 'all';

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg p-6 relative overflow-hidden"
      key={tournamentId} // Re-animate when tournament changes
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/*background glow */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* header */}
      <div className="flex items-center justify-between mb-6 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Recent Trades</h3>
            <p className="text-xs text-gray-400">{tournament?.name || 'Loading...'}</p>
          </div>
        </div>

        {/* action buttons */}
        <div className="flex items-center gap-2">
          {/* Filter button */}
          <div className="relative">
            <button
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                hasActiveFilters
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400'
              }`}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full text-[8px] text-white flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* Filter dropdown menu */}
            {showFilterMenu && (
              <div className="absolute right-0 top-12 w-64 bg-[#001D3D] border border-white/20 rounded-xl shadow-2xl p-4 z-[100]">
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
                  <h4 className="text-sm font-semibold text-white pb-3">Actions</h4>
                  <div className="flex gap-2">
                    {(['all', 'buy', 'sell'] as ActionFilter[]).map((action) => (
                      <button
                        key={action}
                        onClick={() => setActionFilter(action)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                          actionFilter === action
                            ? action === 'buy'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : action === 'sell'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Asset filter */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white pb-3">Assets</h4>
                  <select
                    value={assetFilter}
                    onChange={(e) => setAssetFilter(e.target.value)}
                    className="w-full bg-[#0a1929] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none"
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
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400 hover:text-green-400'
                : 'bg-white/5 border-white/10 text-gray-600 cursor-not-allowed'
            }`}
            onClick={handleExportCSV}
            disabled={filteredTrades.length === 0}
            title={filteredTrades.length > 0 ? 'Export to CSV' : 'No trades to export'}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <span className="text-xs text-gray-400">Active filters:</span>
          {actionFilter !== 'all' && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              actionFilter === 'buy'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {actionFilter.toUpperCase()}
            </span>
          )}
          {assetFilter !== 'all' && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
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
      <div className="space-y-2 max-h-[500px] overflow-y-scroll pr-2 custom-scrollbar relative z-10">
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
            const isBuy = trade.action.toLowerCase() === 'buy';
            const amount = parseFloat(trade.amount);
            const price = parseFloat(trade.price);
            const amountUsd = amount * price;

            return (
              <motion.div
                key={trade.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.01] cursor-pointer group relative overflow-hidden ${
                  isBuy
                    ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                    : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedTrade(trade)}
              >
                {/* glow effect on hover */}
                <div
                  className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                    isBuy
                      ? 'bg-gradient-to-r from-green-500/10 to-transparent'
                      : 'bg-gradient-to-r from-red-500/10 to-transparent'
                  }`}
                />

                {/* left side: icon + info */}
                <div className="flex items-center gap-3 relative z-10">
                  {/* action icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isBuy ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    {isBuy ? (
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    )}
                  </div>

                  <div>
                    {/* trade action & token */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-bold text-xs uppercase ${
                          isBuy ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {trade.action}
                      </span>
                      <span className="font-semibold text-white">
                        {trade.asset}
                      </span>
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

      {/* summary footer */}
      {filteredTrades.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            {/* total buy volume */}
            <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400 uppercase">
                  Buy Volume
                </span>
              </div>
              <p className="text-lg font-bold text-green-400">
                $
                {filteredTrades
                  .filter((t: Trade) => t.action.toLowerCase() === 'buy')
                  .reduce((sum: number, t: Trade) => sum + (parseFloat(t.amount) * parseFloat(t.price)), 0)
                  .toLocaleString()}
              </p>
            </div>

            {/* total sell volume */}
            <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownRight className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400 uppercase">
                  Sell Volume
                </span>
              </div>
              <p className="text-lg font-bold text-red-400">
                $
                {filteredTrades
                  .filter((t: Trade) => t.action.toLowerCase() === 'sell')
                  .reduce((sum: number, t: Trade) => sum + (parseFloat(t.amount) * parseFloat(t.price)), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/30 via-purple-500/30 to-red-500/30 blur-sm" />

      {/* Trade Detail Modal */}
      {selectedTrade && (() => {
        const isBuy = selectedTrade.action.toLowerCase() === 'buy';
        const amount = parseFloat(selectedTrade.amount);
        const price = parseFloat(selectedTrade.price);
        const totalValue = amount * price;
        const agent = findAgentById(agents, selectedTrade.agent_id);

        return (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
            onClick={closeModal}
          >
            <div
              className="bg-[#001D3D] border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b border-white/10 ${
                isBuy ? 'bg-green-500/5' : 'bg-red-500/5'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    isBuy ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {isBuy ? (
                      <ArrowUpRight className="w-7 h-7 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-7 h-7 text-red-400" />
                    )}
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedTrade.action.toUpperCase()} {selectedTrade.asset}
                    </h2>
                    <p className="text-sm text-gray-400">
                      Trade Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Total Value */}
                <div className={`rounded-xl p-4 border ${
                  isBuy
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className={`w-5 h-5 ${isBuy ? 'text-green-400' : 'text-red-400'}`} />
                    <span className="text-sm text-gray-400">Total Value</span>
                  </div>
                  <p className={`text-3xl font-bold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                    ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-gray-400">Amount</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </p>
                    <p className="text-xs text-gray-500">{selectedTrade.asset}</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-400">Price</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                      ${price.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </p>
                    <p className="text-xs text-gray-500">per {selectedTrade.asset}</p>
                  </div>
                </div>

                {/* Agent Info */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400 uppercase">Executed By</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden shadow-lg">
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agent?.name || selectedTrade.agent_id)}`}
                        alt={agent?.name || 'Agent'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-white">{agent?.name || `Agent ${selectedTrade.agent_id.slice(0, 8)}...`}</p>
                      <p className="text-xs text-gray-400">{agent?.strategy_type || ''}</p>
                    </div>
                  </div>
                </div>

                {/* Trade ID */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400 uppercase">Trade ID</span>
                  </div>
                  <p className="text-sm text-white font-mono break-all">
                    {selectedTrade.id}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Executed: {new Date(selectedTrade.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
}
