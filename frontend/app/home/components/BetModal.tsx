'use client';

import { useTournamentStore } from '@/src/store/useTournamentStore';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function BetModal() {
  const { isBetModalOpen, selectedAgent, closeBetModal } = useTournamentStore();
  const [amount, setAmount] = useState('');

  // If modal closed → render nothing
  if (!isBetModalOpen || !selectedAgent) return null;

  const { name, odds, winRate, rank, portfolioValue } = selectedAgent;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-[#0a1122] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
      >
        {/* Close Button */}
        <button
          onClick={closeBetModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-1">
          Bet on {name}
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Odds: <span className="text-yellow-400 font-semibold">{odds}x</span>
        </p>

        {/* Agent Info */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-4">
          <p className="text-gray-300 text-sm">
            <span className="text-white font-medium">Win Rate:</span> {winRate}%
          </p>

          {rank !== undefined && (
            <p className="text-gray-300 text-sm">
              <span className="text-white font-medium">Rank:</span> #{rank}
            </p>
          )}

          <p className="text-gray-300 text-sm">
            <span className="text-white font-medium">Portfolio:</span> ${portfolioValue.toLocaleString()}
          </p>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col mb-6">
          <label className="text-gray-300 text-sm mb-1">Bet Amount (USD)</label>
          <input
            type="number"
            min="1"
            placeholder="Enter amount..."
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={closeBetModal}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert(`Bet confirmed: $${amount} on ${name}`);
              closeBetModal();
            }}
            className="flex-1 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
            disabled={!amount}
          >
            Confirm Bet
          </button>
        </div>
      </motion.div>
    </div>
  );
}
