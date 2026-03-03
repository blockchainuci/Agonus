"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Minus, Plus, DollarSign } from "lucide-react";
import { useEthPrice } from "@/src/hooks/useEthPrice";
import { motion } from "framer-motion";
import { useAccount, usePublicClient, useSwitchChain, useConnect } from "wagmi";

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
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { connectors, connect, isPending: isConnecting } = useConnect();

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
  const [showConnectorMenu, setShowConnectorMenu] = useState(false);
  const { ethPriceUsd } = useEthPrice();

  // Close connector menu once wallet connects
  useEffect(() => {
    if (isConnected) setShowConnectorMenu(false);
  }, [isConnected]);

  // Auto-switch to the correct chain when modal opens or wallet connects on wrong chain
  useEffect(() => {
    if (isBetModalOpen && isConnected && chainId !== undefined && chainId !== AGONUS_CHAIN_ID) {
      switchChain({ chainId: AGONUS_CHAIN_ID });
    }
  }, [isBetModalOpen, isConnected, chainId]);

  const isWrongChain = isConnected && chainId !== undefined && chainId !== AGONUS_CHAIN_ID;

  // Lock body scroll while panel is open
  useEffect(() => {
    document.body.style.overflow = isBetModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isBetModalOpen]);

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
  const MIN_BET = 0.001;
  const amountInvalid =
    !draft.amount_eth || Number.isNaN(amountNum) || amountNum < MIN_BET;

  const canSubmit =
    !!draft.tournament_id &&
    !!draft.agent_id &&
    draft.contract_tournament_id != null &&
    draft.contract_agent_id != null &&
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
    if (chainId !== AGONUS_CHAIN_ID) {
      try {
        await switchChain({ chainId: AGONUS_CHAIN_ID });
        // switchChain resolves once the wallet has switched — continue below
      } catch {
        setError(`Switch to Base Sepolia (chain ${AGONUS_CHAIN_ID}) to place a bet.`);
        return;
      }
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
      setError(`Minimum bet is ${MIN_BET} ETH.`);
      return;
    }
    if (draft.contract_tournament_id == null || draft.contract_agent_id == null) {
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
      const raw = err instanceof Error ? err.message : "Bet failed";
      const revertMatch = raw.match(/execution reverted:\s*([^"',]+)/i);
      const userRejected = /user rejected|user denied/i.test(raw);
      const message = userRejected
        ? "Transaction rejected by user"
        : revertMatch
        ? revertMatch[1].trim()
        : raw.length > 80
        ? raw.slice(0, 80) + "..."
        : raw;
      setError(message);
      txToast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
        onClick={closeBetModal}
        aria-label="Close bet modal"
      />

      {/* Right-side panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-sm h-full bg-[#0a1122] border-l border-white/10 shadow-2xl flex flex-col"
      >
        {/* Panel header */}
        <div className="shrink-0 flex items-start justify-between p-6 border-b border-white/10">
          <div className="pr-8">
            <h2 className="text-xl font-bold text-white leading-tight">{title}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {draft.tournament_name || draft.tournament_id || "—"}
            </p>
          </div>
          <button
            onClick={closeBetModal}
            className="shrink-0 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Wallet info */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-sm text-gray-300">
              Wallet:{" "}
              {address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Not connected"}
            </p>
          </div>

          {/* Sign-in prompt */}
          {isConnected && !isAuthenticated && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
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

          {/* Betting closed banner */}
          {bettingClosed && (
            <div className="rounded-lg border border-red-600/40 bg-red-500/10 p-3 text-sm text-red-300">
              Betting is only open while the tournament is LIVE.
            </div>
          )}

          {/* Bet amount */}
          <div>
            <label className="text-sm text-gray-300">Bet Amount (ETH)</label>
            <div className="mt-1 flex">
              <button
                type="button"
                onClick={() => {
                  const cur = parseFloat(draft.amount_eth) || 0;
                  const next = Math.max(MIN_BET, parseFloat((cur - 0.001).toFixed(6)));
                  setDraftAmount(String(next));
                }}
                className="rounded-l-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 px-3 py-2 transition"
                aria-label="Decrease bet amount"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                value={draft.amount_eth}
                onChange={(e) => setDraftAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0.01"
                className="flex-1 rounded-none bg-black/30 border-y border-white/10 px-3 py-2 text-white text-center focus:outline-none focus:border-white/20"
              />
              <button
                type="button"
                onClick={() => {
                  const cur = parseFloat(draft.amount_eth) || 0;
                  setDraftAmount(String(parseFloat((cur + 0.001).toFixed(6))));
                }}
                className="rounded-r-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 px-3 py-2 transition"
                aria-label="Increase bet amount"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* USD conversion */}
          {!Number.isNaN(parseFloat(draft.amount_eth)) &&
            parseFloat(draft.amount_eth) > 0 && (
              <div className="flex items-center gap-2.5 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2">
                <DollarSign className="w-4 h-4 text-green-400 shrink-0" />
                <div>
                  <p className="text-green-400 font-semibold text-sm leading-none">
                    {ethPriceUsd !== null
                      ? `$${(parseFloat(draft.amount_eth) * ethPriceUsd).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} USD`
                      : "Fetching price…"}
                  </p>
                  <p className="text-[10px] text-green-600 mt-0.5">
                    Live estimate — updates as you type, increment, or decrement
                  </p>
                </div>
              </div>
            )}

          {/* Validation / error messages */}
          {amountInvalid && (
            <p className="text-xs text-red-400">Minimum bet is 0.001 ETH.</p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 p-6 border-t border-white/10 space-y-3">
          {/* Wrong network banner */}
          {isWrongChain && (
            <button
              onClick={() => switchChain({ chainId: AGONUS_CHAIN_ID })}
              disabled={isSwitching}
              className="w-full rounded-xl bg-orange-500/20 border border-orange-500/40 px-4 py-2.5 text-sm font-medium text-orange-300 hover:bg-orange-500/30 transition disabled:opacity-50"
            >
              {isSwitching ? "Switching network…" : "Switch to Base Sepolia to bet"}
            </button>
          )}

          {/* Connect wallet — shows connector picker */}
          {!isConnected ? (
            <div className="relative">
              <button
                onClick={() => setShowConnectorMenu((v) => !v)}
                disabled={isConnecting}
                className="w-full rounded-xl bg-yellow-500 hover:bg-yellow-400 px-4 py-3 font-semibold text-black transition disabled:opacity-50"
              >
                {isConnecting ? "Connecting…" : "Connect wallet to bet"}
              </button>

              {showConnectorMenu && (
                <div className="absolute bottom-full mb-2 w-full bg-[#0d1629] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                  {connectors.map((connector) => (
                    <button
                      key={connector.uid}
                      onClick={() => connect({ connector })}
                      className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition border-b border-white/5 last:border-0 flex items-center gap-3"
                    >
                      {connector.icon && (
                        <img src={connector.icon} alt="" className="w-5 h-5 rounded" />
                      )}
                      {connector.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-xl bg-yellow-500 hover:bg-yellow-400 px-4 py-3 font-semibold text-black disabled:opacity-50 transition"
            >
              {submitting
                ? "Placing bet…"
                : !isAuthenticated
                ? "Sign in to bet"
                : "Place Bet"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
