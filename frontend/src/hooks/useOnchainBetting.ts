import { parseEther } from "viem";
import { useWriteContract } from "wagmi";
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
