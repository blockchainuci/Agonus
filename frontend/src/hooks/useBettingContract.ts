'use client';

import type { Abi } from 'viem';
import { useEffect } from 'react';
import { parseEther } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import artifact from '../../../contracts/artifacts/contracts/AgonusBetting.sol/AgonusBetting.json';

// ============ Contract Configuration ============

const FALLBACK_CONTRACT = '0x0000000000000000000000000000000000000000';

export const BETTING_CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS || 
  '0xae68389ad16de18c1cd4ee16c7293cd63d460f0f'
) as `0x${string}`;

export const bettingAbi = artifact.abi as Abi;

export const wagmiContractConfig = {
  address: BETTING_CONTRACT_ADDRESS,
  abi: bettingAbi,
} as const;

// ============ Constants ============

export const MIN_BET = '0.001'; // 0.001 ETH minimum bet
export const MIN_AGENTS = 2;
export const MAX_AGENTS = 10;

// ============ Types ============

export interface TransactionState {
  hash?: `0x${string}`;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
}

export interface PlaceBetParams {
  tournamentId: number;
  agentId: number;
  amountEth: string;
}

// ============ Write Hooks ============

/**
 * Hook to place a bet on an agent in a tournament
 * 
 * @example
 * const placeBet = usePlaceBet();
 * 
 * placeBet.mutate({
 *   tournamentId: 1,
 *   agentId: 3,
 *   amountEth: "0.5"
 * });
 */
export function usePlaceBet() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Invalidate queries on success
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      queryClient.invalidateQueries({ queryKey: ['userBets'] });
      queryClient.invalidateQueries({ queryKey: ['agentPools'] });
    }
  }, [isSuccess, queryClient]);

  const mutate = (params: PlaceBetParams) => {
    if (!BETTING_CONTRACT_ADDRESS || BETTING_CONTRACT_ADDRESS === FALLBACK_CONTRACT) {
      throw new Error('Betting contract address not configured');
    }

    // Validate bet amount
    const betAmount = parseFloat(params.amountEth);
    if (isNaN(betAmount) || betAmount < parseFloat(MIN_BET)) {
      throw new Error(`Minimum bet is ${MIN_BET} ETH`);
    }

    writeContract({
      address: BETTING_CONTRACT_ADDRESS,
      abi: bettingAbi,
      functionName: 'placeBet',
      args: [BigInt(params.tournamentId), BigInt(params.agentId)],
      value: parseEther(params.amountEth),
    });
  };

  return {
    mutate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset: () => {}, // wagmi handles reset internally
  };
}

/**
 * Hook to claim winnings for a settled tournament
 * 
 * @example
 * const claimWinnings = useClaimWinnings();
 * claimWinnings.mutate(1); // Claim for tournament 1
 */
