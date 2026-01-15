import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, getAuthHeaders } from "./api";
import {
  Bet,
  ID,
  CreateBetData,
  UpdateBetData,
  UserBetsSummary,
  ApiError,
} from "../types";

// public GET - get all bets - no auth
export function useBets() {
  return useQuery<Bet[]>({
    queryKey: ["bets"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/bets`);
      if (!res.ok) throw new Error("Failed to fetch bets");
      return res.json();
    },
  });
}

// public GET - get single bet - no auth
export function useBet(betId: ID) {
  return useQuery<Bet>({
    queryKey: ["bets", betId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/bets/${betId}`);
      if (!res.ok) throw new Error("Bet not found");
      return res.json();
    },
    enabled: !!betId,
  });
}

// POST - needs auth
export function useCreateBet() {
  const queryClient = useQueryClient();

  return useMutation<Bet, ApiError, CreateBetData>({
    mutationFn: async (betData) => {
      const res = await fetch(`${API_URL}/bets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(betData),
      });
      if (!res.ok) throw new Error("Failed to create bet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bets"] });
    },
  });
}

//  PUT - needs auth
export function useUpdateBet() {
  const queryClient = useQueryClient();

  return useMutation<Bet, Error, { betId: ID; data: UpdateBetData }>({
    mutationFn: async ({ betId, data }) => {
      const res = await fetch(`${API_URL}/bets/${betId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update bet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bets"] });
    },
  });
}

//  DELETE - needs auth
export function useDeleteBet() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, ID>({
    mutationFn: async (betId) => {
      const res = await fetch(`${API_URL}/bets/${betId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete bet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bets"] });
    },
  });
}

// Private GET - Needs Auth
export function useMyBets() {
  return useQuery<Bet[]>({
    queryKey: ["bets", "my-bets"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/bets/my-bets`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch your bets");
      return res.json();
    },
    // Don't run this query if there is no token in localStorage
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });
}

