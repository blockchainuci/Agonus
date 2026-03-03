"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Link2,
  XCircle,
  Trophy,
  Ban,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  Plus,
  X,
  ArrowRight,
  Play,
  ChevronDown,
  Activity,
  Settings,
  ShieldAlert,
  Cpu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useTournaments } from "@/src/hooks/useTournaments";
import { useAgents } from "@/src/hooks/useAgents";
import { useTournamentAgentStates } from "@/src/hooks/useAgentStates";
import { findAgentById } from "@/src/util/findAgentById";
import {
  useCreateOnchainTournament,
  useStartTournament,
  useCloseBettingOnchain,
  useSettleTournamentOnchain,
  useCancelTournamentOnchain,
} from "@/src/hooks/useAdminOnchain";

// ════════════════════════════════════════════════════════════════════════════
// Helpers & Types
// ════════════════════════════════════════════════════════════════════════════
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (value: string | number) => {
  return `$${Number(value).toLocaleString()}`;
};

const getShortError = (err: unknown): string => {
  const raw = (err as Error)?.message || "Unknown error";
  const revertMatch = raw.match(/execution reverted:\s*([^"',]+)/i);
  if (revertMatch) return revertMatch[1].trim();
  const cleaned = raw
    .replace(/0x[a-fA-F0-9]{10,}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned.length > 80 ? cleaned.slice(0, 80) + "..." : cleaned;
};

// Generates an avatar with a fallback to initials
function AgentAvatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "lg";
}) {
  const [imgError, setImgError] = useState(false);
  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || name.slice(0, 2).toUpperCase();
  const sizeClass = size === "lg" ? "w-12 h-12" : "w-8 h-8";
  const textSizeClass = size === "lg" ? "text-lg" : "text-[10px]";
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center font-bold shrink-0 bg-white/[0.03] border border-white/[0.08]`}
    >
      {!imgError ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`${textSizeClass} text-zinc-400`}>{initials}</span>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [agentSearch, setAgentSearch] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState<
    "all" | "upcoming" | "live" | "completed"
  >("all");
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    string | null
  >(null);
  const [selectedAgentsForOnchain, setSelectedAgentsForOnchain] = useState<
    string[]
  >([]);
  const [winnerAgentId, setWinnerAgentId] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showOnchainPanel, setShowOnchainPanel] = useState(false);
  const [winnerDropdownOpen, setWinnerDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tournaments" | "agents">(
    "tournaments",
  );

  // Real API data
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: agentStates } = useTournamentAgentStates(
    selectedTournamentId || "",
  );

  // On-chain mutations
  const createOnchain = useCreateOnchainTournament();
  const startTournament = useStartTournament();
  const closeBetting = useCloseBettingOnchain();
  const settleTournament = useSettleTournamentOnchain();
  const cancelTournament = useCancelTournamentOnchain();

  const isLoading = tournamentsLoading || agentsLoading;

  // Lock body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = showOnchainPanel ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showOnchainPanel]);

  // Filters
  const filteredTournaments = useMemo(() => {
    if (!tournaments) return [];
    if (tournamentFilter === "all") return tournaments;
    return tournaments.filter(
      (t) => t.status?.toLowerCase() === tournamentFilter,
    );
  }, [tournaments, tournamentFilter]);

  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    if (!agentSearch) return agents;
    return agents.filter((agent) =>
      agent.name.toLowerCase().includes(agentSearch.toLowerCase()),
    );
  }, [agents, agentSearch]);

  const availableAgents = useMemo(() => {
    if (!agents) return [];
    return agents.filter(
      (a) => !selectedAgentsForOnchain.includes(String(a.id)),
    );
  }, [agents, selectedAgentsForOnchain]);

  const assignedAgents = useMemo(() => {
    if (!agents) return [];
    return selectedAgentsForOnchain
      .map((id) => findAgentById(agents, id))
      .filter(Boolean) as typeof agents;
  }, [agents, selectedAgentsForOnchain]);

  const selectedTournament = tournaments?.find(
    (t) => t.id === selectedTournamentId,
  );

  // Agent Selection Handlers
  const addAgent = (agentId: string) =>
    setSelectedAgentsForOnchain((prev) => [...prev, agentId]);
  const removeAgent = (agentId: string) =>
    setSelectedAgentsForOnchain((prev) => prev.filter((id) => id !== agentId));

  // Auto-dismiss toasts
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  // Action Handlers
  const handleCreateOnchain = async () => {
    if (!selectedTournamentId || selectedAgentsForOnchain.length < 2) {
      setActionMessage({
        type: "error",
        text: "Select at least 2 agents to create on-chain tournament",
      });
      return;
    }
    try {
      const result = await createOnchain.mutateAsync({
        tournamentId: selectedTournamentId,
        agentIds: selectedAgentsForOnchain,
      });
      setActionMessage({
        type: "success",
        text: `Tournament linked! TX: ${result.tx_hash.slice(0, 10)}...`,
      });
      setSelectedAgentsForOnchain([]);
    } catch (err) {
      setActionMessage({ type: "error", text: getShortError(err) });
    }
  };

  const handleStartTournament = async () => {
    if (!selectedTournamentId) return;
    try {
      const result = await startTournament.mutateAsync(selectedTournamentId);
      setActionMessage({
        type: "success",
        text: `Started! ${result.agents_count} agents initialized.`,
      });
    } catch (err) {
      setActionMessage({ type: "error", text: getShortError(err) });
    }
  };

  const handleCloseBetting = async () => {
    if (!selectedTournamentId) return;
    try {
      const result = await closeBetting.mutateAsync(selectedTournamentId);
      setActionMessage({
        type: "success",
        text: `Betting closed! TX: ${result.tx_hash.slice(0, 10)}...`,
      });
    } catch (err) {
      setActionMessage({ type: "error", text: getShortError(err) });
    }
  };

  const handleSettleTournament = async () => {
    if (!selectedTournamentId || !winnerAgentId) {
      setActionMessage({
        type: "error",
        text: "Select a winner agent to settle",
      });
      return;
    }
    try {
      const result = await settleTournament.mutateAsync({
        tournamentId: selectedTournamentId,
        winnerAgentId,
      });
      setActionMessage({
        type: "success",
        text: `Settled! TX: ${result.tx_hash.slice(0, 10)}...`,
      });
      setWinnerAgentId("");
    } catch (err) {
      setActionMessage({ type: "error", text: getShortError(err) });
    }
  };

  const handleCancelTournament = async () => {
    if (!selectedTournamentId) return;
    // We replace window.confirm with a custom modal in a real app, but for now we keep the native confirm for simplicity
    if (
      !confirm(
        "Are you sure you want to cancel this tournament? All bets will be refundable.",
      )
    )
      return;
    try {
      const result = await cancelTournament.mutateAsync(selectedTournamentId);
      setActionMessage({
        type: "success",
        text: `Cancelled! TX: ${result.tx_hash.slice(0, 10)}...`,
      });
    } catch (err) {
      setActionMessage({ type: "error", text: getShortError(err) });
    }
  };

  const anyMutationPending =
    createOnchain.isPending ||
    startTournament.isPending ||
    closeBetting.isPending ||
    settleTournament.isPending ||
    cancelTournament.isPending;

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase() || "upcoming";
    if (s === "live")
      return {
        color: "#10b981",
        bg: "rgba(16,185,129,0.1)",
        border: "rgba(16,185,129,0.2)",
      };
    if (s === "completed")
      return {
        color: "#eab308",
        bg: "rgba(234,179,8,0.1)",
        border: "rgba(234,179,8,0.2)",
      };
    return {
      color: "#0ea5e9",
      bg: "rgba(14,165,233,0.1)",
      border: "rgba(14,165,233,0.2)",
    };
  };

  if (isLoading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: "#0a0e17" }}
      >
        <div className="flex items-center gap-3 text-zinc-500">
          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          <span className="text-sm">Loading admin data…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0a0e17" }}
    >
      {/* ─── HEADER ───────────────────────────────────────────────────────── */}
      <div
        className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0 sticky top-0 z-30"
        style={{
          background: "rgba(10,14,23,0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-zinc-400" />
            Admin Operations
          </h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-semibold">
            System Control Panel
          </p>
        </div>

        {/* Action Toast / Global Notification */}
        <AnimatePresence>
          {actionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-2xl border"
              style={{
                background:
                  actionMessage.type === "success"
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(239,68,68,0.1)",
                borderColor:
                  actionMessage.type === "success"
                    ? "rgba(16,185,129,0.2)"
                    : "rgba(239,68,68,0.2)",
              }}
            >
              {actionMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${actionMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}
              >
                {actionMessage.text}
              </span>
              <button
                onClick={() => setActionMessage(null)}
                className="ml-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Tabs */}
        <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("tournaments")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "tournaments" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Tournaments
          </button>
          <button
            onClick={() => setActiveTab("agents")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "agents" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Agents DB
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* TOURNAMENTS TAB */}
        {activeTab === "tournaments" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto space-y-6"
          >
            {/* Filter Bar */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {["all", "upcoming", "live", "completed"].map((filter) => {
                  const isActive = tournamentFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() =>
                        setTournamentFilter(filter as typeof tournamentFilter)
                      }
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                        isActive
                          ? "bg-white/10 text-white border-white/10 shadow-sm"
                          : "bg-transparent text-zinc-500 border-transparent hover:bg-white/5 hover:text-zinc-300"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                {filteredTournaments.length} Tournaments
              </span>
            </div>

            {/* Tournaments Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredTournaments.map((tournament) => {
                const isLive = tournament.status?.toLowerCase() === "live";
                const style = getStatusStyle(tournament.status);
                const agentCount = tournament.agent_contract_mapping
                  ? Object.keys(tournament.agent_contract_mapping).length
                  : 0;

                return (
                  <motion.div
                    key={tournament.id}
                    className="group relative rounded-2xl p-6 cursor-pointer overflow-hidden border transition-all hover:bg-white/[0.02]"
                    style={{
                      background: "#0c1422",
                      borderColor: "rgba(255,255,255,0.05)",
                    }}
                    onClick={() => {
                      setSelectedTournamentId(tournament.id);
                      setSelectedAgentsForOnchain([]);
                      setShowOnchainPanel(true);
                    }}
                    whileHover={{ scale: 0.995 }}
                  >
                    {/* Background glow if live */}
                    {isLive && (
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    )}

                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-white">
                            {tournament.name}
                          </h3>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border"
                            style={{
                              color: style.color,
                              background: style.bg,
                              borderColor: style.border,
                            }}
                          >
                            {tournament.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-6">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />{" "}
                            {formatDate(tournament.start_date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" /> {agentCount}{" "}
                            Agents
                          </span>
                          {tournament.contract_tournament_id != null ? (
                            <span className="flex items-center gap-1.5 text-emerald-400">
                              <Link2 className="w-3.5 h-3.5" /> Linked On-Chain
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-zinc-600">
                              <ShieldAlert className="w-3.5 h-3.5" /> Off-Chain
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                          Prize Pool
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(tournament.prize_pool)}
                        </p>
                      </div>
                    </div>

                    {/* Mapped Agents Preview */}
                    {tournament.agent_contract_mapping &&
                      Object.keys(tournament.agent_contract_mapping).length >
                        0 && (
                        <div className="pt-4 mt-2 border-t border-white/5 relative z-10">
                          <div className="flex items-center gap-1">
                            {Object.keys(tournament.agent_contract_mapping)
                              .slice(0, 8)
                              .map((agentId) => {
                                const agent = findAgentById(agents, agentId);
                                return (
                                  <div
                                    key={agentId}
                                    className="-ml-2 first:ml-0 relative group/avatar"
                                  >
                                    <AgentAvatar
                                      name={agent?.name || agentId}
                                      size="sm"
                                    />
                                  </div>
                                );
                              })}
                            {Object.keys(tournament.agent_contract_mapping)
                              .length > 8 && (
                              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center -ml-2 text-[10px] font-bold text-zinc-400 z-10">
                                +
                                {Object.keys(tournament.agent_contract_mapping)
                                  .length - 8}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </motion.div>
                );
              })}
              {filteredTournaments.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-500">
                  <Activity className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">
                    No tournaments found for this filter.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* AGENTS TAB */}
        {activeTab === "agents" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto space-y-6"
          >
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search agents by name..."
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 text-white placeholder:text-zinc-600 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-zinc-500 focus:bg-white/[0.04] transition-all"
                />
              </div>
              <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                {filteredAgents.length} Agents
              </span>
            </div>

            {/* Agent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAgents.map((agent) => {
                const stats =
                  (agent.stats as Record<string, number | undefined>) || {};
                const totalTournaments = stats.total_tournaments ?? 0;
                const wins = stats.wins ?? 0;
                const winRate = stats.win_rate ?? 0;

                return (
                  <div
                    key={agent.id}
                    className="bg-[#0c1422] rounded-2xl p-5 border border-white/5 hover:bg-white/[0.03] transition-colors flex flex-col h-full"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <AgentAvatar name={agent.name} size="lg" />
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-white text-base truncate">
                          {agent.name}
                        </h3>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 uppercase tracking-widest">
                          {agent.strategy_type?.replace("_", " ") || "STANDARD"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-6 flex-1">
                      {agent.personality ||
                        "Standard trading protocols active. No specific personality traits assigned."}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">
                          {totalTournaments}
                        </p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                          Events
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-emerald-400">
                          {wins}
                        </p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                          Wins
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-yellow-400">
                          {(winRate * 100).toFixed(0)}%
                        </p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                          Rate
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── ON-CHAIN ACTIONS PANEL (Slide-in right column) ─────────────── */}
      <AnimatePresence>
        {showOnchainPanel && selectedTournament && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOnchainPanel(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[500px] shadow-2xl z-50 overflow-y-auto flex flex-col"
              style={{
                background: "#0c1422",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Panel Header */}
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-black/20 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Tournament Control
                    </h2>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {selectedTournament.id.slice(0, 12)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOnchainPanel(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1">
                {/* Status Card */}
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <h3 className="font-bold text-white text-lg mb-4">
                    {selectedTournament.name}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                        Status
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {selectedTournament.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                        Prize Pool
                      </span>
                      <span className="text-sm font-bold text-yellow-400">
                        {formatCurrency(selectedTournament.prize_pool)}
                      </span>
                    </div>
                    {selectedTournament.contract_tournament_id != null && (
                      <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                          Contract ID
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                          #{selectedTournament.contract_tournament_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ===== NOT LINKED: Agent Assignment + Create ===== */}
                {selectedTournament.contract_tournament_id == null && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-zinc-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                        1. Assign Agents
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Available */}
                      <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden flex flex-col h-[300px]">
                        <div className="px-3 py-2 border-b border-white/5 bg-white/[0.02]">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Available ({availableAgents.length})
                          </p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                          {availableAgents.map((agent) => (
                            <div
                              key={agent.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] group"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <AgentAvatar name={agent.name} size="sm" />
                                <span className="text-xs text-white truncate">
                                  {agent.name}
                                </span>
                              </div>
                              <button
                                onClick={() => addAgent(agent.id)}
                                className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-cyan-500/20 hover:text-cyan-400 transition-all shrink-0"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Assigned */}
                      <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden flex flex-col h-[300px]">
                        <div className="px-3 py-2 border-b border-white/5 bg-cyan-500/5">
                          <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">
                            Assigned ({assignedAgents.length})
                          </p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                          {assignedAgents.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center p-4">
                              <p className="text-[10px] text-zinc-600 uppercase tracking-widest leading-relaxed">
                                Select agents from
                                <br />
                                the left panel
                              </p>
                            </div>
                          ) : (
                            assignedAgents.map((agent, idx) => (
                              <div
                                key={agent.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 group"
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className="text-[9px] font-bold text-cyan-600 w-3">
                                    {idx + 1}
                                  </span>
                                  <AgentAvatar name={agent.name} size="sm" />
                                  <span className="text-xs text-white truncate">
                                    {agent.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeAgent(agent.id)}
                                  className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/20 text-red-400 transition-all shrink-0"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCreateOnchain}
                      disabled={anyMutationPending || assignedAgents.length < 2}
                      className="w-full py-3.5 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 mt-4 disabled:opacity-50 transition-all hover:scale-[0.98]"
                      style={{
                        background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                      }}
                    >
                      {createOnchain.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                      Link Tournament On-Chain
                    </button>
                  </div>
                )}

                {/* ===== LINKED: Lifecycle actions ===== */}
                {selectedTournament.contract_tournament_id != null && (
                  <div className="space-y-6">
                    {/* Lifecycle Graphic */}
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-3">
                        Lifecycle Stage
                      </h3>
                      <div className="flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-widest relative">
                        {/* Track */}
                        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 -z-10" />

                        {/* Nodes */}
                        <div className="flex flex-col items-center gap-2 bg-[#0c1422]">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <span className="text-emerald-500">Linked</span>
                        </div>

                        <div className="flex flex-col items-center gap-2 bg-[#0c1422]">
                          <div
                            className={`w-3 h-3 rounded-full ${selectedTournament.status === "live" || selectedTournament.status === "completed" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-white/20"}`}
                          />
                          <span
                            className={
                              selectedTournament.status === "live" ||
                              selectedTournament.status === "completed"
                                ? "text-emerald-500"
                                : "text-zinc-600"
                            }
                          >
                            Live
                          </span>
                        </div>

                        <div className="flex flex-col items-center gap-2 bg-[#0c1422]">
                          <div
                            className={`w-3 h-3 rounded-full ${selectedTournament.betting_closed ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-white/20"}`}
                          />
                          <span
                            className={
                              selectedTournament.betting_closed
                                ? "text-amber-500"
                                : "text-zinc-600"
                            }
                          >
                            Closed
                          </span>
                        </div>

                        <div className="flex flex-col items-center gap-2 bg-[#0c1422]">
                          <div
                            className={`w-3 h-3 rounded-full ${selectedTournament.winner_agent_id ? "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" : selectedTournament.status === "completed" ? "bg-red-500" : "bg-white/20"}`}
                          />
                          <span
                            className={
                              selectedTournament.winner_agent_id
                                ? "text-yellow-400"
                                : selectedTournament.status === "completed"
                                  ? "text-red-500"
                                  : "text-zinc-600"
                            }
                          >
                            Settled
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Cards */}
                    <div className="space-y-3">
                      {/* Start Tournament */}
                      {selectedTournament.status?.toLowerCase() ===
                        "upcoming" && (
                        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                          <p className="text-sm font-bold text-emerald-400 mb-1">
                            Start Tournament
                          </p>
                          <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
                            Initialize agents and transition tournament state to
                            Live. Users can begin betting.
                          </p>
                          <button
                            onClick={handleStartTournament}
                            disabled={anyMutationPending}
                            className="w-full py-2.5 rounded-lg text-xs font-bold text-black flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 transition-all disabled:opacity-50"
                          >
                            {startTournament.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            Execute Start
                          </button>
                        </div>
                      )}

                      {/* Close Betting */}
                      {!selectedTournament.betting_closed &&
                        !selectedTournament.winner_agent_id &&
                        selectedTournament.status?.toLowerCase() !==
                          "completed" && (
                          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                            <p className="text-sm font-bold text-amber-400 mb-1">
                              Close Betting
                            </p>
                            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
                              Lock the betting pools. No further wagers can be
                              placed on this tournament.
                            </p>
                            <button
                              onClick={handleCloseBetting}
                              disabled={anyMutationPending}
                              className="w-full py-2.5 rounded-lg text-xs font-bold text-black flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 transition-all disabled:opacity-50"
                            >
                              {closeBetting.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              Execute Close
                            </button>
                          </div>
                        )}

                      {/* Settle Tournament */}
                      {selectedTournament.betting_closed &&
                        !selectedTournament.winner_agent_id &&
                        selectedTournament.status?.toLowerCase() !==
                          "completed" && (
                          <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 overflow-visible">
                            <p className="text-sm font-bold text-yellow-400 mb-1">
                              Settle Tournament
                            </p>
                            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
                              Declare the winner and distribute the prize pool
                              via smart contract.
                            </p>

                            {/* Dropdown UI */}
                            <div className="relative mb-3 z-50">
                              {(() => {
                                const opts =
                                  selectedTournament.agent_contract_mapping
                                    ? Object.keys(
                                        selectedTournament.agent_contract_mapping,
                                      ).map((id) => ({
                                        id,
                                        name:
                                          findAgentById(agents, id)?.name || id,
                                      }))
                                    : [];
                                const selected = opts.find(
                                  (o) => o.id === winnerAgentId,
                                );

                                return (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setWinnerDropdownOpen((v) => !v)
                                      }
                                      className="w-full flex items-center justify-between bg-black/40 hover:bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer"
                                    >
                                      <span
                                        className={
                                          selected
                                            ? "text-white"
                                            : "text-zinc-500"
                                        }
                                      >
                                        {selected
                                          ? selected.name
                                          : "Select Winning Agent..."}
                                      </span>
                                      <ChevronDown
                                        className={`w-4 h-4 text-zinc-500 transition-transform ${winnerDropdownOpen ? "rotate-180" : ""}`}
                                      />
                                    </button>
                                    {winnerDropdownOpen && (
                                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#121c2d] border border-white/10 rounded-lg shadow-2xl overflow-hidden py-1">
                                        {opts.map((opt) => (
                                          <button
                                            key={opt.id}
                                            onClick={() => {
                                              setWinnerAgentId(opt.id);
                                              setWinnerDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                                          >
                                            <AgentAvatar
                                              name={opt.name}
                                              size="sm"
                                            />
                                            <span className="text-xs font-semibold text-white">
                                              {opt.name}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>

                            <button
                              onClick={handleSettleTournament}
                              disabled={anyMutationPending || !winnerAgentId}
                              className="w-full py-2.5 rounded-lg text-xs font-bold text-black flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 transition-all disabled:opacity-50"
                            >
                              {settleTournament.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trophy className="w-3.5 h-3.5" />
                              )}
                              Execute Settlement
                            </button>
                          </div>
                        )}

                      {/* Cancel Tournament */}
                      {!selectedTournament.winner_agent_id &&
                        selectedTournament.status?.toLowerCase() !==
                          "completed" && (
                          <div className="pt-4 mt-6 border-t border-white/5">
                            <button
                              onClick={handleCancelTournament}
                              disabled={anyMutationPending}
                              className="w-full py-2 rounded-lg text-[11px] font-bold text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
                            >
                              {cancelTournament.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Ban className="w-3 h-3" />
                              )}
                              Emergency Cancel
                            </button>
                          </div>
                        )}

                      {/* Terminal States Info */}
                      {selectedTournament.winner_agent_id && (
                        <div className="p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-center">
                          <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                          <p className="text-sm font-bold text-yellow-400">
                            Successfully Settled
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            Payouts distributed via smart contract.
                          </p>
                        </div>
                      )}

                      {!selectedTournament.winner_agent_id &&
                        selectedTournament.status?.toLowerCase() ===
                          "completed" && (
                          <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/10 text-center">
                            <Ban className="w-6 h-6 text-red-400 mx-auto mb-2" />
                            <p className="text-sm font-bold text-red-400">
                              Tournament Cancelled
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-1">
                              All wagers have been refunded to users.
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
