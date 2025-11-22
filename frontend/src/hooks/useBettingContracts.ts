'use client';

import type { Abi } from 'viem';
import { useMemo, useEffect } from 'react';
import { parseEther } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import artifact from '../../../contracts/artifacts/contracts/AgonusBetting.sol/AgonusBetting.json';

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

/**
 * Hook to place a bet on an agent in a tournament
 */
export function usePlaceBet() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const placeBet = useMemo(
    () => ({
      mutate: (params: { tournamentId: bigint | number; agentId: bigint | number; stakeEth: string }) => {
        if (!BETTING_CONTRACT_ADDRESS || BETTING_CONTRACT_ADDRESS === FALLBACK_CONTRACT) {
          throw new Error('Betting contract address is not configured. Set NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS in .env.local');
        }

        writeContract({
          address: BETTING_CONTRACT_ADDRESS,
          abi: bettingAbi,
          functionName: 'placeBet',
          args: [BigInt(params.tournamentId), BigInt(params.agentId)],
          value: parseEther(params.stakeEth),
        });
      },
      hash,
      isPending: isPending || isConfirming,
      isSuccess,
      error,
    }),
    [writeContract, hash, isPending, isConfirming, isSuccess, error]
  );

  // Invalidate queries when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      queryClient.invalidateQueries({ queryKey: ['userBets'] });
    }
  }, [isSuccess, queryClient]);

  return placeBet;
}

/**
 * Hook to claim winnings for a settled tournament
 * Similar pattern to useUpdateBet() in useBets.ts
 */
export function useClaimWinnings() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimWinnings = useMemo(
    () => ({
      mutate: (tournamentId: bigint | number) => {
        if (!BETTING_CONTRACT_ADDRESS || BETTING_CONTRACT_ADDRESS === FALLBACK_CONTRACT) {
          throw new Error('Betting contract address is not configured. Set NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS in .env.local');
        }

        writeContract({
          address: BETTING_CONTRACT_ADDRESS,
          abi: bettingAbi,
          functionName: 'claimWinnings',
          args: [BigInt(tournamentId)],
        });
      },
      hash,
      isPending: isPending || isConfirming,
      isSuccess,
      error,
    }),
    [writeContract, hash, isPending, isConfirming, isSuccess, error]
  );

  // Invalidate queries when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      queryClient.invalidateQueries({ queryKey: ['userBets'] });
    }
  }, [isSuccess, queryClient]);

  return claimWinnings;
}

/**
 * Hook to create a new tournament (admin/owner only)
 * Similar pattern to useCreateBet() in useBets.ts
 */
export function useCreateTournament() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createTournament = useMemo(
    () => ({
      mutate: (agentCount: number) => {
        if (!BETTING_CONTRACT_ADDRESS || BETTING_CONTRACT_ADDRESS === FALLBACK_CONTRACT) {
          throw new Error('Betting contract address is not configured. Set NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS in .env.local');
        }
        if (agentCount < 2 || agentCount > 100) {
          throw new Error('Agent count must be between 2 and 100');
        }

        writeContract({
          address: BETTING_CONTRACT_ADDRESS,
          abi: bettingAbi,
          functionName: 'createTournament',
          args: [BigInt(agentCount)],
        });
      },
      hash,
      isPending: isPending || isConfirming,
      isSuccess,
      error,
    }),
    [writeContract, hash, isPending, isConfirming, isSuccess, error]
  );

  // Invalidate queries when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
    }
  }, [isSuccess, queryClient]);

  return createTournament;
}

/**
 * Legacy hook - kept for backward compatibility
 * @deprecated Use usePlaceBet() and useClaimWinnings() instead
 */
export function useBettingContract() {
  const placeBetHook = usePlaceBet();
  const claimWinningsHook = useClaimWinnings();

  return {
    contractAddress: BETTING_CONTRACT_ADDRESS,
    placeBet: async (tournamentId: bigint | number, agentId: bigint | number, stakeEth: string) => {
      // Check for existing error first
      if (placeBetHook.error) {
        throw placeBetHook.error;
      }

      try {
        // Call mutate - writeContract may throw synchronously
        placeBetHook.mutate({ tournamentId, agentId, stakeEth });
        
        // Check for error after mutation attempt
        if (placeBetHook.error) {
          throw placeBetHook.error;
        }

        // Return hash if available, otherwise indicate pending
        return { 
          hash: placeBetHook.hash,
          message: placeBetHook.hash 
            ? "Transaction submitted" 
            : "Transaction initiated, check wallet for confirmation"
        };
      } catch (error: any) {
        // Catch synchronous errors (like validation errors)
        const errorObj = error instanceof Error 
          ? error 
          : new Error(error?.message || error?.shortMessage || String(error) || "Unknown error occurred");
        throw errorObj;
      }
    },
    claimWinnings: async (tournamentId: bigint | number) => {
      // Check for existing error first
      if (claimWinningsHook.error) {
        throw claimWinningsHook.error;
      }

      try {
        // Call mutate
        claimWinningsHook.mutate(tournamentId);
        
        // Check for error after mutation attempt
        if (claimWinningsHook.error) {
          throw claimWinningsHook.error;
        }

        // Return hash if available
        return { 
          hash: claimWinningsHook.hash,
          message: claimWinningsHook.hash 
            ? "Transaction submitted" 
            : "Transaction initiated, check wallet for confirmation"
        };
      } catch (error: any) {
        const errorObj = error instanceof Error 
          ? error 
          : new Error(error?.message || error?.shortMessage || String(error) || "Unknown error occurred");
        throw errorObj;
      }
    },
  };
}

