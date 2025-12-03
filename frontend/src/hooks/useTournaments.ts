import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, getAuthHeaders } from "./api";
import {
  Tournament,
  ID,
  CreateTournamentData,
  UpdateTournamentData,
  ApiError,
} from "../types";
import { useAgents } from "./useAgents";
import { AgentState } from "../types";
// public GET
export function useTournaments() {
  return useQuery<Tournament[]>({
    queryKey: ["tournaments"],
    queryFn: async () => {
      console.log('Fetching tournaments from:', `${API_URL}/tournaments/`);
      const res = await fetch(`${API_URL}/tournaments/`);
      console.log('Tournaments response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Tournaments fetch error:', errorText);
        throw new Error(`Failed to fetch tournaments: ${res.status}`);
      }
      const data = await res.json();
      console.log('Tournaments data:', data);
      return data;
    },
  });
}

// other public GET
export function useTournament(tournamentId: ID) {
  return useQuery<Tournament>({
    queryKey: ["tournaments", tournamentId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}/`);
      if (!res.ok) throw new Error("Tournament not found");
      return res.json();
    },
    enabled: !!tournamentId,
  });
}

export function useTournamentAgents(tournamentId: string) {
  const { data: tournament } = useTournament(tournamentId);
  const { data: allAgents } = useAgents();

  if (!tournament || !allAgents) return { data: null, isLoading: true };

  // Map agents with their contract IDs
  const agentsWithContractIds = allAgents
    .filter((agent) => tournament.agent_contract_mapping[agent.id])
    .map((agent) => ({
      ...agent,
      contractId: tournament.agent_contract_mapping[agent.id],
    }));

  return { data: agentsWithContractIds, isLoading: false };
}

export function useAgentContractId(tournamentId: string, agentUuid: string) {
  const { data: tournament } = useTournament(tournamentId);
  return tournament?.agent_contract_mapping[agentUuid] || null;
}
// POST - needs auth
export function useCreateTournament() {
  const queryClient = useQueryClient();

  return useMutation<Tournament, ApiError, CreateTournamentData>({
    mutationFn: async (tournamentData) => {
      const res = await fetch(`${API_URL}/tournaments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(tournamentData),
      });
      if (!res.ok) throw new Error("Failed to create tournament");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

// PUT - needs auth
export function useUpdateTournament() {
  const queryClient = useQueryClient();

  return useMutation<
    Tournament,
    ApiError,
    { tournamentId: ID; data: UpdateTournamentData }
  >({
    mutationFn: async ({ tournamentId, data }) => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update tournament");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

// DELETE - needs auth
export function useDeleteTournament() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, ID>({
    mutationFn: async (tournamentId) => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete tournament");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useTournamentLeaderboard(tournamentId: ID) {
  return useQuery<AgentState[]>({
    queryKey: ["tournaments", tournamentId, "leaderboard"],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/tournaments/${tournamentId}/leaderboard/`,
      );
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    enabled: !!tournamentId,
    refetchInterval: 10000, // Update leaderboard every 10s
  });
}

// Public GET - Agents with State (Rank, Portfolio Value)
// This is better than your current useTournamentAgents client-side filter
// because it returns dynamic data like current profit/loss
export function useTournamentAgentsWithState(tournamentId: ID) {
  return useQuery<AgentState[]>({
    queryKey: ["tournaments", tournamentId, "agents"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}/agents`);
      if (!res.ok) throw new Error("Failed to fetch tournament agents");
      return res.json();
    },
    enabled: !!tournamentId,
  });
}
