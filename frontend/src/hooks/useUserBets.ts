'use client';

import { useMemo } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import { BETTING_CONTRACT_ADDRESS, bettingAbi } from './useBettingContract';

// ============ Types ============

export interface UserBet {
  agentId: number;
  amount: bigint;
  amountEth: string;
}

export interface UserBettingData {
  bets: UserBet[];
  totalExposure: bigint;
  totalExposureEth: string;
  hasClaimed: boolean;
  potentialPayout: bigint;
  potentialPayoutEth: string;
}

// ============ Main Hook ============

/**
 * Optimized hook to fetch user's betting data for a tournament
 * Uses multicall batching for efficient data fetching
 * 
 * @param tournamentId - The tournament ID to get user bets for
 * @returns User's betting data including bets, exposure, claim status, and potential payout
 */
export function useUserBets(tournamentId: number) {
  const { address } = useAccount();
  const tournamentIdBigInt = BigInt(tournamentId);

  // Step 1: Get tournament data to determine agentCount
  const { data: tournamentData, isLoading: loadingTournament } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS,
    abi: bettingAbi,
    functionName: 'tournaments',
    args: [tournamentIdBigInt],
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const agentCount = useMemo(() => {
    if (!tournamentData || !Array.isArray(tournamentData)) return 0;
    return Number(tournamentData[4] as bigint); // agentCount is index 4
  }, [tournamentData]);

  // Step 2: Build multicall for user-specific data
  const userDataContracts = useMemo(() => {
    if (!address || agentCount === 0) return [];

    const contracts = [
      // Add hasClaimed check
      {
        address: BETTING_CONTRACT_ADDRESS,
        abi: bettingAbi,
        functionName: 'hasClaimed',
        args: [tournamentIdBigInt, address],
      },
      // Add calculatePayout
      {
        address: BETTING_CONTRACT_ADDRESS,
        abi: bettingAbi,
        functionName: 'calculatePayout',
        args: [tournamentIdBigInt, address],
      },
    ];

    // Add getUserBetOnAgent for each agent
    for (let i = 1; i <= agentCount; i++) {
      contracts.push({
        address: BETTING_CONTRACT_ADDRESS,
        abi: bettingAbi,
        functionName: 'getUserBetOnAgent',
        args: [tournamentIdBigInt, address, BigInt(i)],
      });
    }

    return contracts;
  }, [tournamentIdBigInt, address, agentCount]);

  // Step 3: Execute multicall - single RPC call for all user data
  const { data: userDataResults, isLoading: loadingUserData } = useReadContracts({
    contracts: userDataContracts,
    query: {
      enabled: !!address && agentCount > 0,
      refetchInterval: 5000,
    },
  });

  // Step 4: Process results
  const userBettingData: UserBettingData | null = useMemo(() => {
    if (!address || !userDataResults || agentCount === 0) return null;

    // Extract hasClaimed and potentialPayout from first 2 results
    const hasClaimed = (userDataResults[0]?.result as boolean) || false;
    const potentialPayout = (userDataResults[1]?.result as bigint) || BigInt(0);

    // Process user bets (starting from index 2)
    const bets: UserBet[] = [];
    let totalExposure = BigInt(0);

    for (let i = 0; i < agentCount; i++) {
      const betAmount = (userDataResults[i + 2]?.result as bigint) || BigInt(0);
      
      if (betAmount > BigInt(0)) {
        bets.push({
          agentId: i + 1,
          amount: betAmount,
          amountEth: formatEther(betAmount),
        });
        totalExposure += betAmount;
      }
    }

    return {
      bets,
      totalExposure,
      totalExposureEth: formatEther(totalExposure),
      hasClaimed,
      potentialPayout,
      potentialPayoutEth: formatEther(potentialPayout),
    };
  }, [address, userDataResults, agentCount]);

  return {
    data: userBettingData,
    loading: loadingTournament || loadingUserData,
    refetch: () => {}, // Can add refetch logic if needed
  };
}

// ============ Helper Hook: Single Agent Bet ============

/**
 * Get user's bet on a specific agent
 * Useful for displaying individual bet amounts
 */
export function useUserBetOnAgent(tournamentId: number, agentId: number) {
  const { address } = useAccount();

  const { data: betAmount, isLoading } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS,
    abi: bettingAbi,
    functionName: 'getUserBetOnAgent',
    args: address ? [BigInt(tournamentId), address, BigInt(agentId)] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  return {
    amount: (betAmount as bigint) || BigInt(0),
    amountEth: formatEther((betAmount as bigint) || BigInt(0)),
    loading: isLoading,
  };
}

// ============ Helper Hook: Claim Status ============

/**
 * Check if user has claimed winnings for a tournament
 */
export function useHasClaimed(tournamentId: number) {
  const { address } = useAccount();

  const { data: claimed, isLoading } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS,
    abi: bettingAbi,
    functionName: 'hasClaimed',
    args: address ? [BigInt(tournamentId), address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  return {
    hasClaimed: (claimed as boolean) || false,
    loading: isLoading,
  };
}

// ============ Helper Hook: Potential Payout ============

/**
 * Calculate user's potential payout for a tournament
 */
export function usePotentialPayout(tournamentId: number) {
  const { address } = useAccount();

  const { data: payout, isLoading } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS,
    abi: bettingAbi,
    functionName: 'calculatePayout',
    args: address ? [BigInt(tournamentId), address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  return {
    payout: (payout as bigint) || BigInt(0),
    payoutEth: formatEther((payout as bigint) || BigInt(0)),
    loading: isLoading,
  };
}