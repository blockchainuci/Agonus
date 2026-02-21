"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TournamentStatusBar } from "./components/TournamentStatusBar";
import MarketBlips from "@/app/components/nav/MarketBlips";
import NavbarAccount from "@/app/components/nav/NavbarAccount";
import AgentPerformanceChart from "./components/AgentPerformanceChart";
import RecentTrades from "./components/RecentTrades";
import { useTournaments, useTournament } from "@/src/hooks/useTournaments";
import { useTournamentStore } from "@/src/store/useTournamentStore";
import { useTournamentAgentStates } from "@/src/hooks/useAgentStates";
import { useAgents } from "@/src/hooks/useAgents";
import { useBettingStore } from "@/src/store/useBettingStore";
import { useAccount } from "wagmi";
import { useWalletAuth } from "@/src/hooks/useWalletAuth";
import BetModal from "@/src/betting/BetModal";
import { findAgentById } from "@/src/util/findAgentById";
import { getAgentColor } from "@/src/util/agentColor";
import { useClaimStatus, useClaimWinningsOnchain } from "@/src/hooks/useOnchainBetting";
import {
  X,
  Trophy,
  Clock,
  ChevronRight,
  TrendingUp,
  Activity,
  Zap,
  Wallet,
  CheckCircle,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// Left Sidebar — Agent Leaderboard with inline expansion + Place Bet
// ════════════════════════════════════════════════════════════════════════════
function AgentsSidebar({
  tournamentId,
  onAgentHover,
  highlightedAgentId,
  onAgentClick,
}: {
  tournamentId: string;
  onAgentHover: (id: string | null) => void;
  highlightedAgentId: string | null;
  onAgentClick: () => void;
}) {
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const { data: agentStates } = useTournamentAgentStates(tournamentId);
  const { data: agents } = useAgents();
  const { data: tournament } = useTournament(tournamentId);
  const openBetModal = useBettingStore((s) => s.openBetModal);
  const tournamentStatus = useTournamentStore((s) => s.selectedTournamentStatus);

  const sorted = agentStates
    ? [...agentStates].sort((a, b) => (a.rank || 999) - (b.rank || 999))
    : [];
  const totalValue = sorted.reduce(
    (s, a) => s + parseFloat(a.portfolio_value_usd),
    0,
  );
  const canBet = tournamentStatus === "LIVE" && !tournament?.betting_closed;

  return (
    <aside
      className="w-[200px] flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0b1120 0%, #0a0e17 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* header */}
      <div
        className="px-4 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
          Leaderboard
        </p>
      </div>

      {/* agent rows */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((state, i) => {
          const agent = findAgentById(agents, state.agent_id);
          const name = agent?.name || `Agent ${i + 1}`;
          const value = parseFloat(state.portfolio_value_usd);
          const color = getAgentColor(state.agent_id);
          const isHovered = highlightedAgentId === state.agent_id;
          const isExpanded = expandedAgentId === state.agent_id;
          const isFirst = i === 0;

          return (
            <div key={state.agent_id}>
              <motion.div
                className="relative cursor-pointer group"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={() => onAgentHover(state.agent_id)}
                onMouseLeave={() => onAgentHover(null)}
                onClick={() => {
                  setExpandedAgentId(isExpanded ? null : state.agent_id);
                  onAgentClick();
                }}
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {/* hover bg */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(90deg, ${color}10, transparent)` }}
                />
                {/* active left bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r transition-opacity"
                  style={{ background: color, opacity: isHovered || isExpanded ? 1 : 0 }}
                />

                <div className="relative flex items-center gap-2.5 px-4 py-3">
                  <div className="relative flex-shrink-0">
                    {isFirst && (
                      <div
                        className="absolute inset-0 rounded-full blur-sm opacity-50 scale-110"
                        style={{ background: color }}
                      />
                    )}
                    <div
                      className="relative w-7 h-7 rounded-full overflow-hidden border"
                      style={{
                        borderColor: isHovered || isExpanded ? color : "rgba(255,255,255,0.08)",
                        boxShadow: isHovered || isExpanded ? `0 0 8px ${color}60` : "none",
                        background: `${color}20`,
                      }}
                    >
                      {agent?.avatar_url ? (
                        <img
                          src={agent.avatar_url}
                          alt={name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full" style={{ background: color }} />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-[13px] font-semibold text-white truncate leading-tight">
                        {name}
                      </p>
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-3 h-3 text-zinc-700 flex-shrink-0 group-hover:text-zinc-400 transition-colors" />
                      </motion.div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-600">
                        #{state.rank} · {state.trades_count} trades
                      </span>
                      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
                        ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Inline expansion */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                    style={{ background: `${color}08` }}
                  >
                    <div className="px-4 py-3 space-y-2.5">
                      {/* Portfolio & Trades */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3" style={{ color }} />
                            <span className="text-[9px] text-zinc-500 uppercase">Portfolio</span>
                          </div>
                          <p className="text-sm font-bold" style={{ color }}>
                            ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex items-center gap-1 mb-1">
                            <Activity className="w-3 h-3 text-zinc-500" />
                            <span className="text-[9px] text-zinc-500 uppercase">Trades</span>
                          </div>
                          <p className="text-sm font-bold text-white">{state.trades_count}</p>
                        </div>
                      </div>

                      {/* Last Signal */}
                      {state.last_decision && (
                        <div className="rounded-lg p-2.5 bg-white/[0.02] border border-white/[0.05]">
                          <div className="flex items-center gap-1 mb-1.5">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-[9px] text-zinc-500 uppercase">Last Signal</span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-3">
                            {state.last_decision}
                          </p>
                        </div>
                      )}

                      {/* Place Bet / Betting closed */}
                      {canBet ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openBetModal({
                              tournament_id: tournamentId,
                              tournament_name: tournament?.name,
                              agent_id: state.agent_id,
                              agent_name: name,
                              contract_tournament_id: tournament?.contract_tournament_id ?? null,
                              contract_agent_id: tournament?.agent_contract_mapping?.[state.agent_id] ?? null,
                            });
                          }}
                          className="w-full py-2 rounded-lg font-semibold text-xs text-black"
                          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                        >
                          Place Bet
                        </motion.button>
                      ) : (
                        <p className="text-center text-[10px] text-zinc-600 py-1">Betting closed</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-zinc-700">No agents</p>
          </div>
        )}
      </div>

      {/* total footer */}
      {totalValue > 0 && (
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Total AUM</p>
            <p className="text-sm font-bold text-white tabular-nums">
              ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// User Bets Panel — 3rd column showing the user's personal bets
// ════════════════════════════════════════════════════════════════════════════
function UserBetsPanel({
  tournamentId,
  onClose,
}: {
  tournamentId: string;
  onClose: () => void;
}) {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useWalletAuth();
  const myBets = useBettingStore((s) => s.myBets);
  const refreshMyBets = useBettingStore((s) => s.refreshMyBets);
  const { data: agents } = useAgents();
  const { data: tournament } = useTournament(tournamentId);
  const contractTournamentId = tournament?.contract_tournament_id ?? null;
  const { claimed, payoutEth, hasClaimable, isLoading: claimLoading } = useClaimStatus(contractTournamentId);
  const claimWinningsOnchain = useClaimWinningsOnchain();
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (isConnected && isAuthenticated) refreshMyBets(tournamentId);
  }, [isConnected, isAuthenticated, tournamentId]);

  const scopedBets = myBets.filter(
    (b) => String(b.tournament_id) === String(tournamentId),
  );
  const winnerId = tournament?.winner_agent_id;
  const isSettled = tournament?.status === "completed";

  async function handleClaim() {
    if (!contractTournamentId) return;
    setIsClaiming(true);
    try {
      await claimWinningsOnchain(contractTournamentId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 240, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0c1422 0%, #0a0e17 100%)",
        borderLeft: "1px solid rgba(6,182,212,0.12)",
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3.5 flex items-center gap-2 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Wallet className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
        <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-[0.15em] flex-1">
          My Bets
        </p>
        {scopedBets.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
            {scopedBets.length}
          </span>
        )}
        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-300 transition-colors ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Claim winnings — only when tournament ended and user has won */}
      {isSettled && !claimLoading && (hasClaimable || claimed) && (
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{
            borderBottom: "1px solid rgba(16,185,129,0.15)",
            background: "rgba(16,185,129,0.04)",
          }}
        >
          {claimed ? (
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-400">Winnings Claimed</p>
                <p className="text-[10px] text-zinc-500">
                  {parseFloat(payoutEth).toFixed(4)} ETH received
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-xs font-semibold text-white">You won!</p>
                </div>
                <p className="text-xs font-bold text-emerald-400 tabular-nums">
                  {parseFloat(payoutEth).toFixed(4)} ETH
                </p>
              </div>
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  isClaiming
                    ? { background: "rgba(255,255,255,0.05)", color: "#71717a" }
                    : { background: "linear-gradient(135deg, #10b981, #059669)", color: "#000" }
                }
              >
                {isClaiming ? "Claiming…" : "Claim Winnings"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 px-4 text-center">
            <Wallet className="w-6 h-6 text-zinc-800" />
            <p className="text-xs text-zinc-600">Connect wallet to view bets</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 px-4 text-center">
            <Wallet className="w-6 h-6 text-zinc-800" />
            <p className="text-xs text-zinc-600">Sign in to view bets</p>
          </div>
        ) : scopedBets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 px-4 text-center">
            <Wallet className="w-6 h-6 text-zinc-800" />
            <p className="text-xs text-zinc-600">No bets made</p>
            <p className="text-[10px] text-zinc-700 leading-relaxed">
              Place a bet on an agent from the leaderboard
            </p>
          </div>
        ) : (
          <div>
            {scopedBets.map((bet) => {
              const won = isSettled && winnerId && String(bet.agent_id) === String(winnerId);
              const lost = isSettled && !won;
              const agentData = findAgentById(agents, bet.agent_id);
              const name = bet.agent_name || agentData?.name || "Agent";
              const Icon = won ? Trophy : lost ? X : Clock;
              const statusColor = won ? "#10b981" : lost ? "#ef4444" : "#06b6d4";

              return (
                <div
                  key={bet.id}
                  className="flex items-center gap-2.5 px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${statusColor}15`,
                      border: `1px solid ${statusColor}30`,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: statusColor }} />
                  </div>
                  <span className="flex-1 text-xs text-white truncate">{name}</span>
                  <span className="text-[11px] font-semibold text-zinc-400 tabular-nums flex-shrink-0">
                    {bet.amount_eth || bet.amount || "0"} ETH
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.aside>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// App Header — brand | tournament status | wallet
// ════════════════════════════════════════════════════════════════════════════
function AppHeader() {
  return (
    <div
      className="flex items-stretch shrink-0 border-b border-white/5"
      style={{ background: "#0a0e17" }}
    >
      <div className="w-[200px] shrink-0 flex items-center px-4 py-2 border-r border-white/5">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <MarketBlips width={130} height={44} />
        </Link>
      </div>
      <div className="flex-1 flex items-center">
        <TournamentStatusBar />
      </div>
      <div className="flex items-center justify-end px-4 border-l border-white/5">
        <NavbarAccount />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Page Root
// ════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const { data: tournaments } = useTournaments();
  const selectedTournamentId = useTournamentStore((s) => s.selectedTournamentId);
  const setTournamentId = useTournamentStore((s) => s.setTournamentId);
  const [highlightedAgentId, setHighlightedAgentId] = useState<string | null>(null);
  const [showBetsPanel, setShowBetsPanel] = useState(false);

  useEffect(() => {
    if (tournaments && tournaments.length > 0) {
      const exists = tournaments.some(
        (t) => String(t.id) === selectedTournamentId,
      );
      if (!exists)
        setTournamentId(String(tournaments[0].id), tournaments[0].name);
    }
  }, [tournaments, selectedTournamentId, setTournamentId]);

  // Close bets panel when tournament changes
  useEffect(() => {
    setShowBetsPanel(false);
  }, [selectedTournamentId]);

  if (!selectedTournamentId) {
    return (
      <div className="h-screen flex flex-col" style={{ background: "#0a0e17" }}>
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-600">
            <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            <span className="text-sm">Loading tournament…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "#0a0e17" }}
    >
      <AppHeader />

      <div className="flex-1 flex flex-col min-h-0">
        {/* Top row: sidebar + chart + (user bets panel when open) */}
        <div className="flex-[3] flex min-h-0">
          <AgentsSidebar
            tournamentId={selectedTournamentId}
            onAgentHover={setHighlightedAgentId}
            highlightedAgentId={highlightedAgentId}
            onAgentClick={() => setShowBetsPanel(true)}
          />

          <div className="flex-1 min-w-0 min-h-0">
            <AgentPerformanceChart
              tournamentId={selectedTournamentId}
              highlightedAgentId={highlightedAgentId}
            />
          </div>

          {/* User Bets Panel — 3rd column */}
          <AnimatePresence>
            {showBetsPanel && (
              <UserBetsPanel
                key="user-bets"
                tournamentId={selectedTournamentId}
                onClose={() => setShowBetsPanel(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom row — full-width Recent Trades */}
        <div
          className="flex-[2] min-h-0 overflow-hidden p-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <RecentTrades tournamentId={selectedTournamentId} />
        </div>
      </div>

      <BetModal />
    </div>
  );
}
