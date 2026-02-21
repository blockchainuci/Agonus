"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, XCircle, Clock, Zap, RefreshCw, Gift } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";

import { useWalletAuth } from "@/src/hooks/useWalletAuth";
import { useBettingStore } from "@/src/store/useBettingStore";
import { useAgents } from "@/src/hooks/useAgents";
import { useTournament } from "@/src/hooks/useTournaments";
import {
  useClaimStatus,
  useClaimWinningsOnchain,
} from "@/src/hooks/useOnchainBetting";
import { AGONUS_CHAIN_ID } from "@/src/lib/agonusContract";
import { settleBet } from "@/src/lib/api/bets";
import type { Bet } from "@/src/types/bets";

interface ActiveBetsProps {
  tournamentId: string;
  agentId?: string | null;
}

type UiStatus = "active" | "won" | "lost";

const statusLabel: Record<UiStatus, string> = {
  active: "Active",
  won: "Won",
  lost: "Lost",
};

const statusIcon = (uiStatus: UiStatus) => {
  if (uiStatus === "won") return Trophy;
  if (uiStatus === "lost") return XCircle;
  return Clock;
};

export default function ActiveBets({ tournamentId, agentId }: ActiveBetsProps) {
  const [filter, setFilter] = useState<"active" | "past">("active");
  const { isConnected } = useAccount();
  const { isAuthenticated, isSigningIn, signInError, signIn } = useWalletAuth();
  const myBets = useBettingStore((s) => s.myBets);
  const isLoadingBets = useBettingStore((s) => s.isLoadingBets);
  const betsError = useBettingStore((s) => s.betsError);
  const refreshMyBets = useBettingStore((s) => s.refreshMyBets);

  // Fetch all agents to get names/avatars
  const { data: agents } = useAgents();
  const { data: tournament } = useTournament(tournamentId);

  // On-chain claim status
  const contractTournamentId = tournament?.contract_tournament_id;
  const isTournamentSettled = tournament?.status === "completed";
  const {
    claimed: alreadyClaimed,
    payoutEth,
    hasClaimable,
    isLoading: claimStatusLoading,
    refetch: refetchClaimStatus,
  } = useClaimStatus(isTournamentSettled ? contractTournamentId : null);

  const claimWinningsOnchain = useClaimWinningsOnchain();
  const [claimState, setClaimState] = useState<
    "idle" | "confirming" | "pending" | "success" | "error"
  >("idle");
  const [claimError, setClaimError] = useState<string | null>(null);

  const { chainId } = useAccount();
  const wrongNetwork = isConnected && chainId !== AGONUS_CHAIN_ID;
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const handleClaim = useCallback(async () => {
    if (!contractTournamentId || wrongNetwork) return;
    try {
      setClaimState("confirming");
      setClaimError(null);
      await claimWinningsOnchain(contractTournamentId);
      setClaimState("success");
      refetchClaimStatus();

      // Sync backend: mark bets as settled so they move to "Past"
      const winnerId = tournament?.winner_agent_id;
      const totalPayout = parseFloat(payoutEth) || 0;
      const betsForTournament = myBets.filter(
        (b) => String(b.tournament_id) === String(tournamentId) && !b.settled,
      );
      // Calculate total amount bet on the winner to split payout proportionally
      const winningBets = betsForTournament.filter(
        (b) => winnerId && String(b.agent_id) === String(winnerId),
      );
      const totalWinningAmount = winningBets.reduce(
        (sum, b) => sum + (parseFloat(String(b.amount_eth ?? b.amount)) || 0),
        0,
      );

      await Promise.allSettled(
        betsForTournament.map((bet) => {
          const isWinner =
            winnerId && String(bet.agent_id) === String(winnerId);
          const betAmount =
            parseFloat(String(bet.amount_eth ?? bet.amount)) || 0;
          const betPayout =
            isWinner && totalWinningAmount > 0
              ? (betAmount / totalWinningAmount) * totalPayout
              : 0;
          return settleBet(String(bet.id), betPayout);
        }),
      );
      refreshMyBets(tournamentId);
    } catch (err: unknown) {
      console.error("Claim failed:", err);
      setClaimState("error");
      setClaimError((err as Error)?.message || "Claim transaction failed");
    }
  }, [
    contractTournamentId,
    wrongNetwork,
    claimWinningsOnchain,
    refetchClaimStatus,
    tournament,
    payoutEth,
    myBets,
    tournamentId,
    refreshMyBets,
  ]);

  // Create a lookup map: agent_id -> agent data
  const agentMap = useMemo(() => {
    if (!agents)
      return new Map<string, { name: string; strategy_type: string }>();
    return new Map(
      agents.map((a) => [
        String(a.id),
        { name: a.name, strategy_type: a.strategy_type },
      ]),
    );
  }, [agents]);

  useEffect(() => {
    if (!isConnected || !isAuthenticated) return;
    refreshMyBets(tournamentId);
  }, [isConnected, isAuthenticated, refreshMyBets, tournamentId]);

  const scopedBets = myBets
    .filter((b) => String(b.tournament_id) === String(tournamentId))
    .filter((b) => !agentId || String(b.agent_id) === String(agentId));

  // Determine bet status based on tournament state, not just backend settled field
  const winnerId = tournament?.winner_agent_id;
  const getBetUiStatus = (bet: Bet): UiStatus => {
    // If tournament is completed, use winner to determine won/lost
    if (isTournamentSettled) {
      if (winnerId && String(bet.agent_id) === String(winnerId)) return "won";
      return "lost";
    }
    // If bet is already settled in backend
    if (bet.settled) {
      return bet.payout && Number(bet.payout) > 0 ? "won" : "lost";
    }
    if (bet.status === "CANCELED" || bet.status === "FAILED") return "lost";
    return "active";
  };

  const active = scopedBets.filter((b) => getBetUiStatus(b) === "active");
  const past = scopedBets.filter((b) => getBetUiStatus(b) !== "active");
  const displayed = filter === "active" ? active : past;

  return (
    <div className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 h-full flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your Bets</h3>
            <p className="text-xs text-gray-400">
              {agentId
                ? agentMap.get(agentId)?.name ?? "Selected Agent"
                : tournament?.name ?? "Loading..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshMyBets(tournamentId)}
            disabled={!isConnected || !isAuthenticated || isLoadingBets}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 text-xs text-gray-200 hover:bg-white/5 disabled:opacity-50"
            title="Refresh bets"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
            <span className="text-xs text-cyan-400 font-semibold">
              {displayed.length} Bets
            </span>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-lg">
        <button
          onClick={() => setFilter("active")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold ${
            filter === "active"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Active ({active.length})
        </button>

        <button
          onClick={() => setFilter("past")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold ${
            filter === "past"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Past ({past.length})
        </button>
      </div>

      {/* BETS LIST */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-2">
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="connect-placeholder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10 text-center"
            >
              <p className="text-sm text-gray-300">
                Connect your wallet to place and view bets.
              </p>
            </motion.div>
          ) : !isAuthenticated ? (
            <motion.div
              key="signin-placeholder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
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
            </motion.div>
          ) : betsError ? (
            <motion.div
              key="error-placeholder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 rounded-xl p-4 border border-red-500/30"
            >
              <p className="text-sm text-red-300">{betsError}</p>
            </motion.div>
          ) : isLoadingBets ? (
            <motion.div
              key="loading-placeholder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10 text-center"
            >
              <p className="text-sm text-gray-300">Loading bets...</p>
            </motion.div>
          ) : displayed.length === 0 ? (
            <motion.div
              key="empty-placeholder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10 text-center"
            >
              <p className="text-sm text-gray-300">No bets yet.</p>
            </motion.div>
          ) : (
            displayed.map((bet, index) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10"
              >
                {/* TOP ROW */}
                <div className="flex items-center justify-between mb-3">
                  {/* Agent bubble */}
                  {(() => {
                    const agentData = agentMap.get(String(bet.agent_id));
                    const agentName =
                      bet.agent_name || agentData?.name || `Agent`;
                    const agentType = agentData?.strategy_type || "";
                    // Generate avatar URL using DiceBear (same as mock data)
                    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agentName)}`;

                    return (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden shadow-lg">
                          <img
                            src={avatarUrl}
                            alt={agentName}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div>
                          <p className="font-bold text-white text-sm">
                            {agentName}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            {agentType && (
                              <span className="capitalize">
                                {agentType.replace("_", " ")}
                              </span>
                            )}
                            {agentType && <span>•</span>}
                            <span>{bet.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Status Badge */}
                  {(() => {
                    const uiStatus = getBetUiStatus(bet);
                    const Icon = statusIcon(uiStatus);
                    const color =
                      uiStatus === "won"
                        ? "bg-green-500/20 border-green-500/30 text-green-400"
                        : uiStatus === "lost"
                          ? "bg-red-500/20 border-red-500/30 text-red-400"
                          : "bg-cyan-500/20 border-cyan-500/30 text-cyan-400";

                    return (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 border rounded-full ${color}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="text-xs font-semibold uppercase">
                          {statusLabel[uiStatus]}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* AMOUNT + TIMESTAMP */}
                <div className="pt-3 border-t border-white/5">
                  <p className="text-xs text-gray-400 mb-1">Bet Amount</p>
                  <p className="font-bold text-white text-lg mb-1">
                    {bet.amount_eth || bet.amount || "0"} ETH
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Placed: {(() => {
                      const placed = bet.created_at ?? bet.placed_at;
                      return placed
                        ? new Date(placed).toLocaleString()
                        : "Unknown";
                    })()}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* CLAIM WINNINGS BANNER */}
      {isConnected &&
        isAuthenticated &&
        isTournamentSettled &&
        contractTournamentId &&
        scopedBets.length > 0 && (
          <div className="mt-4 shrink-0">
            {claimStatusLoading ? (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <p className="text-sm text-gray-400">
                  Checking claim status...
                </p>
              </div>
            ) : alreadyClaimed ? (
              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-green-400" />
                  <p className="text-sm font-semibold text-green-400">
                    Winnings Claimed
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  You have already claimed your winnings for this tournament.
                </p>
              </div>
            ) : hasClaimable ? (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-bold text-white">
                        Claim Your Winnings
                      </p>
                      <p className="text-xs text-gray-400">
                        Tournament settled
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">
                      {payoutEth} ETH
                    </p>
                  </div>
                </div>

                {wrongNetwork && (
                  <button
                    onClick={() => switchChain({ chainId: AGONUS_CHAIN_ID })}
                    disabled={isSwitching}
                    className="w-full bg-red-500/20 border border-red-700 text-red-300 text-sm p-2.5 rounded-lg mb-3 hover:bg-red-500/30 transition font-medium"
                  >
                    {isSwitching
                      ? "Switching..."
                      : `Switch to Base Sepolia to claim`}
                  </button>
                )}

                {claimState === "error" && claimError && (
                  <div className="bg-red-500/20 border border-red-700 text-red-300 text-xs p-2 rounded-md mb-3">
                    {claimError}
                  </div>
                )}

                {claimState === "success" ? (
                  <div className="bg-green-500/20 border border-green-500/30 text-green-300 text-xs p-2 rounded-md">
                    Winnings claimed successfully!
                  </div>
                ) : (
                  <button
                    onClick={handleClaim}
                    disabled={
                      wrongNetwork ||
                      claimState === "confirming" ||
                      claimState === "pending"
                    }
                    className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                      wrongNetwork ||
                      claimState === "confirming" ||
                      claimState === "pending"
                        ? "bg-gray-600 cursor-not-allowed opacity-50"
                        : "bg-green-500 hover:bg-green-400 text-black"
                    }`}
                  >
                    {claimState === "confirming"
                      ? "Confirm in Wallet..."
                      : claimState === "pending"
                        ? "Claiming..."
                        : "Claim Winnings"}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-400">
                    No winnings to claim for this tournament.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
