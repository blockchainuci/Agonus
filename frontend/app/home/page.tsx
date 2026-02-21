"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TournamentStatusBar } from "./components/TournamentStatusBar";
import AgentPerformanceChart from "./components/AgentPerformanceChart";
import { useTournaments, useTournament } from "@/src/hooks/useTournaments";
import { useTournamentStore } from "@/src/store/useTournamentStore";
import { useTournamentAgentStates } from "@/src/hooks/useAgentStates";
import { useAgents } from "@/src/hooks/useAgents";
import { useTournamentTrades } from "@/src/hooks/useTrades";
import { useBettingStore } from "@/src/store/useBettingStore";
import { useAccount } from "wagmi";
import { useWalletAuth } from "@/src/hooks/useWalletAuth";
import BetModal from "@/src/betting/BetModal";
import { findAgentById } from "@/src/util/findAgentById";
import {
  X,
  Trophy,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronDown,
  Activity,
  Wallet,
  Zap,
  TrendingUp,
  Info,
  Target,
  Percent,
  Brain,
} from "lucide-react";

// ─── shared constants ────────────────────────────────────────────────────────
const AGENT_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

function ago(ts: string) {
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
}

// ════════════════════════════════════════════════════════════════════════════
// Bets Section — shown below chart
// ════════════════════════════════════════════════════════════════════════════
function BetsSection({ tournamentId }: { tournamentId: string }) {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useWalletAuth();
  const myBets = useBettingStore((s) => s.myBets);
  const refreshMyBets = useBettingStore((s) => s.refreshMyBets);
  const { data: agents } = useAgents();
  const { data: tournament } = useTournament(tournamentId);

  useEffect(() => {
    if (isConnected && isAuthenticated) refreshMyBets(tournamentId);
  }, [isConnected, isAuthenticated, tournamentId]);

  const scopedBets = myBets.filter(
    (b) => String(b.tournament_id) === String(tournamentId),
  );
  const winnerId = tournament?.winner_agent_id;
  const isSettled = tournament?.status === "completed";

  if (!isConnected || !isAuthenticated || scopedBets.length === 0) {
    return null;
  }

  return (
    <div
      className="flex-shrink-0 border-t"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="px-4 py-2 flex items-center gap-2 border-b border-white/[0.05]">
        <Wallet className="w-3.5 h-3.5 text-zinc-500" />
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
          Your Bets
        </p>
        <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
          {scopedBets.length}
        </span>
      </div>

      <div className="flex gap-2 px-4 py-2 overflow-x-auto">
        {scopedBets.map((bet) => {
          const won =
            isSettled && winnerId && String(bet.agent_id) === String(winnerId);
          const lost = isSettled && !won;
          const agentData = findAgentById(agents, bet.agent_id);
          const name = bet.agent_name || agentData?.name || "Agent";
          const Icon = won ? Trophy : lost ? X : Clock;
          const statusColor = won
            ? "#10b981"
            : lost
              ? "#ef4444"
              : "#06b6d4";

          return (
            <div
              key={bet.id}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{
                  background: `${statusColor}15`,
                  border: `1px solid ${statusColor}30`,
                }}
              >
                <Icon className="w-3 h-3" style={{ color: statusColor }} />
              </div>
              <span className="text-xs text-white">{name}</span>
              <span className="text-[11px] font-semibold text-zinc-400 tabular-nums">
                {bet.amount_eth || bet.amount || "0"} ETH
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Left Sidebar — Agent Leaderboard with Inline Expansion
// ════════════════════════════════════════════════════════════════════════════
function AgentsSidebar({
  tournamentId,
  onAgentHover,
  highlightedAgentId,
}: {
  tournamentId: string;
  onAgentHover: (id: string | null) => void;
  highlightedAgentId: string | null;
}) {
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState<Set<string>>(new Set());
  const { data: agentStates } = useTournamentAgentStates(tournamentId);
  const { data: agents } = useAgents();
  const { data: tournament } = useTournament(tournamentId);
  const openBetModal = useBettingStore((s) => s.openBetModal);
  const tournamentStatus = useTournamentStore(
    (s) => s.selectedTournamentStatus,
  );

  const sorted = agentStates
    ? [...agentStates].sort((a, b) => (a.rank || 999) - (b.rank || 999))
    : [];
  const totalValue = sorted.reduce(
    (s, a) => s + parseFloat(a.portfolio_value_usd),
    0,
  );
  const canBet = tournamentStatus === "LIVE" && !tournament?.betting_closed;

  const toggleExpand = (agentId: string) => {
    setExpandedAgentId((prev) => (prev === agentId ? null : agentId));
  };

  const toggleDetails = (agentId: string) => {
    setDetailsExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

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
          const color = AGENT_COLORS[i % AGENT_COLORS.length];
          const isActive = highlightedAgentId === state.agent_id;
          const isFirst = i === 0;
          const isExpanded = expandedAgentId === state.agent_id;

          return (
            <div key={state.agent_id}>
              <motion.div
                className="relative cursor-pointer group"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={() => onAgentHover(state.agent_id)}
                onMouseLeave={() => onAgentHover(null)}
                onClick={() => toggleExpand(state.agent_id)}
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {/* hover bg */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(90deg, ${color}10, transparent)`,
                  }}
                />
                {/* active left bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 transition-opacity rounded-r"
                  style={{ background: color, opacity: isActive ? 1 : 0 }}
                />

                <div className="relative flex items-center gap-2.5 px-4 py-3">
                  {/* rank dot */}
                  <div className="relative flex-shrink-0">
                    {isFirst && (
                      <div
                        className="absolute inset-0 rounded-full blur-sm opacity-70"
                        style={{ background: color }}
                      />
                    )}
                    <div
                      className="relative w-2 h-2 rounded-full"
                      style={{
                        background: color,
                        boxShadow: isActive ? `0 0 8px ${color}` : "none",
                      }}
                    />
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
                      <span
                        className="text-[11px] font-bold tabular-nums"
                        style={{ color }}
                      >
                        $
                        {value.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Inline Expanded Details */}
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
                    <div className="px-4 py-3 space-y-3">
                      {/* Portfolio & Trades */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3" style={{ color }} />
                            <span className="text-[9px] text-zinc-500 uppercase">
                              Portfolio
                            </span>
                          </div>
                          <p className="text-sm font-bold" style={{ color }}>
                            $
                            {value.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                        <div className="rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex items-center gap-1 mb-1">
                            <Activity className="w-3 h-3 text-zinc-500" />
                            <span className="text-[9px] text-zinc-500 uppercase">
                              Trades
                            </span>
                          </div>
                          <p className="text-sm font-bold text-white">
                            {state.trades_count}
                          </p>
                        </div>
                      </div>

                      {/* Last Decision */}
                      {state.last_decision && (
                        <div className="rounded-lg p-2.5 bg-white/[0.02] border border-white/[0.05]">
                          <div className="flex items-center gap-1 mb-1.5">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-[9px] text-zinc-500 uppercase">
                              Last Signal
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-3">
                            {state.last_decision}
                          </p>
                        </div>
                      )}

                      {/* View Details Button & Expanded Section */}
                      {agent && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDetails(state.agent_id);
                            }}
                            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <Info className="w-3 h-3 text-zinc-500" />
                              <span className="text-[10px] text-zinc-400">
                                View Details
                              </span>
                            </div>
                            <ChevronDown
                              className="w-3 h-3 text-zinc-600 transition-transform"
                              style={{
                                transform: detailsExpanded.has(state.agent_id)
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                              }}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {detailsExpanded.has(state.agent_id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-2 pt-2">
                                  {/* Personality */}
                                  {agent.personality && (
                                    <div className="rounded-lg p-2.5 bg-white/[0.02] border border-white/[0.04]">
                                      <div className="flex items-center gap-1 mb-1">
                                        <Brain className="w-3 h-3 text-purple-400" />
                                        <span className="text-[9px] text-zinc-500 uppercase">
                                          Personality
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-zinc-300 leading-relaxed">
                                        {agent.personality}
                                      </p>
                                    </div>
                                  )}

                                  {/* Metrics Grid */}
                                  <div className="grid grid-cols-2 gap-2">
                                    {agent.strategy_type && (
                                      <div className="rounded-lg p-2 bg-white/[0.02] border border-white/[0.04]">
                                        <span className="text-[8px] text-zinc-600 uppercase block mb-0.5">
                                          Strategy
                                        </span>
                                        <p className="text-[10px] font-medium text-zinc-300 capitalize">
                                          {agent.strategy_type.replace(/_/g, " ")}
                                        </p>
                                      </div>
                                    )}
                                    {typeof agent.stats?.risk_score === "number" && (
                                      <div className="rounded-lg p-2 bg-white/[0.02] border border-white/[0.04]">
                                        <span className="text-[8px] text-zinc-600 uppercase block mb-0.5">
                                          Risk
                                        </span>
                                        <p className="text-[10px] font-medium text-zinc-300">
                                          {agent.stats.risk_score}/10
                                        </p>
                                      </div>
                                    )}
                                    {typeof agent.stats?.win_rate === "number" && (
                                      <div className="rounded-lg p-2 bg-white/[0.02] border border-white/[0.04]">
                                        <div className="flex items-center gap-0.5 mb-0.5">
                                          <Percent className="w-2 h-2 text-zinc-600" />
                                          <span className="text-[8px] text-zinc-600 uppercase">
                                            Win Rate
                                          </span>
                                        </div>
                                        <p className="text-[10px] font-medium text-emerald-400">
                                          {(agent.stats.win_rate * 100).toFixed(0)}%
                                        </p>
                                      </div>
                                    )}
                                    {typeof agent.stats?.roi_percent === "number" && (
                                      <div className="rounded-lg p-2 bg-white/[0.02] border border-white/[0.04]">
                                        <div className="flex items-center gap-0.5 mb-0.5">
                                          <Target className="w-2 h-2 text-zinc-600" />
                                          <span className="text-[8px] text-zinc-600 uppercase">
                                            ROI
                                          </span>
                                        </div>
                                        <p
                                          className="text-[10px] font-medium"
                                          style={{
                                            color:
                                              agent.stats.roi_percent >= 0
                                                ? "#10b981"
                                                : "#ef4444",
                                          }}
                                        >
                                          {agent.stats.roi_percent >= 0 ? "+" : ""}
                                          {agent.stats.roi_percent.toFixed(1)}%
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Description */}
                                  {typeof agent.stats?.description === "string" && (
                                    <div className="rounded-lg p-2.5 bg-white/[0.02] border border-white/[0.04]">
                                      <span className="text-[8px] text-zinc-600 uppercase block mb-1">
                                        Description
                                      </span>
                                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                                        {agent.stats.description}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}

                      {/* Place Bet Button */}
                      {canBet && (
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
                              contract_tournament_id:
                                tournament?.contract_tournament_id ?? null,
                              contract_agent_id:
                                tournament?.agent_contract_mapping?.[
                                  state.agent_id
                                ] ?? null,
                            });
                          }}
                          className="w-full py-2 rounded-lg font-semibold text-xs text-black"
                          style={{
                            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                          }}
                        >
                          Place Bet
                        </motion.button>
                      )}

                      {!canBet && (
                        <div className="text-center text-[10px] text-zinc-600 py-1">
                          Betting closed
                        </div>
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
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
              Total AUM
            </p>
            <p className="text-sm font-bold text-white tabular-nums">
              $
              {totalValue.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Right Panel — Live Trades + Your Bets
// ════════════════════════════════════════════════════════════════════════════
function RightPanel({ tournamentId }: { tournamentId: string }) {
  const { data: trades, isLoading } = useTournamentTrades(tournamentId);
  const { isConnected } = useAccount();
  const { isAuthenticated } = useWalletAuth();
  const myBets = useBettingStore((s) => s.myBets);
  const refreshMyBets = useBettingStore((s) => s.refreshMyBets);
  const { data: agents } = useAgents();
  const { data: tournament } = useTournament(tournamentId);

  useEffect(() => {
    if (isConnected && isAuthenticated) refreshMyBets(tournamentId);
  }, [isConnected, isAuthenticated, tournamentId]);

  const scopedBets = myBets.filter(
    (b) => String(b.tournament_id) === String(tournamentId),
  );
  const winnerId = tournament?.winner_agent_id;
  const recent = trades ? [...trades].slice(0, 30) : [];

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0b1120 0%, #0a0e17 100%)",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Live Trades ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <div
          className="px-4 py-3.5 flex items-center gap-2 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* live dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
            Live Trades
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-white/10 border-t-emerald-500/60 rounded-full animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <Activity className="w-6 h-6 text-zinc-800" />
              <p className="text-xs text-zinc-700">No trades yet</p>
            </div>
          ) : (
            <div>
              {recent.map((trade, i) => {
                const isBuy = trade.action.toLowerCase() === "buy";
                const value =
                  parseFloat(trade.amount) * parseFloat(trade.price);
                const agent = findAgentById(agents, trade.agent_id);
                const agentIdx = agent
                  ? (agents?.findIndex(
                      (a) => String(a.id) === String(trade.agent_id),
                    ) ?? 0)
                  : 0;
                const color = AGENT_COLORS[agentIdx % AGENT_COLORS.length];

                return (
                  <div
                    key={trade.id}
                    className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    {/* direction */}
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: isBuy
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(239,68,68,0.12)",
                        border: `1px solid ${isBuy ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                      }}
                    >
                      {isBuy ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-xs font-bold"
                          style={{ color: isBuy ? "#10b981" : "#ef4444" }}
                        >
                          {trade.asset}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {ago(trade.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span
                          className="text-[11px] truncate max-w-[80px]"
                          style={{ color }}
                        >
                          {agent?.name || trade.agent_id.slice(0, 8)}
                        </span>
                        <span className="text-[11px] font-semibold text-white tabular-nums">
                          $
                          {value >= 1000
                            ? `${(value / 1000).toFixed(1)}k`
                            : value.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Your Bets ── */}
      <div
        className="flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="px-4 py-3.5 flex items-center gap-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Wallet className="w-3.5 h-3.5 text-zinc-500" />
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
            Your Bets
          </p>
          {scopedBets.length > 0 && (
            <span className="ml-auto px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
              {scopedBets.length}
            </span>
          )}
        </div>

        <div className="max-h-[180px] overflow-y-auto">
          {!isConnected ? (
            <p className="text-xs text-zinc-700 px-4 py-3">
              Connect wallet to view
            </p>
          ) : !isAuthenticated ? (
            <p className="text-xs text-zinc-700 px-4 py-3">
              Sign in to view bets
            </p>
          ) : scopedBets.length === 0 ? (
            <p className="text-xs text-zinc-700 px-4 py-3">
              No bets placed yet
            </p>
          ) : (
            <div>
              {scopedBets.map((bet) => {
                const isSettled = tournament?.status === "completed";
                const won =
                  isSettled &&
                  winnerId &&
                  String(bet.agent_id) === String(winnerId);
                const lost = isSettled && !won;
                const agentData = findAgentById(agents, bet.agent_id);
                const name = bet.agent_name || agentData?.name || "Agent";
                const Icon = won ? Trophy : lost ? X : Clock;
                const statusColor = won
                  ? "#10b981"
                  : lost
                    ? "#ef4444"
                    : "#06b6d4";

                return (
                  <div
                    key={bet.id}
                    className="flex items-center gap-2.5 px-4 py-2.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${statusColor}15`,
                        border: `1px solid ${statusColor}30`,
                      }}
                    >
                      <Icon
                        className="w-3 h-3"
                        style={{ color: statusColor }}
                      />
                    </div>
                    <span className="flex-1 text-xs text-white truncate">
                      {name}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-400 tabular-nums flex-shrink-0">
                      {bet.amount_eth || bet.amount || "0"} ETH
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Page Root
// ════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const { data: tournaments } = useTournaments();
  const selectedTournamentId = useTournamentStore(
    (s) => s.selectedTournamentId,
  );
  const setTournamentId = useTournamentStore((s) => s.setTournamentId);
  const [highlightedAgentId, setHighlightedAgentId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (tournaments && tournaments.length > 0) {
      const exists = tournaments.some(
        (t) => String(t.id) === selectedTournamentId,
      );
      if (!exists)
        setTournamentId(String(tournaments[0].id), tournaments[0].name);
    }
  }, [tournaments, selectedTournamentId, setTournamentId]);

  if (!selectedTournamentId) {
    return (
      <div className="h-screen flex flex-col" style={{ background: "#0a0e17" }}>
        <TournamentStatusBar />
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
      {/* tournament status bar — primary chrome */}
      <TournamentStatusBar />

      {/* 3-column body */}
      <div className="flex-1 flex min-h-0">
        <AgentsSidebar
          tournamentId={selectedTournamentId}
          onAgentHover={setHighlightedAgentId}
          highlightedAgentId={highlightedAgentId}
        />

        {/* chart + bets — fills remaining space */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 relative">
            <AgentPerformanceChart
              tournamentId={selectedTournamentId}
              highlightedAgentId={highlightedAgentId}
            />
          </div>
          <BetsSection tournamentId={selectedTournamentId} />
        </div>

        <RightPanel tournamentId={selectedTournamentId} />
      </div>

      <BetModal />
    </div>
  );
}
