import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/src/lib/api/client';

export interface BettingPool {
  agent_id: string;
  agent_name: string;
  total_eth: string;
}

export function useBettingPools(tournamentId: string) {
  return useQuery<BettingPool[]>({
    queryKey: ['bettingPools', tournamentId],
    queryFn: () => apiFetch<BettingPool[]>(`/bets/pools/${tournamentId}`),
    enabled: !!tournamentId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
