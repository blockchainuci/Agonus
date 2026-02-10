"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Link2, XCircle, Trophy, Ban, Loader2, CheckCircle, AlertCircle, Calendar, DollarSign, Users, Plus, X, ArrowRight, Play } from "lucide-react";
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
import { useAuthStore } from "@/src/store/useAuthStore";

// Helper to format dates
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper to format currency
const formatCurrency = (value: string | number) => {
  return `$${Number(value).toLocaleString()}`;
};

// Extract short, readable error message from contract/API errors
const getShortError = (err: unknown): string => {
  const raw = (err as Error)?.message || 'Unknown error';
  // Try to extract "execution reverted: <reason>" pattern
  const revertMatch = raw.match(/execution reverted:\s*([^"',]+)/i);
  if (revertMatch) return revertMatch[1].trim();
  // Strip hex data and long hashes
  const cleaned = raw.replace(/0x[a-fA-F0-9]{10,}/g, '').replace(/\s{2,}/g, ' ').trim();
  return cleaned.length > 80 ? cleaned.slice(0, 80) + '...' : cleaned;
};

// Generate DiceBear avatar URL
const getAvatarUrl = (name: string) =>
  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

export default function AdminDashboard() {
  const { isAuthenticated, role } = useAuthStore();
  const [agentSearch, setAgentSearch] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState<"all" | "upcoming" | "live" | "completed">("all");
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectedAgentsForOnchain, setSelectedAgentsForOnchain] = useState<string[]>([]);
  const [winnerAgentId, setWinnerAgentId] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showOnchainPanel, setShowOnchainPanel] = useState(false);

  // Real API data
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: agentStates } = useTournamentAgentStates(selectedTournamentId || "");

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
    return () => { document.body.style.overflow = ""; };
  }, [showOnchainPanel]);

  // Filter tournaments by status
  const filteredTournaments = useMemo(() => {
    if (!tournaments) return [];
    if (tournamentFilter === "all") return tournaments;
    return tournaments.filter(t => t.status?.toLowerCase() === tournamentFilter);
  }, [tournaments, tournamentFilter]);

  // Filter agents by search
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    if (!agentSearch) return agents;
    return agents.filter(agent =>
      agent.name.toLowerCase().includes(agentSearch.toLowerCase())
    );
  }, [agents, agentSearch]);

  // Available agents = all agents minus already-selected ones
  const availableAgents = useMemo(() => {
    if (!agents) return [];
    return agents.filter(a => !selectedAgentsForOnchain.includes(String(a.id)));
  }, [agents, selectedAgentsForOnchain]);

  // Assigned agents in order, with their data
  const assignedAgents = useMemo(() => {
    if (!agents) return [];
    return selectedAgentsForOnchain
      .map(id => findAgentById(agents, id))
      .filter(Boolean) as typeof agents;
  }, [agents, selectedAgentsForOnchain]);

  const selectedTournament = tournaments?.find(t => t.id === selectedTournamentId);

  // Add agent to assignment list
  const addAgent = (agentId: string) => {
    setSelectedAgentsForOnchain(prev => [...prev, agentId]);
  };

  // Remove agent from assignment list
  const removeAgent = (agentId: string) => {
    setSelectedAgentsForOnchain(prev => prev.filter(id => id !== agentId));
  };

  // Handle on-chain create
  const handleCreateOnchain = async () => {
    if (!selectedTournamentId || selectedAgentsForOnchain.length < 2) {
      setActionMessage({ type: 'error', text: 'Select at least 2 agents to create on-chain tournament' });
      return;
    }

    try {
      const result = await createOnchain.mutateAsync({
        tournamentId: selectedTournamentId,
        agentIds: selectedAgentsForOnchain,
      });
      setActionMessage({ type: 'success', text: `Tournament linked on-chain! TX: ${result.tx_hash.slice(0, 10)}...` });
      setSelectedAgentsForOnchain([]);
    } catch (err) {
      setActionMessage({ type: 'error', text: getShortError(err) });
    }
  };

  // Handle start tournament
  const handleStartTournament = async () => {
    if (!selectedTournamentId) return;
    try {
      const result = await startTournament.mutateAsync(selectedTournamentId);
      setActionMessage({ type: 'success', text: `Tournament started! ${result.agents_count} agents initialized.` });
    } catch (err) {
      setActionMessage({ type: 'error', text: getShortError(err) });
    }
  };

  // Handle close betting
  const handleCloseBetting = async () => {
    if (!selectedTournamentId) return;
    try {
      const result = await closeBetting.mutateAsync(selectedTournamentId);
      setActionMessage({ type: 'success', text: `Betting closed! TX: ${result.tx_hash.slice(0, 10)}...` });
    } catch (err) {
      setActionMessage({ type: 'error', text: getShortError(err) });
    }
  };

  // Handle settle tournament
  const handleSettleTournament = async () => {
    if (!selectedTournamentId || !winnerAgentId) {
      setActionMessage({ type: 'error', text: 'Select a winner agent to settle' });
      return;
    }
    try {
      const result = await settleTournament.mutateAsync({
        tournamentId: selectedTournamentId,
        winnerAgentId,
      });
      setActionMessage({ type: 'success', text: `Tournament settled! TX: ${result.tx_hash.slice(0, 10)}...` });
      setWinnerAgentId("");
    } catch (err) {
      setActionMessage({ type: 'error', text: getShortError(err) });
    }
  };

  // Handle cancel tournament
  const handleCancelTournament = async () => {
    if (!selectedTournamentId) return;
    if (!confirm("Are you sure you want to cancel this tournament? All bets will be refundable.")) return;
    try {
      const result = await cancelTournament.mutateAsync(selectedTournamentId);
      setActionMessage({ type: 'success', text: `Tournament cancelled! TX: ${result.tx_hash.slice(0, 10)}...` });
    } catch (err) {
      setActionMessage({ type: 'error', text: getShortError(err) });
    }
  };

  const anyMutationPending = createOnchain.isPending || startTournament.isPending || closeBetting.isPending || settleTournament.isPending || cancelTournament.isPending;

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'upcoming';
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      live: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[statusLower] || colors.upcoming;
  };

  // Auth gate - only admins can access this page
  if (!isAuthenticated || role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-gray-400">Please sign in with an admin wallet to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="ml-3 text-gray-400">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="text-white space-y-12 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage tournaments, agents, and on-chain operations</p>
      </div>

      {/* Action Message */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg flex items-center gap-3 ${
              actionMessage.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}
          >
            {actionMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="ml-auto text-white/50 hover:text-white text-xl">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ TOURNAMENTS SECTION ============ */}
      <section id="tournaments-section">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Tournaments</h2>
            <p className="text-gray-400 text-sm">View and manage all tournaments</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{tournaments?.length || 0} total</span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          {['all', 'upcoming', 'live', 'completed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTournamentFilter(filter as typeof tournamentFilter)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                tournamentFilter === filter
                  ? filter === 'all' ? 'bg-white/10 text-white border border-white/20' :
                    filter === 'live' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    filter === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Tournament Cards */}
        <div className="grid gap-4">
          {filteredTournaments.map((tournament) => {
            const agentCount = tournament.agent_contract_mapping
              ? Object.keys(tournament.agent_contract_mapping).length
              : 0;
            const now = new Date();
            const startDate = new Date(tournament.start_date);
            const endDate = new Date(tournament.end_date);
            const isUpcoming = tournament.status?.toLowerCase() === 'upcoming';
            const isLive = tournament.status?.toLowerCase() === 'live';
            const isCompleted = tournament.status?.toLowerCase() === 'completed';

            // Time display
            let timeDisplay = '';
            if (isUpcoming && startDate > now) {
              timeDisplay = `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`;
            } else if (isLive && endDate > now) {
              timeDisplay = `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`;
            } else if (isCompleted) {
              timeDisplay = `Ended ${formatDistanceToNow(endDate, { addSuffix: true })}`;
            }

            return (
              <div
                key={tournament.id}
                className={`bg-white/5 hover:bg-white/10 border rounded-xl p-5 cursor-pointer transition-all ${
                  selectedTournamentId === tournament.id
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/10'
                }`}
                onClick={() => {
                  setSelectedTournamentId(tournament.id);
                  setSelectedAgentsForOnchain([]);
                  setShowOnchainPanel(true);
                }}
              >
                <div className="flex items-start justify-between">
                  {/* Left: Tournament Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-white">{tournament.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(tournament.status)}`}>
                        {tournament.status}
                      </span>
                      {tournament.contract_tournament_id ? (
                        <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-300 flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> On-chain #{tournament.contract_tournament_id}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-300">
                          Not linked
                        </span>
                      )}
                    </div>

                    {/* Time Status */}
                    {timeDisplay && (
                      <p className={`text-sm mb-2 ${
                        isLive ? 'text-green-400' : isUpcoming ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        {timeDisplay}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(tournament.prize_pool)} prize
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {agentCount} agents
                      </span>
                    </div>
                  </div>

                  {/* Right: Stats */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-400">{formatCurrency(tournament.prize_pool)}</p>
                    <p className="text-xs text-gray-400">Prize Pool</p>
                    {tournament.winner_agent_id && (
                      <div className="mt-2">
                        <p className="text-xs text-green-400 flex items-center justify-end gap-1">
                          <Trophy className="w-3 h-3" /> Winner Selected
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Mapping Info */}
                {tournament.agent_contract_mapping && Object.keys(tournament.agent_contract_mapping).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-2">Mapped Agents ({Object.keys(tournament.agent_contract_mapping).length}):</p>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(tournament.agent_contract_mapping).slice(0, 6).map(([agentId, contractId]) => {
                        const agent = findAgentById(agents, agentId);
                        return (
                          <div key={agentId} className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
                            <img
                              src={getAvatarUrl(agent?.name || agentId)}
                              alt={agent?.name || 'Agent'}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-xs text-white">{agent?.name || agentId.slice(0, 8)}</span>
                            <span className="text-xs text-gray-500">#{contractId}</span>
                          </div>
                        );
                      })}
                      {Object.keys(tournament.agent_contract_mapping).length > 6 && (
                        <span className="text-xs text-gray-500 self-center">
                          +{Object.keys(tournament.agent_contract_mapping).length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredTournaments.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>No tournaments found for this filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* ============ AGENTS SECTION ============ */}
      <section id="agents-section">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Agents</h2>
            <p className="text-gray-400 text-sm">Manage and view all AI trading agents</p>
          </div>
          <span className="text-sm text-gray-400">{agents?.length || 0} total</span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            className="w-full bg-yellow-500/90 backdrop-blur-sm text-slate-900 placeholder:text-slate-700 rounded-xl pl-12 pr-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAgents.map((agent, index) => {
            // Extract stats from the agent's stats JSON field
            const stats = agent.stats as Record<string, number | undefined> || {};
            const totalTournaments = stats.total_tournaments ?? 0;
            const wins = stats.wins ?? 0;
            const winRate = stats.win_rate ?? 0;
            const avgRank = stats.avg_rank ?? 0;
            const totalTrades = stats.total_trades ?? 0;

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/30 transition group"
              >
                {/* Header: Avatar + Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={getAvatarUrl(agent.name)}
                      alt={agent.name}
                      className="w-14 h-14 rounded-full border-2 border-white/20 group-hover:border-cyan-400 transition"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{agent.name}</p>
                    <p className="text-xs text-cyan-400 capitalize">{agent.strategy_type?.replace('_', ' ') || 'Agent'}</p>
                  </div>
                </div>

                {/* Personality */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Personality</p>
                  <p className="text-sm text-gray-300 line-clamp-2">{agent.personality || 'No personality defined'}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Tournaments</p>
                    <p className="text-lg font-bold text-white">{totalTournaments}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Wins</p>
                    <p className="text-lg font-bold text-green-400">{wins}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Win Rate</p>
                    <p className="text-lg font-bold text-yellow-400">{(winRate * 100).toFixed(0)}%</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Avg Rank</p>
                    <p className="text-lg font-bold text-blue-400">{avgRank > 0 ? `#${avgRank.toFixed(1)}` : '-'}</p>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400 flex justify-between">
                  <span>Total Trades: <span className="text-white">{totalTrades}</span></span>
                  <span className="text-gray-500">ID: {agent.id.slice(0, 8)}...</span>
                </div>
              </motion.div>
            );
          })}

          {filteredAgents.length === 0 && (
            <p className="text-gray-400 col-span-full text-center py-8">No agents found</p>
          )}
        </div>
      </section>

      {/* ============ ON-CHAIN ACTIONS PANEL (Slide-in) ============ */}
      <AnimatePresence>
        {showOnchainPanel && selectedTournament && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOnchainPanel(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-slate-900 border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">On-Chain Actions</h2>
                  <button
                    onClick={() => setShowOnchainPanel(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Read-only Tournament Summary */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                  <h3 className="font-bold text-white mb-2">{selectedTournament.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(selectedTournament.status)}`}>
                        {selectedTournament.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Prize Pool:</span>
                      <span className="text-yellow-400">{formatCurrency(selectedTournament.prize_pool)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dates:</span>
                      <span className="text-white text-xs">{formatDate(selectedTournament.start_date)} - {formatDate(selectedTournament.end_date)}</span>
                    </div>
                    {selectedTournament.contract_tournament_id != null && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Contract ID:</span>
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          #{selectedTournament.contract_tournament_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">

                  {/* ===== NOT LINKED: Agent Assignment + Create ===== */}
                  {!selectedTournament.contract_tournament_id && (
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                      <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                        <Link2 className="w-4 h-4" /> Link Tournament On-Chain
                      </h3>

                      {/* Assigned Agents (right side concept) */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2">
                          Assigned Agents ({assignedAgents.length})
                          {assignedAgents.length < 2 && <span className="text-yellow-400 ml-1">- need at least 2</span>}
                        </p>

                        {assignedAgents.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm border border-dashed border-white/10 rounded-lg">
                            No agents assigned yet. Add agents below.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {assignedAgents.map((agent, idx) => (
                              <div
                                key={agent.id}
                                className="flex items-center gap-3 p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg"
                              >
                                <span className="text-xs font-bold text-blue-300 w-6 text-center">
                                  #{idx + 1}
                                </span>
                                <img src={getAvatarUrl(agent.name)} alt={agent.name} className="w-7 h-7 rounded-full" />
                                <span className="text-sm text-white flex-1">{agent.name}</span>
                                <span className="text-xs text-gray-500 capitalize">{agent.strategy_type?.replace('_', ' ')}</span>
                                <button
                                  onClick={() => removeAgent(agent.id)}
                                  className="p-1 hover:bg-red-500/20 rounded transition"
                                  title="Remove agent"
                                >
                                  <X className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Available Agents (left side concept) */}
                      {availableAgents.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-400 mb-2">Available Agents</p>
                          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                            {availableAgents.map(agent => (
                              <div
                                key={agent.id}
                                className="flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 border border-transparent rounded-lg transition"
                              >
                                <img src={getAvatarUrl(agent.name)} alt={agent.name} className="w-7 h-7 rounded-full" />
                                <span className="text-sm text-white flex-1">{agent.name}</span>
                                <span className="text-xs text-gray-500 capitalize">{agent.strategy_type?.replace('_', ' ')}</span>
                                <button
                                  onClick={() => addAgent(agent.id)}
                                  className="p-1 hover:bg-blue-500/20 rounded transition"
                                  title="Add agent"
                                >
                                  <Plus className="w-4 h-4 text-blue-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleCreateOnchain}
                        disabled={anyMutationPending || assignedAgents.length < 2}
                        className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {createOnchain.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                        Create On-Chain ({assignedAgents.length} agents)
                      </button>
                    </div>
                  )}

                  {/* ===== LINKED: Read-only mapping + Lifecycle actions ===== */}
                  {selectedTournament.contract_tournament_id != null && (
                    <>
                      {/* Read-only Agent Mapping */}
                      {selectedTournament.agent_contract_mapping && Object.keys(selectedTournament.agent_contract_mapping).length > 0 && (
                        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                          <h3 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> On-Chain Tournament #{selectedTournament.contract_tournament_id}
                          </h3>
                          <p className="text-xs text-gray-400 mb-2">Agent Mapping (read-only)</p>
                          <div className="space-y-1.5">
                            {Object.entries(selectedTournament.agent_contract_mapping)
                              .sort(([, a], [, b]) => a - b)
                              .map(([agentId, contractId]) => {
                                const agent = findAgentById(agents, agentId);
                                return (
                                  <div key={agentId} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                                    <span className="text-xs font-bold text-green-300 w-6 text-center">#{contractId}</span>
                                    <img
                                      src={getAvatarUrl(agent?.name || agentId)}
                                      alt={agent?.name || 'Agent'}
                                      className="w-7 h-7 rounded-full"
                                    />
                                    <span className="text-sm text-white flex-1">{agent?.name || agentId.slice(0, 8)}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Lifecycle Status Indicator */}
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <p className="text-xs text-gray-400 mb-2">On-Chain Lifecycle</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-400">Linked</span>
                          <span className="text-gray-600">&rarr;</span>
                          <span className={selectedTournament.betting_closed ? 'text-orange-400' : 'text-gray-600'}>
                            {selectedTournament.betting_closed ? 'Betting Closed' : 'Betting Open'}
                          </span>
                          <span className="text-gray-600">&rarr;</span>
                          <span className={selectedTournament.winner_agent_id ? 'text-yellow-400' : 'text-gray-600'}>
                            {selectedTournament.winner_agent_id ? 'Settled' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Start Tournament - only show if linked but not yet live */}
                      {selectedTournament.status?.toLowerCase() === 'upcoming' && (
                        <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30">
                          <h3 className="font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                            <Play className="w-4 h-4" /> Start Tournament
                          </h3>
                          <p className="text-xs text-gray-400 mb-3">Initialize agents and set tournament to live.</p>
                          <button
                            onClick={handleStartTournament}
                            disabled={anyMutationPending}
                            className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {startTournament.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            Start Tournament
                          </button>
                        </div>
                      )}

                      {/* Close Betting - only show if betting is open, not settled, and not cancelled */}
                      {!selectedTournament.betting_closed && !selectedTournament.winner_agent_id && selectedTournament.status?.toLowerCase() !== 'completed' && (
                        <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/30">
                          <h3 className="font-semibold text-orange-300 mb-2 flex items-center gap-2">
                            <XCircle className="w-4 h-4" /> Close Betting
                          </h3>
                          <p className="text-xs text-gray-400 mb-3">Stop accepting new bets.</p>
                          <button
                            onClick={handleCloseBetting}
                            disabled={anyMutationPending}
                            className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {closeBetting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Close Betting
                          </button>
                        </div>
                      )}

                      {/* Settle Tournament - only show after betting closed, not yet settled, and not cancelled */}
                      {selectedTournament.betting_closed && !selectedTournament.winner_agent_id && selectedTournament.status?.toLowerCase() !== 'completed' && (
                        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                          <h3 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                            <Trophy className="w-4 h-4" /> Settle Tournament
                          </h3>
                          <p className="text-xs text-gray-400 mb-3">Select the winning agent:</p>

                          <select
                            value={winnerAgentId}
                            onChange={(e) => setWinnerAgentId(e.target.value)}
                            className="w-full mb-3 p-2 rounded-lg bg-slate-800 border border-white/20 text-white [&>option]:bg-slate-800 [&>option]:text-white"
                          >
                            <option value="">Select winner...</option>
                            {agentStates?.map(state => {
                              const agent = findAgentById(agents, state.agent_id);
                              return (
                                <option key={state.agent_id} value={state.agent_id}>
                                  {agent?.name || state.agent_id} - ${parseFloat(state.portfolio_value_usd).toLocaleString()}
                                </option>
                              );
                            })}
                            {/* Fallback: show mapped agents if no states */}
                            {(!agentStates || agentStates.length === 0) && selectedTournament.agent_contract_mapping &&
                              Object.keys(selectedTournament.agent_contract_mapping).map(agentId => {
                                const agent = findAgentById(agents, agentId);
                                return (
                                  <option key={agentId} value={agentId}>
                                    {agent?.name || agentId.slice(0, 8)}
                                  </option>
                                );
                              })
                            }
                          </select>

                          <button
                            onClick={handleSettleTournament}
                            disabled={anyMutationPending || !winnerAgentId}
                            className="w-full py-2 rounded-lg bg-green-500 hover:bg-green-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {settleTournament.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                            Settle with Winner
                          </button>
                        </div>
                      )}

                      {/* Cancel Tournament - only show if not yet settled and not already cancelled */}
                      {!selectedTournament.winner_agent_id && selectedTournament.status?.toLowerCase() !== 'completed' && (
                        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                          <h3 className="font-semibold text-red-300 mb-2 flex items-center gap-2">
                            <Ban className="w-4 h-4" /> Cancel Tournament
                          </h3>
                          <p className="text-xs text-gray-400 mb-3">Cancel and allow bet refunds.</p>
                          <button
                            onClick={handleCancelTournament}
                            disabled={anyMutationPending}
                            className="w-full py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {cancelTournament.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                            Cancel Tournament
                          </button>
                        </div>
                      )}

                      {/* Settled indicator */}
                      {selectedTournament.winner_agent_id && (
                        <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30 text-center">
                          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                          <p className="text-yellow-300 font-semibold">Tournament Settled</p>
                          <p className="text-xs text-gray-400 mt-1">Winner has been declared and payouts are available.</p>
                        </div>
                      )}

                      {/* Cancelled indicator */}
                      {!selectedTournament.winner_agent_id && selectedTournament.status?.toLowerCase() === 'completed' && (
                        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30 text-center">
                          <Ban className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-red-300 font-semibold">Tournament Cancelled</p>
                          <p className="text-xs text-gray-400 mt-1">This tournament was cancelled. Bets are refundable.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
