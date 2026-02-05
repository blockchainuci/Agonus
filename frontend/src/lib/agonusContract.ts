import abi from "@/src/abi/AgonusBetting.json";

export const AGONUS_ABI = abi;

export const AGONUS_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532
);

export const AGONUS_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;

export function assertContractConfig() {
  if (!AGONUS_CONTRACT_ADDRESS || !AGONUS_CONTRACT_ADDRESS.startsWith("0x")) {
    throw new Error("Missing NEXT_PUBLIC_CONTRACT_ADDRESS");
  }
  if (!AGONUS_CHAIN_ID || Number.isNaN(AGONUS_CHAIN_ID)) {
    throw new Error("Invalid NEXT_PUBLIC_CHAIN_ID");
  }
}
