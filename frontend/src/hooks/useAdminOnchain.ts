import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, getAuthHeaders } from './api';

// Types for on-chain operations
interface OnchainCreatePayload {
  agent_ids: string[];
}

interface OnchainSettlePayload {
  winner_agent_id: string;
}

interface OnchainResult {
  tx_hash: string;
  contract_tournament_id?: number;
}

/**
 * Create tournament on-chain and link to DB
 */
export function useCreateOnchainTournament() {
  const queryClient = useQueryClient();

  return useMutation<OnchainResult, Error, { tournamentId: string; agentIds: string[] }>({
    mutationFn: async ({ tournamentId, agentIds }) => {
      const payload: OnchainCreatePayload = { agent_ids: agentIds };

      const res = await fetch(`${API_URL}/tournaments/${tournamentId}/onchain/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to create on-chain tournament' }));
        throw new Error(error.detail || 'Failed to create on-chain tournament');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

/**
 * Close betting on-chain
 */
export function useCloseBettingOnchain() {
  const queryClient = useQueryClient();

  return useMutation<OnchainResult, Error, string>({
    mutationFn: async (tournamentId) => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}/onchain/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to close betting' }));
        throw new Error(error.detail || 'Failed to close betting');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

/**
 * Settle tournament on-chain with winner
 */
export function useSettleTournamentOnchain() {
  const queryClient = useQueryClient();

  return useMutation<OnchainResult, Error, { tournamentId: string; winnerAgentId: string }>({
    mutationFn: async ({ tournamentId, winnerAgentId }) => {
      const payload: OnchainSettlePayload = { winner_agent_id: winnerAgentId };

      const res = await fetch(`${API_URL}/tournaments/${tournamentId}/onchain/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to settle tournament' }));
        throw new Error(error.detail || 'Failed to settle tournament');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

/**
 * Cancel tournament on-chain
 */
export function useCancelTournamentOnchain() {
  const queryClient = useQueryClient();

  return useMutation<OnchainResult, Error, string>({
    mutationFn: async (tournamentId) => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}/onchain/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to cancel tournament' }));
        throw new Error(error.detail || 'Failed to cancel tournament');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}
