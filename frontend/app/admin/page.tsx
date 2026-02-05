"use client";

import { useState } from "react";
import { Search, Link2, XCircle, Trophy, Ban, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useTournaments } from "@/src/hooks/useTournaments";
import { useAgents } from "@/src/hooks/useAgents";
import { useTournamentAgentStates } from "@/src/hooks/useAgentStates";
import {
  useCreateOnchainTournament,
  useCloseBettingOnchain,
  useSettleTournamentOnchain,
  useCancelTournamentOnchain,
} from "@/src/hooks/useAdminOnchain";

export default function AdminDashboard() {
  const [agentSearch, setAgentSearch] = useState("");
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectedAgentsForOnchain, setSelectedAgentsForOnchain] = useState<string[]>([]);
  const [winnerAgentId, setWinnerAgentId] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Real API data
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: agentStates } = useTournamentAgentStates(selectedTournamentId || "");

  // On-chain mutations
  const createOnchain = useCreateOnchainTournament();
  const closeBetting = useCloseBettingOnchain();
  const settleTournament = useSettleTournamentOnchain();
  const cancelTournament = useCancelTournamentOnchain();

  const isLoading = tournamentsLoading || agentsLoading;

  // Filter agents by search
  const filteredAgents = agents?.filter(agent =>
    agent.name.toLowerCase().includes(agentSearch.toLowerCase())
  ) || [];

  const selectedTournament = tournaments?.find(t => t.id === selectedTournamentId);

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
      setActionMessage({ type: 'error', text: (err as Error).message });
    }
  };

  // Handle close betting
  const handleCloseBetting = async () => {
    if (!selectedTournamentId) return;

    try {
      const result = await closeBetting.mutateAsync(selectedTournamentId);
      setActionMessage({ type: 'success', text: `Betting closed! TX: ${result.tx_hash.slice(0, 10)}...` });
    } catch (err) {
      setActionMessage({ type: 'error', text: (err as Error).message });
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
      setActionMessage({ type: 'error', text: (err as Error).message });
    }
  };

  // Handle cancel tournament
  const handleCancelTournament = async () => {
    if (!selectedTournamentId) return;

    if (!confirm("Are you sure you want to cancel this tournament? All bets will be refundable.")) {
      return;
    }

    try {
      const result = await cancelTournament.mutateAsync(selectedTournamentId);
      setActionMessage({ type: 'success', text: `Tournament cancelled! TX: ${result.tx_hash.slice(0, 10)}...` });
    } catch (err) {
      setActionMessage({ type: 'error', text: (err as Error).message });
    }
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgentsForOnchain(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const anyMutationPending = createOnchain.isPending || closeBetting.isPending || settleTournament.isPending || cancelTournament.isPending;

  return (
    <div className="text-white space-y-8 p-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Action Message */}
      {actionMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          actionMessage.type === 'success'
            ? 'bg-green-500/20 border border-green-500/30 text-green-300'
            : 'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="ml-auto text-white/50 hover:text-white">×</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="ml-3 text-gray-400">Loading data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tournaments Section */}
          <section className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4">Tournaments ({tournaments?.length || 0})</h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {tournaments?.map(tournament => (
                <div
                  key={tournament.id}
                  onClick={() => setSelectedTournamentId(tournament.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedTournamentId === tournament.id
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{tournament.name}</p>
                      <p className="text-xs text-gray-400">
                        Prize: ${Number(tournament.prize_pool).toLocaleString()} • Status: {tournament.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {tournament.contract_tournament_id ? (
                        <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-300 flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> On-chain #{tournament.contract_tournament_id}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-300">
                          Not linked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(!tournaments || tournaments.length === 0) && (
                <p className="text-gray-400 text-center py-8">No tournaments found</p>
              )}
            </div>
          </section>

          {/* On-Chain Actions Section */}
          <section className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4">On-Chain Actions</h2>

            {!selectedTournamentId ? (
              <p className="text-gray-400 text-center py-8">Select a tournament to manage</p>
            ) : (
              <div className="space-y-6">
                {/* Tournament Info */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-gray-400">Selected Tournament</p>
                  <p className="font-bold text-white">{selectedTournament?.name}</p>
                  <p className="text-xs text-gray-500">ID: {selectedTournamentId.slice(0, 8)}...</p>
                  {selectedTournament?.contract_tournament_id && (
                    <p className="text-xs text-green-400 mt-1">
                      Contract ID: {selectedTournament.contract_tournament_id}
                    </p>
                  )}
                </div>

                {/* Action 1: Create On-Chain (if not linked) */}
                {!selectedTournament?.contract_tournament_id && (
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                    <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                      <Link2 className="w-4 h-4" /> Link Tournament On-Chain
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">Select agents to include in the on-chain tournament:</p>

                    {/* Agent Selection */}
                    <div className="space-y-2 max-h-[200px] overflow-y-auto mb-4">
                      {agents?.map(agent => (
                        <label
                          key={agent.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                            selectedAgentsForOnchain.includes(agent.id)
                              ? 'bg-blue-500/20'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAgentsForOnchain.includes(agent.id)}
                            onChange={() => toggleAgentSelection(agent.id)}
                            className="rounded border-gray-500"
                          />
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agent.name)}`}
                            alt={agent.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-sm text-white">{agent.name}</span>
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={handleCreateOnchain}
                      disabled={anyMutationPending || selectedAgentsForOnchain.length < 2}
                      className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {createOnchain.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      Create On-Chain ({selectedAgentsForOnchain.length} agents)
                    </button>
                  </div>
                )}

                {/* Actions for linked tournaments */}
                {selectedTournament?.contract_tournament_id && (
                  <>
                    {/* Action 2: Close Betting */}
                    <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/30">
                      <h3 className="font-semibold text-orange-300 mb-2 flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> Close Betting
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">Stop accepting new bets for this tournament.</p>
                      <button
                        onClick={handleCloseBetting}
                        disabled={anyMutationPending}
                        className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {closeBetting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Close Betting
                      </button>
                    </div>

                    {/* Action 3: Settle Tournament */}
                    <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                      <h3 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                        <Trophy className="w-4 h-4" /> Settle Tournament
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">Select the winning agent:</p>

                      <select
                        value={winnerAgentId}
                        onChange={(e) => setWinnerAgentId(e.target.value)}
                        className="w-full mb-3 p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                      >
                        <option value="">Select winner...</option>
                        {agentStates?.map(state => {
                          const agent = agents?.find(a => a.id === state.agent_id);
                          return (
                            <option key={state.agent_id} value={state.agent_id}>
                              {agent?.name || state.agent_id} - ${parseFloat(state.portfolio_value_usd).toLocaleString()}
                            </option>
                          );
                        })}
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

                    {/* Action 4: Cancel Tournament */}
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
                  </>
                )}
              </div>
            )}
          </section>

          {/* Agents Section */}
          <section className="bg-white/5 rounded-2xl border border-white/10 p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Agents ({agents?.length || 0})</h2>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                className="w-full bg-white/10 text-white placeholder:text-gray-500 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Agent Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredAgents.map(agent => (
                <div
                  key={agent.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition text-center"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agent.name)}`}
                    alt={agent.name}
                    className="w-16 h-16 rounded-full mx-auto mb-3"
                  />
                  <p className="font-semibold text-white text-sm truncate">{agent.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{agent.type?.replace('_', ' ')}</p>
                  <p className="text-xs text-cyan-400 mt-1">${agent.total_value?.toLocaleString() || 0}</p>
                </div>
              ))}

              {filteredAgents.length === 0 && (
                <p className="text-gray-400 col-span-full text-center py-8">No agents found</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
