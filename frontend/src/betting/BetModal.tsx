"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useAccount, usePublicClient } from "wagmi";

import { useBettingStore } from "@/src/store/useBettingStore";
import { useTournamentStore } from "@/src/store/useTournamentStore";
import { usePlaceBetOnchain } from "@/src/hooks/useOnchainBetting";
import { AGONUS_CHAIN_ID } from "@/src/lib/agonusContract";
import { txToast } from "./TransactionToast";
import { useWalletAuth } from "@/src/hooks/useWalletAuth";
import { createBet } from "@/src/lib/api/bets";

export default function BetModal() {
  const { isConnected, address, chainId } = useAccount();
  const { isAuthenticated, isSigningIn, signInError, signIn } = useWalletAuth();
  const tournamentStatus = useTournamentStore(
    (s) => s.selectedTournamentStatus
  );
  const publicClient = usePublicClient({ chainId: AGONUS_CHAIN_ID });

  const placeBetOnchain = usePlaceBetOnchain();
  const {
    isBetModalOpen,
    draft,
    closeBetModal,
    setDraftAmount,
    refreshMyBets,
  } = useBettingStore();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isBetModalOpen) setError(null);
  }, [isBetModalOpen, draft.tournament_id, draft.agent_id]);

  const title = useMemo(() => {
    if (draft.agent_name) return `Place a Bet on ${draft.agent_name}`;
    if (draft.agent_id) return `Place a Bet on Agent ${draft.agent_id}`;
    return "Place a Bet";
  }, [draft.agent_id, draft.agent_name]);

  if (!isBetModalOpen) return null;

  const bettingClosed = tournamentStatus !== "LIVE";
  const amountNum = Number(draft.amount_eth);
  const amountInvalid =
    !draft.amount_eth || Number.isNaN(amountNum) || amountNum <= 0;

  const canSubmit =
    !!draft.tournament_id &&
    !!draft.agent_id &&
    !!draft.contract_tournament_id &&
    !!draft.contract_agent_id &&
    isConnected &&
    isAuthenticated &&
    !bettingClosed &&
    !amountInvalid &&
    !submitting;

  async function handleSubmit() {
    if (!draft.tournament_id || !draft.agent_id) {
      setError("Missing tournament or agent.");
      return;
    }
    if (!isConnected) {
      setError("Connect your wallet to place a bet.");
      return;
    }
    if (chainId && chainId !== AGONUS_CHAIN_ID) {
      setError(`Switch to Base Sepolia (${AGONUS_CHAIN_ID}) to place a bet.`);
      return;
    }
    if (!isAuthenticated) {
      setError("Please sign in to place a bet.");
      return;
    }
    if (bettingClosed) {
      setError("Betting is closed for this tournament.");
      return;
    }
    if (amountInvalid) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    if (!draft.contract_tournament_id || !draft.contract_agent_id) {
      setError("Tournament is not linked on-chain yet.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (!publicClient) {
        throw new Error("Wallet client not ready");
      }

      const txHash = await placeBetOnchain({
        contractTournamentId: Number(draft.contract_tournament_id),
        contractAgentId: Number(draft.contract_agent_id),
        amountEth: draft.amount_eth,
      });

      txToast.pending("Confirming on-chain bet...");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status !== "success") {
        throw new Error("On-chain transaction failed");
      }

      await createBet({
        tournament_id: draft.tournament_id,
        agent_id: draft.agent_id,
        amount_eth: draft.amount_eth,
      });

      await refreshMyBets(draft.tournament_id);
      txToast.success("Bet placed successfully!");
      closeBetModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bet failed";
      setError(message);
      txToast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeBetModal}
        aria-label="Close bet modal"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md rounded-2xl bg-[#0a1122] border border-white/10 p-6 shadow-2xl"
      >
        <button
          onClick={closeBetModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
        <p className="text-sm text-gray-400 mb-4">
          Tournament: {draft.tournament_id ?? "—"}
        </p>

        <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-sm text-gray-300">
            Wallet:{" "}
            {address
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : "Not connected"}
          </p>
        </div>

        {isConnected && !isAuthenticated && (
          <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-200">Sign in required</p>
                <p className="text-xs text-gray-500">
                  Sign a message to access betting features.
                </p>
                {signInError && (
                  <p className="mt-2 text-xs text-red-400">{signInError}</p>
                )}
              </div>
              <button
                onClick={signIn}
                disabled={isSigningIn}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium transition disabled:opacity-50"
              >
                {isSigningIn ? "Signing..." : "Sign In"}
              </button>
            </div>
          </div>
        )}

        {bettingClosed && (
          <div className="mb-3 rounded-lg border border-red-600/40 bg-red-500/10 p-3 text-sm text-red-300">
            Betting is only open while the tournament is LIVE.
          </div>
        )}

        <label className="text-sm text-gray-300">Bet Amount (ETH)</label>
        <input
          value={draft.amount_eth}
          onChange={(e) => setDraftAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0.01"
          className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
        />

        {amountInvalid && (
          <p className="mt-2 text-xs text-red-400">
            Amount must be greater than 0.
          </p>
        )}

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-4 w-full rounded-xl bg-yellow-500 px-4 py-2 font-semibold text-black disabled:opacity-50"
        >
          {submitting
            ? "Placing bet..."
            : !isConnected
            ? "Connect wallet to bet"
            : !isAuthenticated
            ? "Sign in to bet"
            : "Place Bet"}
        </button>
      </motion.div>
    </div>
  );
}
