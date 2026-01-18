import { useQuery } from "@tanstack/react-query";
import { API_URL } from "./api";
import { AgentState, ID } from "../types";

/**
 * Fetch all agent states for a tournament with their current performance
 * This includes rank, portfolio value, and trade count
 */
export function useTournamentAgentStates(tournamentId: ID) {
  return useQuery<AgentState[]>({
    queryKey: ["tournaments", tournamentId, "agent-states"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}/agents`);
      if (!res.ok) throw new Error("Failed to fetch tournament agent states");
      return res.json();
    },
    enabled: !!tournamentId,
    refetchInterval: 5000, // Update every 5 seconds for live data
  });
}

/**
 * Fetch leaderboard for a tournament (agents sorted by portfolio value)
 */
export function useTournamentLeaderboard(tournamentId: ID) {
  return useQuery<AgentState[]>({
    queryKey: ["tournaments", tournamentId, "leaderboard"],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/tournaments/${tournamentId}/leaderboard`,
      );
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    enabled: !!tournamentId,
    refetchInterval: 10000, // Update every 10 seconds
  });
}
