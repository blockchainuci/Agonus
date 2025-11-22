'use client';

import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { BETTING_CONTRACT_ADDRESS, bettingAbi } from './useBettingContracts';

const BP_DIVISOR = BigInt(10000); // Basis points divisor
const MAX_AGENTS = 10; // Maximum number of agents to fetch

// ============ Types ============

export interface TournamentData {
  isActive: boolean;
  isSettled: boolean;
  totalPool: bigint;
  winningAgentId: bigint;
  agentCount: bigint;
}

export interface AgentPool {
  agentId: number;
  pool: bigint;
  poolEth: string;
  odds: bigint; // In basis points
  oddsDecimal: number;
  oddsFractional: string;
  oddsAmerican: string;
}

export interface TournamentQueryResult {
  tournament: TournamentData | null;
  agentPools: AgentPool[];
  totalPoolEth: string;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

// ============ Utility Functions ============

/**
 * Convert basis points to decimal odds
 * BP = 10000 means 1:1 odds = 2.0 decimal
 */
function basisPointsToDecimal(bp: bigint): number {
  if (bp === BigInt(0)) return 0;
  return Number(bp) / 10000;
}

/**
 * Convert basis points to fractional odds (e.g., "3/2")
 */
function basisPointsToFractional(bp: bigint): string {
  if (bp === BigInt(0)) return '0/1';
  const decimal = basisPointsToDecimal(bp);
  if (decimal <= 1) return '1/1';
  
  // Convert to fractional (simplified)
  const numerator = decimal - 1;
  const denominator = 1;
  
  // Find common factors (simplified - you might want a better algorithm)
  if (numerator % 0.5 === 0) {
    return `${numerator * 2}/${denominator * 2}`;
  }
  
  return `${numerator.toFixed(2)}/1`;
}

/**
 * Convert basis points to American odds (e.g., "+150", "-200")
 */
function basisPointsToAmerican(bp: bigint): string {
  if (bp === BigInt(0)) return '+0';
  const decimal = basisPointsToDecimal(bp);
  
  if (decimal >= 2) {
    // Positive odds
    const american = (decimal - 1) * 100;
    return `+${Math.round(american)}`;
  } else {
    // Negative odds
    const american = -100 / (decimal - 1);
    return Math.round(american).toString();
  }
}

// ============ Hooks ============

/**
 * Hook to fetch and watch tournament data from the smart contract
 * Similar pattern to useBets() and useAgents() - read-only query hook
 * 
 * @param tournamentId - The tournament ID to fetch data for
 * @returns Tournament data including status, pools, agent pools, and odds
 */
export function useTournament(tournamentId: bigint | number | undefined): TournamentQueryResult {
  const tournamentIdBigInt = useMemo(
    () => (tournamentId !== undefined ? BigInt(tournamentId) : undefined),
    [tournamentId]
  );

  // Fetch tournament data with real-time updates (poll every 5 seconds)
  const { data: tournamentData, isLoading: isLoadingTournament, isError: isErrorTournament, error: tournamentError } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS,
    abi: bettingAbi,
    functionName: 'tournaments',
    args: tournamentIdBigInt !== undefined ? [tournamentIdBigInt] : undefined,
    query: {
      enabled: tournamentIdBigInt !== undefined,
      refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    },
  });

  // Parse tournament data
  const tournament: TournamentData | null = useMemo(() => {
    if (!tournamentData || !Array.isArray(tournamentData)) return null;
    
    return {
      isActive: tournamentData[0] as boolean,
      isSettled: tournamentData[1] as boolean,
      totalPool: tournamentData[2] as bigint,
      winningAgentId: tournamentData[3] as bigint,
      agentCount: tournamentData[4] as bigint,
    };
  }, [tournamentData]);

  const agentCount = tournament?.agentCount ? Number(tournament.agentCount) : 0;

  // Fetch agent pools and odds for all agents
  // Hooks must be called unconditionally, so we fetch for a fixed range
  const agentPoolsQueries = Array.from({ length: MAX_AGENTS }, (_, i) => {
    const agentId = i + 1;
    const isEnabled = tournamentIdBigInt !== undefined && agentId <= agentCount;
    
    return {
      agentId,
      pool: useReadContract({
        address: BETTING_CONTRACT_ADDRESS,
        abi: bettingAbi,
        functionName: 'agentPools',
        args: tournamentIdBigInt !== undefined ? [tournamentIdBigInt, BigInt(agentId)] : undefined,
        query: {
          enabled: isEnabled,
          refetchInterval: 5000, // Poll every 5 seconds
        },
      }),
      odds: useReadContract({
        address: BETTING_CONTRACT_ADDRESS,
        abi: bettingAbi,
        functionName: 'getAgentOdds',
        args: tournamentIdBigInt !== undefined ? [tournamentIdBigInt, BigInt(agentId)] : undefined,
        query: {
          enabled: isEnabled,
          refetchInterval: 5000, // Poll every 5 seconds
        },
      }),
    };
  });

  // Process agent pools and odds
  const agentPools: AgentPool[] = useMemo(() => {
    if (!tournament) return [];

    return agentPoolsQueries
      .filter((_, i) => i < agentCount)
      .map(({ agentId, pool, odds }) => {
        const poolValue = (pool.data as bigint) || BigInt(0);
        const oddsValue = (odds.data as bigint) || BigInt(0);

        return {
          agentId,
          pool: poolValue,
          poolEth: formatEther(poolValue),
          odds: oddsValue,
          oddsDecimal: basisPointsToDecimal(oddsValue),
          oddsFractional: basisPointsToFractional(oddsValue),
          oddsAmerican: basisPointsToAmerican(oddsValue),
        };
      });
  }, [tournament, agentPoolsQueries, agentCount]);

  const totalPoolEth = useMemo(
    () => (tournament?.totalPool ? formatEther(tournament.totalPool) : '0'),
    [tournament]
  );

  // Aggregate loading and error states
  const isLoading = isLoadingTournament || agentPoolsQueries.some((q) => q.pool.isLoading || q.odds.isLoading);
  const isError = isErrorTournament || agentPoolsQueries.some((q) => q.pool.isError || q.odds.isError);
  const error = tournamentError || agentPoolsQueries.find((q) => q.pool.error || q.odds.error)?.pool.error || agentPoolsQueries.find((q) => q.odds.error)?.odds.error || null;

  return {
    tournament,
    agentPools,
    totalPoolEth,
    isLoading,
    isError,
    error: error as Error | null,
  };
}

