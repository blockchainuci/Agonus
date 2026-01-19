'use client';

import { useTournamentStore } from '@/src/store/useTournamentStore';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { OddsDisplay } from './OddsDisplay';
import { MinBetWarning } from './MinBetWarning';
import { TransactionStatus } from './TransactionStatus';
import { txToast } from './TransactionToast';

export default function BetModal() {
  const {
    isBetModalOpen,
    selectedAgent,
    closeBetModal,
    txStatus,
    txError,
    setTxStatus,
    setTxError,
    resetTxState,
  } = useTournamentStore();

  const { chainId, isConnected } = useAccount();
  const TARGET_CHAIN = 84532;
  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN;

  const [amountEth, setAmountEth] = useState('');

  if (!isBetModalOpen || !selectedAgent) return null;

  const {
    name,
    odds,
    winRate,
    rank,
    portfolioValue,
    oddsDecimal = odds,
    oddsFractional = "1/1",
    minBetEth = "0.001",
  } = selectedAgent;

  const isTooLow = Number(amountEth || 0) < Number(minBetEth);

  async function handleConfirmBet() {
    try {
      resetTxState();

      if (wrongNetwork) {
        txToast.error("Switch to Base Sepolia (84532) to place a bet.");
        return;
      }

      if (isTooLow) {
        txToast.error(`Minimum bet is ${minBetEth} ETH`);
        return;
      }

      txToast.pending("Confirm the bet in your wallet…");
      setTxStatus('confirming');

      // TODO: replace with real contract logic
      await new Promise((res) => setTimeout(res, 1200));

      setTxStatus('pending');
      txToast.pending("Submitting bet to Base Sepolia…");

      setTimeout(() => {
        setTxStatus('success');
        txToast.success("Bet placed successfully!");
      }, 1500);

    } catch (err: unknown) {
      setTxStatus('error');
      setTxError((err as Error)?.message || 'Transaction failed');
      txToast.error("Bet failed");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-[#0a1122] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
      >
        {/* Close */}
        <button
          onClick={closeBetModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-1">
          Bet on {name}
        </h2>

        {/* OddsDisplay */}
        <OddsDisplay
          oddsDecimal={oddsDecimal}
          oddsFractional={oddsFractional}
          className="mb-4"
        />

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
            <span className="text-white font-medium">Portfolio:</span>{" "}
            ${portfolioValue.toLocaleString()}
          </p>
        </div>

        {/* Wrong Network Warning */}
        {wrongNetwork && (
          <div className="bg-red-500/20 border border-red-700 text-red-300 text-sm p-2 rounded-md mb-3">
            ⚠️ You are on the wrong network.  
            Please switch to <strong>Base Sepolia (84532)</strong> to place bets.
          </div>
        )}

        {/* Amount Input */}
        <div className="flex flex-col mb-1">
          <label className="text-gray-300 text-sm mb-1">Bet Amount (ETH)</label>

          <input
            type="number"
            min={minBetEth}
            step="0.0001"
            placeholder={`Min ${minBetEth} ETH`}
            value={amountEth}
            onChange={(e) => setAmountEth(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
          />
        </div>

        <MinBetWarning minEth={minBetEth} show={isTooLow && amountEth !== ''} />

        <TransactionStatus status={txStatus} errorMessage={txError} />

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={closeBetModal}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmBet}
            disabled={
              wrongNetwork ||
              !amountEth ||
              isTooLow ||
              txStatus === 'pending' ||
              txStatus === 'confirming'
            }
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition
              ${
                wrongNetwork
                  ? "bg-gray-700 cursor-not-allowed opacity-40"
                  : "bg-yellow-500 hover:bg-yellow-400 text-black"
              }
            `}
          >
            {wrongNetwork
              ? "Wrong Network"
              : txStatus === 'confirming'
              ? "Confirming…"
              : txStatus === 'pending'
              ? "Betting…"
              : "Confirm Bet"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
