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
import { useTournamentTrades } from '@/src/hooks/useTrades';

interface RecentTradesProps {
  tournamentId: string;
}

export default function RecentTrades({ tournamentId }: RecentTradesProps) {
  const { data: trades, isLoading } = useTournamentTrades(tournamentId);
  const filteredTrades = trades || [];
  const isLiveTournament = true; // Assume live for now

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
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Recent Trades</h3>
            <p className="text-xs text-gray-400">Tournament #{tournamentId}</p>
          </div>
        </div>

        {/* action buttons */}
        <div className="flex items-center gap-2">
          <motion.button
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter className="w-4 h-4 text-gray-400" />
          </motion.button>

          <motion.button
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* trades list */}
      <div className="space-y-2 max-h-[500px] overflow-y-scroll pr-2 custom-scrollbar relative z-10">
      <style jsx>{`
          .scrollbar-always-visible::-webkit-scrollbar {
            width: 8px;
          }
          .scrollbar-always-visible::-webkit-scrollbar-track {
            background: rgba(255, 215, 0, 0.05);
            border-radius: 10px;
          }
          .scrollbar-always-visible::-webkit-scrollbar-thumb {
            background: rgba(255, 215, 0, 0.3);
            border-radius: 10px;
            transition: background 0.3s;
          }
          .scrollbar-always-visible::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 215, 0, 0.5);
          }
          .scrollbar-always-visible::-webkit-scrollbar-thumb {
            min-height: 40px;
          }
        `}</style>
        {filteredTrades.length === 0 ? (
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

                {/* pulse indicator for recent trades */}
                {index === 0 && isLiveTournament &&(
                  <motion.div
                    className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                      isBuy ? 'bg-green-400' : 'bg-red-400'
                    }`}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
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
                  .reduce((sum: number, t: Trade) => sum + t.amount_usd, 0)
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
                  .reduce((sum: number, t: Trade) => sum + t.amount_usd, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/30 via-purple-500/30 to-red-500/30 blur-sm" />
    </motion.div>
  );
}
