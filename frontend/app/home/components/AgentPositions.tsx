'use client';
import { mockPositions } from '../data/mockPositions';
import {motion } from 'framer-motion';
import {Wallet, TrendingUp, TrendingDown, PieChart, Sparkles} from 'lucide-react';
export default function AgentPositions() {
  // calculate total portfolio value
  const totalValue = mockPositions.reduce((sum, pos) => sum + pos.current_value_usd, 0);

  return (
    <motion.div
      className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg p-6 h-fit relative overflow-hidden"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

      {/* header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Agent Positions</h3>
            <p className="text-xs text-gray-400">Current holdings</p>
          </div>
        </div>

        {/* view toggle */}
        <motion.button
          className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PieChart className="w-4 h-4 text-gray-400" />
        </motion.button>
      </div>

      {/* positions list */}
      <div className="space-y-3 mb-6 relative z-10">
        {mockPositions.map((position, index) => {
          const percentOfTotal = (position.current_value_usd / totalValue) * 100;
          const change = ((position.current_value_usd / (position.amount * 2000)) - 1) * 100; // Mock change

          return (
            <motion.div
              key={position.token}
              className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 transition-all cursor-pointer group relative overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 4 }}
            >
              {/* background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                {/* token info row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* token icon */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {position.token[0]}
                    </div>
                    
                    <div>
                      <p className="font-bold text-white">{position.token}</p>
                      <p className="text-xs text-gray-400">
                        {position.amount} {position.token}
                      </p>
                    </div>
                  </div>
                  
                  {/* value and change */}
                  <div className="text-right">
                    <p className="font-bold text-white">
                      ${position.current_value_usd.toLocaleString()}
                    </p>
                    <div className={`flex items-center gap-1 text-xs justify-end ${
                      change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {change >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(change).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Portfolio allocation</span>
                    <span className="text-[#FFD700] font-semibold">
                      {percentOfTotal.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFC300] relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentOfTotal}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    >
                      {/* shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                          delay: index * 0.3,
                        }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* total portfolio summary */}
      <div className="pt-6 border-t border-white/10 relative z-10">
        <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#FFC300]/5 rounded-xl p-4 border border-[#FFD700]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFD700]" />
              <span className="text-gray-300 text-sm font-medium">
                Total Portfolio Value
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#FFD700]">
                ${totalValue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {mockPositions.length} assets
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-30" />
    </motion.div>
  );
}

