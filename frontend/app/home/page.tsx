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
import type { Agent, AgentState, Tournament } from "@/src/types";
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
  Coins,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════
function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

// ════════════════════════════════════════════════════════════════════════════
// AgentAvatar — avatar with graceful initials fallback
// ════════════════════════════════════════════════════════════════════════════
function AgentAvatar({
  avatarUrl,
  name,
  color,
  size = "sm",
  glow = false,
}: {
  avatarUrl?: string | null;
  name: string;
  color: string;
  size?: "sm" | "lg";
  glow?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || name.slice(0, 2).toUpperCase();
  const sizeClass = size === "lg" ? "w-14 h-14" : "w-7 h-7";
  const textSizeClass = size === "lg" ? "text-xl" : "text-[11px]";

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center font-bold flex-shrink-0`}
      style={{
        background: `${color}25`,
        border: `1.5px solid ${color}50`,
        boxShadow: glow ? `0 0 14px ${color}45` : undefined,
      }}
    >
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={textSizeClass} style={{ color }}>
          {initials}
        </span>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// AgentDetailModal — full overlay with comprehensive agent info
// ════════════════════════════════════════════════════════════════════════════
function AgentDetailModal({
  agentState,
  agent,
  color,
  tournamentId,
  canBet,
  tournament,
  onClose,
}: {
  agentState: AgentState;
  agent: Agent | undefined;
  color: string;
  tournamentId: string;
  canBet: boolean;
  tournament: Tournament | undefined | null;
  onClose: () => void;
}) {
  const openBetModal = useBettingStore((s) => s.openBetModal);
  const name = agent?.name ?? "Agent";
  const value = parseFloat(agentState.portfolio_value_usd);
  const portfolio = agentState.portfolio;

  // Crypto holdings (not cash)
  const holdingEntries = Object.entries(portfolio?.holdings ?? {})
    .filter(([, qty]) => Number(qty) > 0)
    .sort(([, a], [, b]) => Number(b) - Number(a));

  const cash = portfolio?.cash ?? 0;
  const roi = portfolio?.roi ?? 0;
  const startingVal = portfolio?.starting_val ?? 0;
  const roiPercent = startingVal > 0
    ? ((value - startingVal) / startingVal) * 100
    : (roi * 100);
  const roiPositive = roiPercent >= 0;
  const winRate = portfolio?.win_rate ?? 0;
  const realizedPnl = portfolio?.realized_pnl ?? 0;

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="rounded-2xl shadow-2xl w-full max-w-sm max-h-[88vh] overflow-y-auto"
        style={{ background: "#0a0e17", border: `1px solid ${color}35` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-5"
          style={{
            background: `linear-gradient(135deg, ${color}10, transparent 60%)`,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-start gap-4">
            <AgentAvatar avatarUrl={agent?.avatar_url} name={name} color={color} size="lg" glow />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white leading-tight">{name}</h2>
              {agent?.strategy_type && (
                <span
                  className="inline-block mt-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}
                >
                  {agent.strategy_type}
                </span>
              )}
              {agent?.personality && (
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                  {agent.personality}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Stats — 2×2 grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3 h-3" style={{ color }} />
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Portfolio</span>
              </div>
              <p className="text-base font-bold" style={{ color }}>
                ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3 h-3" style={{ color: roiPositive ? "#10b981" : "#ef4444" }} />
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider">ROI</span>
              </div>
              <p className="text-base font-bold" style={{ color: roiPositive ? "#10b981" : "#ef4444" }}>
                {roiPositive ? "+" : ""}{roiPercent.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="w-3 h-3 text-amber-500" />
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Rank</span>
              </div>
              <p className="text-base font-bold text-white">#{agentState.rank}</p>
            </div>
            <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="w-3 h-3 text-zinc-500" />
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Trades</span>
              </div>
              <p className="text-base font-bold text-white">
                {agentState.trades_count}
                {winRate > 0 && (
                  <span className="text-[10px] text-zinc-500 font-normal ml-1.5">
                    {(winRate * 100).toFixed(0)}% win
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Portfolio — crypto holdings + cash */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
            >
              <Coins className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Portfolio</span>
              <span className="ml-auto text-[9px] text-zinc-700">
                {holdingEntries.length} asset{holdingEntries.length !== 1 ? "s" : ""} + cash
              </span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {/* Crypto holdings */}
              {holdingEntries.map(([asset, qty]) => (
                <div key={asset} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
                    >
                      {asset.slice(0, 3)}
                    </div>
                    <span className="text-sm font-medium text-white">{asset}</span>
                  </div>
                  <span className="text-sm font-mono text-zinc-300 tabular-nums">
                    {Number(qty).toLocaleString(undefined, {
                      maximumFractionDigits: Number(qty) < 1 ? 6 : 4,
                    })}
                  </span>
                </div>
              ))}
              {/* Cash balance */}
              {cash > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}
                    >
                      $
                    </div>
                    <span className="text-sm font-medium text-white">Cash</span>
                  </div>
                  <span className="text-sm font-mono text-emerald-400 tabular-nums">
                    ${cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {/* Empty state */}
              {holdingEntries.length === 0 && cash === 0 && (
                <div className="px-4 py-4 text-center text-[11px] text-zinc-600">
                  No holdings yet
                </div>
              )}
            </div>
            {/* PnL footer */}
            {(Math.abs(realizedPnl) > 0) && (
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}
              >
                <span className="text-[10px] text-zinc-600">Realized P&L</span>
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: realizedPnl >= 0 ? "#10b981" : "#ef4444" }}
                >
                  {realizedPnl >= 0 ? "+" : ""}${Math.abs(realizedPnl).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Last Signal */}
          {agentState.last_decision && (
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)" }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Last Signal</span>
              </div>
              <p className="text-[12px] text-zinc-300 leading-relaxed">{agentState.last_decision}</p>
            </div>
          )}

          {/* Last Updated */}
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
            <Clock className="w-3 h-3" />
            <span>Last updated {formatRelativeTime(agentState.updated_at)}</span>
          </div>

          {/* CTA */}
          {canBet ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                openBetModal({
                  tournament_id: tournamentId,
                  tournament_name: tournament?.name,
                  agent_id: agentState.agent_id,
                  agent_name: name,
                  contract_tournament_id: tournament?.contract_tournament_id ?? null,
                  contract_agent_id: tournament?.agent_contract_mapping?.[agentState.agent_id] ?? null,
                });
              }}
              className="w-full py-3 rounded-xl font-bold text-sm text-black"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
            >
              Place Bet on {name}
            </motion.button>
          ) : (
            <div className="w-full py-2.5 rounded-xl text-center text-[11px] text-zinc-600 border border-white/5">
              Betting is closed
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Left Sidebar — Agent Leaderboard (click to open detail modal)
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
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { data: agentStates } = useTournamentAgentStates(tournamentId);
  const { data: agents } = useAgents();
  const { data: tournament } = useTournament(tournamentId);
  const tournamentStatus = useTournamentStore((s) => s.selectedTournamentStatus);

  const sorted = agentStates
    ? [...agentStates].sort((a, b) => (a.rank || 999) - (b.rank || 999))
    : [];
  const totalValue = sorted.reduce(
    (s, a) => s + parseFloat(a.portfolio_value_usd),
    0,
  );
  const canBet = tournamentStatus === "LIVE" && !tournament?.betting_closed;

  const selectedState = selectedAgentId
    ? sorted.find((s) => s.agent_id === selectedAgentId) ?? null
    : null;
  const selectedAgent = selectedState
    ? findAgentById(agents, selectedState.agent_id)
    : undefined;
  const selectedColor = selectedState ? getAgentColor(selectedState.agent_id) : "#10b981";

  return (
    <>
      <aside
        className="w-[220px] flex-shrink-0 flex flex-col overflow-hidden"
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
            const isSelected = selectedAgentId === state.agent_id;
            const isFirst = i === 0;

            return (
              <motion.div
                key={state.agent_id}
                className="relative cursor-pointer group"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={() => onAgentHover(state.agent_id)}
                onMouseLeave={() => onAgentHover(null)}
                onClick={() => {
                  setSelectedAgentId(state.agent_id);
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
                  style={{ background: color, opacity: isHovered || isSelected ? 1 : 0 }}
                />

                <div className="relative flex items-center gap-2.5 px-4 py-3">
                  <div className="relative flex-shrink-0">
                    {isFirst && (
                      <div
                        className="absolute inset-0 rounded-full blur-sm opacity-50 scale-110"
                        style={{ background: color }}
                      />
                    )}
                    <div className="relative">
                      <AgentAvatar
                        avatarUrl={agent?.avatar_url}
                        name={name}
                        color={color}
                        size="sm"
                        glow={isHovered || isSelected}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-[13px] font-semibold text-white truncate leading-tight">
                        {name}
                      </p>
                      <ChevronRight className="w-3 h-3 text-zinc-700 flex-shrink-0 group-hover:text-zinc-400 transition-colors" />
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

      {/* Agent Detail Modal */}
      <AnimatePresence>
        {selectedState && (
          <AgentDetailModal
            agentState={selectedState}
            agent={selectedAgent}
            color={selectedColor}
            tournamentId={tournamentId}
            canBet={canBet}
            tournament={tournament}
            onClose={() => setSelectedAgentId(null)}
          />
        )}
      </AnimatePresence>
    </>
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
    if (contractTournamentId == null) return;
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
