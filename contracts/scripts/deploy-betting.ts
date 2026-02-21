import { network } from "hardhat";
import { formatEther } from "viem";

async function main() {
  console.log("Deploying AgonusBetting to Base Sepolia...\n");

  const { viem } = await network.connect({
    network: "baseSepolia",
  });

  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  console.log("Deploying with account:", deployer.account.address);

  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log("Account balance:", formatEther(balance), "ETH\n");

  // Deploy the contract
  console.log("Deploying AgonusBetting contract...");
  const betting = await viem.deployContract("AgonusBetting");

  console.log("\n✅ Deployment successful!");
  console.log("Contract address:", betting.address);
  console.log("Owner:", deployer.account.address);
  console.log("Platform wallet:", deployer.account.address);

  console.log("\n📝 Next steps:");
  console.log("1. Verify contract on BaseScan:");
  console.log(`   npx hardhat verify --network baseSepolia ${betting.address}`);
  console.log("\n2. Save this contract address for your frontend/backend");
  console.log("\n3. To create a tournament:");
  console.log(`   Use createTournament(agentCount) function`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