export function useClaimWinnings() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      queryClient.invalidateQueries({ queryKey: ['userBets'] });
    }
  }, [isSuccess, queryClient]);

  const mutate = (tournamentId: number) => {
    if (!BETTING_CONTRACT_ADDRESS || BETTING_CONTRACT_ADDRESS === FALLBACK_CONTRACT) {
      throw new Error('Betting contract address not configured');
    }

    writeContract({
      address: BETTING_CONTRACT_ADDRESS,
      abi: bettingAbi,
      functionName: 'claimWinnings',
      args: [BigInt(tournamentId)],
    });
  };

  return {
    mutate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to create a new tournament (admin/owner only)
 * 
 * @example
 * const createTournament = useCreateTournament();
 * createTournament.mutate(8); // Create tournament with 8 agents
 */
export function useCreateTournament() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
    }
  }, [isSuccess, queryClient]);

  const mutate = (agentCount: number) => {
    if (!BETTING_CONTRACT_ADDRESS || BETTING_CONTRACT_ADDRESS === FALLBACK_CONTRACT) {
      throw new Error('Betting contract address not configured');
    }

    if (agentCount < MIN_AGENTS || agentCount > MAX_AGENTS) {
      throw new Error(`Agent count must be between ${MIN_AGENTS} and ${MAX_AGENTS}`);
    }

    writeContract({
      address: BETTING_CONTRACT_ADDRESS,
      abi: bettingAbi,
      functionName: 'createTournament',
      args: [BigInt(agentCount)],
    });
  };

  return {
    mutate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to close betting for a tournament (admin/owner only)
 * 
 * @example
 * const closeBetting = useCloseBetting();
 * closeBetting.mutate(1); // Close betting for tournament 1
 */
export function useCloseBetting() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
    }
  }, [isSuccess, queryClient]);

  const mutate = (tournamentId: number) => {
    if (!BETTING_CONTRACT_ADDRESS || BETTING_CONTRACT_ADDRESS === FALLBACK_CONTRACT) {
      throw new Error('Betting contract address not configured');
    }

    writeContract({
      address: BETTING_CONTRACT_ADDRESS,
      abi: bettingAbi,
      functionName: 'closeBetting',
      args: [BigInt(tournamentId)],
    });
  };

  return {
    mutate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to settle a tournament with a winning agent (admin/owner only)
 * 
 * @example
 * const settleTournament = useSettleTournament();
 * settleTournament.mutate({ tournamentId: 1, winningAgentId: 3 });
 */
export function useSettleTournament() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      queryClient.invalidateQueries({ queryKey: ['userBets'] });
    }
  }, [isSuccess, queryClient]);

  const mutate = (params: { tournamentId: number; winningAgentId: number }) => {
    if (!BETTING_CONTRACT_ADDRESS || BETTING_CONTRACT_ADDRESS === FALLBACK_CONTRACT) {
      throw new Error('Betting contract address not configured');
    }

    writeContract({
      address: BETTING_CONTRACT_ADDRESS,
      abi: bettingAbi,
      functionName: 'settleTournament',
      args: [BigInt(params.tournamentId), BigInt(params.winningAgentId)],
    });
  };

  return {
    mutate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to cancel a tournament (admin/owner only)
 * Refunds all bets to users
 * 
 * @example
 * const cancelTournament = useCancelTournament();
 * cancelTournament.mutate(1);
 */
export function useCancelTournament() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      queryClient.invalidateQueries({ queryKey: ['userBets'] });
    }
  }, [isSuccess, queryClient]);

  const mutate = (tournamentId: number) => {
    if (!BETTING_CONTRACT_ADDRESS || BETTING_CONTRACT_ADDRESS === FALLBACK_CONTRACT) {
      throw new Error('Betting contract address not configured');
    }

    writeContract({
      address: BETTING_CONTRACT_ADDRESS,
      abi: bettingAbi,
      functionName: 'cancelTournament',
      args: [BigInt(tournamentId)],
    });
  };

  return {
    mutate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============ Helper Functions ============

/**
 * Get transaction status from any write hook
 */
export function getTransactionStatus(hook: {
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
}): TransactionState {
  return {
    isPending: hook.isPending,
    isConfirming: hook.isConfirming,
    isSuccess: hook.isSuccess,
    error: hook.error,
  };
}

/**
 * Format transaction error for user display
 */
export function formatTransactionError(error: Error | null): string {
  if (!error) return '';
  
  const message = error.message.toLowerCase();
  
  // User rejected
  if (message.includes('user rejected') || message.includes('user denied')) {
    return 'Transaction was rejected';
  }
  
  // Insufficient funds
  if (message.includes('insufficient funds')) {
    return 'Insufficient funds to complete transaction';
  }
  
  // Contract errors
  if (message.includes('tournament not active')) {
    return 'Tournament is not active for betting';
  }
  
  if (message.includes('bet below minimum')) {
    return `Minimum bet is ${MIN_BET} ETH`;
  }
  
  if (message.includes('invalid agent')) {
    return 'Invalid agent selected';
  }
  
  if (message.includes('already claimed')) {
    return 'Winnings already claimed';
  }
  
  if (message.includes('no winnings')) {
    return 'No winnings to claim';
  }
  
  if (message.includes('tournament not settled')) {
    return 'Tournament has not been settled yet';
  }
  
  // Generic fallback
  return 'Transaction failed. Please try again.';
}
