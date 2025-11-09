import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther, getAddress } from "viem";

describe("AgonusBetting", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, alice, bob] = await viem.getWalletClients();

  it("Should create tournament and place bet", async function () {
    const betting = await viem.deployContract("AgonusBetting");

    // Create tournament with 3 agents
    await viem.assertions.emitWithArgs(
      betting.write.createTournament([3n]),
      betting,
      "TournamentCreated",
      [0n, 3n],
    );

    // Alice bets 1 ETH on agent 1
    await viem.assertions.emitWithArgs(
      betting.write.placeBet([0n, 1n], {
        value: parseEther("1"),
        account: alice.account,
      }),
      betting,
      "BetPlaced",
      [getAddress(alice.account.address), 0n, 1n, parseEther("1")],
    );

    const pool = await betting.read.agentPools([0n, 1n]);
    assert.equal(pool, parseEther("1"));
  });
  it("Should settle and claim winnings", async function () {
    const betting = await viem.deployContract("AgonusBetting");

    await betting.write.createTournament([2n]);
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });

    await betting.write.closeBetting([0n]);
    await betting.write.settleTournament([0n, 1n]);

    const balanceBefore = await publicClient.getBalance({
      address: alice.account.address,
    });

    const hash = await betting.write.claimWinnings([0n], {
      account: alice.account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;

    const balanceAfter = await publicClient.getBalance({
      address: alice.account.address,
    });

    // Should get 0.95 ETH (95% of 1 ETH pool)
    assert.equal(balanceAfter, balanceBefore + parseEther("0.95") - gasUsed);
  });

  it("Should handle multiple bets and calculate odds correctly", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    await betting.write.createTournament([3n]);

    // Alice bets 1 ETH on agent 1
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });

    // Bob bets 2 ETH on agent 2
    await betting.write.placeBet([0n, 2n], {
      value: parseEther("2"),
      account: bob.account,
    });

    // Get all bet events
    const events = await publicClient.getContractEvents({
      address: betting.address,
      abi: betting.abi,
      eventName: "BetPlaced",
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    // Total pool should equal sum of all bets
    let totalBets = 0n;
    for (const event of events) {
      totalBets += event.args.amount;
    }

    const tournament = await betting.read.tournaments([0n]);
    assert.equal(tournament[2], totalBets); // tournament.totalPool

    // Check odds for agent 1
    const odds = await betting.read.getAgentOdds([0n, 1n]);
    assert.equal(odds, 28500n); // 2.85x odds
  });

  it("Should refund on cancelled tournament", async function () {
    const betting = await viem.deployContract("AgonusBetting");

    await betting.write.createTournament([2n]);
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });

    await viem.assertions.emitWithArgs(
      betting.write.cancelTournament([0n]),
      betting,
      "TournamentCancelled",
      [0n],
    );

    const balanceBefore = await publicClient.getBalance({
      address: alice.account.address,
    });

    const hash = await betting.write.claimWinnings([0n], {
      account: alice.account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;

    const balanceAfter = await publicClient.getBalance({
      address: alice.account.address,
    });

    // Should get full refund of 1 ETH
    assert.equal(balanceAfter, balanceBefore + parseEther("1") - gasUsed);
  });
});
