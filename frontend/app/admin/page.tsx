"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { mockAgents, mockTournaments, getAgentStatesByTournament, getTradesByTournament } from "@/lib/mock/adminMockData";
import AgentCircleRoster from "@/app/components/admin/agents/AgentCircleRoster";
import TournamentFilteredList from "@/app/components/admin/tournaments/TournamentFilteredList";
import TournamentModal from "@/app/components/admin/tournaments/TournamentModal";
import { TournamentWithMetrics } from "@/types/admin";

export default function AdminDashboard() {
  const [selectedTournament, setSelectedTournament] = useState<TournamentWithMetrics | null>(null);
  const [agentSearch, setAgentSearch] = useState("");

  // Filter agents by search
  const filteredAgents = mockAgents.filter(agent =>
    agent.name.toLowerCase().includes(agentSearch.toLowerCase())
  );

  // Get data for selected tournament
  const tournamentAgentStates = selectedTournament
    ? getAgentStatesByTournament(selectedTournament.id)
    : [];
  const tournamentTrades = selectedTournament
    ? getTradesByTournament(selectedTournament.id)
    : [];

  return (
    <div className="text-white space-y-16">
      {/* Agents Section */}
      <section id="agents-section" className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Agents</h2>
          <p className="text-gray-400">Manage and view all AI trading agents</p>
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

        {/* Agent Circle Roster */}
        <AgentCircleRoster agents={filteredAgents} />
      </section>

      {/* Tournaments Section */}
      <section id="tournaments-section" className="scroll-mt-8 pb-12">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Tournaments</h2>
          <p className="text-gray-400">View and manage all tournaments</p>
        </div>

        {/* Tournament Filtered List */}
        <TournamentFilteredList
          tournaments={mockTournaments}
          onSelectTournament={setSelectedTournament}
        />
      </section>

      {/* Tournament Modal */}
      <TournamentModal
        tournament={selectedTournament!}
        agentStates={tournamentAgentStates}
        trades={tournamentTrades}
        isOpen={!!selectedTournament}
        onClose={() => setSelectedTournament(null)}
      />
    </div>
  );
}
