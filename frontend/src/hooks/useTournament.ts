'use client';

import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import { BETTING_CONTRACT_ADDRESS, bettingAbi } from './useBettingContract';

// ============ Constants ============
const BP_DIVISOR = 10000;

// ============ Types ============

export interface Tournament {
  isActive: boolean;
  isSettled: boolean;
  totalPool: bigint;
  totalPoolEth: string;
  winningAgentId: number;
  agentCount: number;
}

export interface AgentData {
  agentId: number;
  pool: bigint;
  poolEth: string;
  odds: number; // Decimal odds (e.g., 2.5)
  oddsFractional: string; // e.g., "3/2"
  oddsAmerican: string; // e.g., "+150"
}

// ============ Odds Conversion Utilities ============

function bpToDecimal(bp: bigint): number {
  return bp === BigInt(0) ? 0 : Number(bp) / BP_DIVISOR;
}

function bpToFractional(bp: bigint): string {
  if (bp === BigInt(0)) return '0/1';
  const decimal = bpToDecimal(bp);
  if (decimal <= 1) return '1/1';
  
  const profit = decimal - 1;
  // Simple fractional representation
  if (profit % 0.5 === 0) {
    return `${profit * 2}/2`;
  }
  return `${profit.toFixed(2)}/1`;
}

function bpToAmerican(bp: bigint): string {
  if (bp === BigInt(0)) return '+0';
  const decimal = bpToDecimal(bp);
  
  if (decimal >= 2) {
    return `+${Math.round((decimal - 1) * 100)}`;
  }
  return `${Math.round(-100 / (decimal - 1))}`;
}

// ============ Main Hook ============

/**
 * Optimized hook to fetch tournament data with batched contract calls
 * Uses useReadContracts for efficient multicall batching
 */
export function useTournament(tournamentId: number) {
  const tournamentIdBigInt = BigInt(tournamentId);

  // Step 1: Fetch tournament base data first to get agentCount
  const { 
    data: tournamentData, 
    isLoading: loadingTournament,
    refetch: refetchTournament 
  } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS,
    abi: bettingAbi,
    functionName: 'tournaments',
    args: [tournamentIdBigInt],
    query: {
      refetchInterval: 5000, // Real-time updates
    },
  });

  // Parse tournament data
  const tournament: Tournament | null = useMemo(() => {
    if (!tournamentData || !Array.isArray(tournamentData)) return null;
    
    return {
      isActive: tournamentData[0] as boolean,
      isSettled: tournamentData[1] as boolean,
      totalPool: tournamentData[2] as bigint,
      totalPoolEth: formatEther(tournamentData[2] as bigint),
      winningAgentId: Number(tournamentData[3]),
      agentCount: Number(tournamentData[4]),
    };
  }, [tournamentData]);

  const agentCount = tournament?.agentCount || 0;

  // Step 2: Build multicall contract array for all agents
  // This batches all agent pool + odds calls into a SINGLE RPC request
  const agentContracts = useMemo(() => {
    if (agentCount === 0) return [];

    const contracts = [];
    for (let i = 1; i <= agentCount; i++) {
      const agentIdBigInt = BigInt(i);
      
      // Add pool query
      contracts.push({
        address: BETTING_CONTRACT_ADDRESS,
        abi: bettingAbi,
        functionName: 'agentPools',
        args: [tournamentIdBigInt, agentIdBigInt],
      });
      
      // Add odds query
      contracts.push({
        address: BETTING_CONTRACT_ADDRESS,
        abi: bettingAbi,
        functionName: 'getAgentOdds',
        args: [tournamentIdBigInt, agentIdBigInt],
      });
    }
    
    return contracts;
  }, [tournamentIdBigInt, agentCount]);

  // Execute multicall - this is MUCH more efficient than individual calls
  const { data: agentResults, isLoading: loadingAgents } = useReadContracts({
    contracts: agentContracts,
    query: {
      enabled: agentCount > 0,
      refetchInterval: 5000,
    },
  });

  // Step 3: Process batched results into agent data
  const agents: AgentData[] = useMemo(() => {
    if (!agentResults || agentCount === 0) return [];

    const processedAgents: AgentData[] = [];
    
    // Results come back as [pool1, odds1, pool2, odds2, ...]
    for (let i = 0; i < agentCount; i++) {
      const poolIndex = i * 2;
      const oddsIndex = i * 2 + 1;
      
      const pool = (agentResults[poolIndex]?.result as bigint) || BigInt(0);
      const oddsBp = (agentResults[oddsIndex]?.result as bigint) || BigInt(0);

      processedAgents.push({
        agentId: i + 1,
        pool,
        poolEth: formatEther(pool),
        odds: bpToDecimal(oddsBp),
        oddsFractional: bpToFractional(oddsBp),
        oddsAmerican: bpToAmerican(oddsBp),
      });
    }

    return processedAgents;
  }, [agentResults, agentCount]);

  return {
    tournament,
    agents,
    loading: loadingTournament || loadingAgents,
    refetch: refetchTournament,
  };
}

// ============ Helper Hook for Single Agent ============

/**
 * Lightweight hook for fetching a single agent's odds
 * Useful in bet placement forms where you only need one agent
 */
export function useAgentOdds(tournamentId: number, agentId: number) {
  const { data: oddsBp, isLoading } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS,
    abi: bettingAbi,
    functionName: 'getAgentOdds',
    args: [BigInt(tournamentId), BigInt(agentId)],
    query: {
      refetchInterval: 5000,
    },
  });

  const odds = useMemo(() => {
    const bp = (oddsBp as bigint) || BigInt(0);
    return {
      decimal: bpToDecimal(bp),
      fractional: bpToFractional(bp),
      american: bpToAmerican(bp),
      bp,
    };
  }, [oddsBp]);

  return { odds, loading: isLoading };
}

// ============ Helper Hook for Agent Pool ============

/**
 * Get just the pool amount for a specific agent
 * Useful for displaying pool distribution
 */
export function useAgentPool(tournamentId: number, agentId: number) {
  const { data: pool, isLoading } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS,
    abi: bettingAbi,
    functionName: 'agentPools',
    args: [BigInt(tournamentId), BigInt(agentId)],
    query: {
      refetchInterval: 5000,
    },
  });

  return {
    pool: (pool as bigint) || BigInt(0),
    poolEth: formatEther((pool as bigint) || BigInt(0)),
    loading: isLoading,
  };
}
