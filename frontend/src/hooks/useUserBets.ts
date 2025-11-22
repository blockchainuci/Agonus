'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { BETTING_CONTRACT_ADDRESS, bettingAbi } from './useBettingContracts';

const MAX_AGENTS = 10; // Maximum number of agents to fetch

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

// ============ Hooks ============

/**
 * Hook to get user's bets for a tournament from the smart contract
 * Similar pattern to useBets() and useAgents() - read-only query hook
 * 
 * @param tournamentId - The tournament ID to get bets for
 * @returns User's betting data including all agent bets, total exposure, claim status, and potential payout
 */
export function useUserBets(tournamentId: bigint | number | undefined) {
  const { address } = useAccount();
  const tournamentIdBigInt = useMemo(
    () => (tournamentId !== undefined ? BigInt(tournamentId) : undefined),
    [tournamentId]
  );

  // Get tournament data to know how many agents there are
  const { 
    data: tournamentData, 
    isLoading: isLoadingTournament, 
    isError: isErrorTournament, 
    error: tournamentError 
  } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS,
    abi: bettingAbi,
    functionName: 'tournaments',
    args: tournamentIdBigInt !== undefined ? [tournamentIdBigInt] : undefined,
    query: {
      enabled: tournamentIdBigInt !== undefined && !!address,
      refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    },
  });

  const agentCount = useMemo(() => {
    if (!tournamentData || !Array.isArray(tournamentData)) return 0;
    return Number(tournamentData[4] as bigint); // agentCount is the 5th element (index 4)
  }, [tournamentData]);

  // Check if user has claimed winnings
  const { 
    data: hasClaimed, 
    isLoading: isLoadingHasClaimed, 
    isError: isErrorHasClaimed, 
    error: hasClaimedError 
  } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS,
    abi: bettingAbi,
    functionName: 'hasClaimed',
    args: tournamentIdBigInt !== undefined && address ? [tournamentIdBigInt, address] : undefined,
    query: {
      enabled: tournamentIdBigInt !== undefined && !!address,
      refetchInterval: 5000, // Poll every 5 seconds
    },
  });

  // Get potential payout
  const { 
    data: potentialPayout, 
    isLoading: isLoadingPayout, 
    isError: isErrorPayout, 
    error: payoutError 
  } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS,
    abi: bettingAbi,
    functionName: 'calculatePayout',
    args: tournamentIdBigInt !== undefined && address ? [tournamentIdBigInt, address] : undefined,
    query: {
      enabled: tournamentIdBigInt !== undefined && !!address,
      refetchInterval: 5000, // Poll every 5 seconds
    },
  });

  // Fetch user's bet amount for each agent
  const userBetsQueries = Array.from({ length: MAX_AGENTS }, (_, i) => {
    const agentId = i + 1;
    const isEnabled = tournamentIdBigInt !== undefined && !!address && agentId <= agentCount;

    return {
      agentId,
      bet: useReadContract({
        address: BETTING_CONTRACT_ADDRESS,
        abi: bettingAbi,
        functionName: 'getUserBetOnAgent',
        args:
          isEnabled && address
            ? [tournamentIdBigInt!, address, BigInt(agentId)]
            : undefined,
        query: {
          enabled: isEnabled,
          refetchInterval: 5000,
        },
      }),
    };
  });

  // Process user bets data
  const userBettingData: UserBettingData | null = useMemo(() => {
    if (!tournamentIdBigInt || !address || agentCount === 0) return null;

    const bets: UserBet[] = [];
    let totalExposure = BigInt(0);

    // Collect all non-zero bets
    for (let i = 0; i < agentCount && i < MAX_AGENTS; i++) {
      const { agentId, bet } = userBetsQueries[i];
      const betAmount = (bet.data as bigint) || BigInt(0);

      if (betAmount > 0) {
        bets.push({
          agentId,
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
      hasClaimed: (hasClaimed as boolean) || false,
      potentialPayout: (potentialPayout as bigint) || BigInt(0),
      potentialPayoutEth: potentialPayout
        ? formatEther(potentialPayout as bigint)
        : '0',
    };
  }, [tournamentIdBigInt, address, agentCount, userBetsQueries, hasClaimed, potentialPayout]);

  // Aggregate loading and error states from all queries
  const isLoading = 
    isLoadingTournament || 
    isLoadingHasClaimed || 
    isLoadingPayout || 
    userBetsQueries.some((q) => q.bet.isLoading);
  
  const isError = 
    isErrorTournament || 
    isErrorHasClaimed || 
    isErrorPayout || 
    userBetsQueries.some((q) => q.bet.isError);
  
  const error = 
    tournamentError || 
    hasClaimedError || 
    payoutError || 
    userBetsQueries.find((q) => q.bet.error)?.bet.error || 
    null;

  return {
    data: userBettingData,
    isLoading,
    isError,
    error: error as Error | null,
  };
}
