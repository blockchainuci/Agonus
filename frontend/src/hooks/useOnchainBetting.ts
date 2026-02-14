import { parseEther, formatEther } from "viem";
import { useWriteContract, useReadContract, useAccount } from "wagmi";
import {
  AGONUS_ABI,
  AGONUS_CHAIN_ID,
  AGONUS_CONTRACT_ADDRESS,
  assertContractConfig,
} from "@/src/lib/agonusContract";

export function usePlaceBetOnchain() {
  const { writeContractAsync } = useWriteContract();

  return async (args: {
    contractTournamentId: number;
    contractAgentId: number;
    amountEth: string;
  }) => {
    assertContractConfig();

    return writeContractAsync({
      chainId: AGONUS_CHAIN_ID,
      address: AGONUS_CONTRACT_ADDRESS,
      abi: AGONUS_ABI,
      functionName: "placeBet",
      args: [BigInt(args.contractTournamentId), BigInt(args.contractAgentId)],
      value: parseEther(args.amountEth),
    });
  };
}

export function useClaimWinningsOnchain() {
  const { writeContractAsync } = useWriteContract();

  return async (contractTournamentId: number) => {
    assertContractConfig();

    return writeContractAsync({
      chainId: AGONUS_CHAIN_ID,
      address: AGONUS_CONTRACT_ADDRESS,
      abi: AGONUS_ABI,
      functionName: "claimWinnings",
      args: [BigInt(contractTournamentId)],
    });
  };
}

/**
 * Read on-chain claim status for a user in a tournament.
 * Returns whether the user has already claimed and their claimable payout.
 */
export function useClaimStatus(contractTournamentId?: number | null) {
  const { address } = useAccount();

  const enabled =
    !!contractTournamentId &&
    !!address &&
    !!AGONUS_CONTRACT_ADDRESS &&
    AGONUS_CONTRACT_ADDRESS.startsWith("0x");

  const hasClaimed = useReadContract({
    chainId: AGONUS_CHAIN_ID,
    address: AGONUS_CONTRACT_ADDRESS,
    abi: AGONUS_ABI,
    functionName: "hasClaimed",
    args: enabled ? [BigInt(contractTournamentId!), address!] : undefined,
    query: { enabled },
  });

  const calculatePayout = useReadContract({
    chainId: AGONUS_CHAIN_ID,
    address: AGONUS_CONTRACT_ADDRESS,
    abi: AGONUS_ABI,
    functionName: "calculatePayout",
    args: enabled ? [BigInt(contractTournamentId!), address!] : undefined,
    query: { enabled },
  });

  const claimed = hasClaimed.data as boolean | undefined;
  const payoutWei = calculatePayout.data as bigint | undefined;
  const payoutEth = payoutWei ? formatEther(payoutWei) : "0";
  const hasClaimable = !!payoutWei && payoutWei > BigInt(0) && !claimed;

  return {
    claimed: claimed ?? false,
    payoutEth,
    hasClaimable,
    isLoading: hasClaimed.isLoading || calculatePayout.isLoading,
    refetch: () => {
      hasClaimed.refetch();
      calculatePayout.refetch();
    },
  };
}
