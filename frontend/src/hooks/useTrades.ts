import { useQuery } from "@tanstack/react-query";
import { API_URL } from "./api";
import { Trade, ID } from "../types";

// Public - Get global recent trades (for the ticker tape)
// We use refetchInterval to make it "live"
export function useRecentTrades(limit: number = 20) {
  return useQuery<Trade[]>({
    queryKey: ["trades", "recent", limit],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/trades/recent?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch recent trades");
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

// Public - Get trades for a specific tournament
export function useTournamentTrades(tournamentId: ID) {
  return useQuery<Trade[]>({
    queryKey: ["trades", "tournament", tournamentId],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/trades/?tournament_id=${tournamentId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch tournament trades");
      return res.json();
    },
    enabled: !!tournamentId,
  });
}

// Public - Get trades for a specific agent
export function useAgentTrades(agentId: ID) {
  return useQuery<Trade[]>({
    queryKey: ["trades", "agent", agentId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/trades/agent/${agentId}`);
      if (!res.ok) throw new Error("Failed to fetch agent trades");
      return res.json();
    },
    enabled: !!agentId,
  });
}
