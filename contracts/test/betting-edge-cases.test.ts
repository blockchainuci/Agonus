import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther, getAddress } from "viem";

describe("AgonusBetting - Edge Cases", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, alice, bob, carol] = await viem.getWalletClients();

  it("Should revert when betting below minimum", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);

    try {
      await betting.write.placeBet([0n, 1n], {
        value: parseEther("0.0005"), // Below MIN_BET of 0.001
        account: alice.account,
      });
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Bet below minimum/);
    }
  });

  it("Should revert when betting on non-existent tournament", async function () {
    const betting = await viem.deployContract("AgonusBetting");

    try {
      await betting.write.placeBet([999n, 1n], {
        value: parseEther("1"),
        account: alice.account,
      });
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Tournament does not exist/);
    }
  });

  it("Should revert when betting on invalid agent ID (zero)", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);

    try {
      await betting.write.placeBet([0n, 0n], {
        value: parseEther("1"),
        account: alice.account,
      });
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Invalid agent ID/);
    }
  });

  it("Should revert when betting on invalid agent ID (too high)", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);

    try {
      await betting.write.placeBet([0n, 99n], {
        value: parseEther("1"),
        account: alice.account,
      });
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Invalid agent ID/);
    }
  });

  it("Should revert when betting after tournament closed", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);
    await betting.write.closeBetting([0n]);

    try {
      await betting.write.placeBet([0n, 1n], {
        value: parseEther("1"),
        account: alice.account,
      });
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Tournament not active/);
    }
  });

  it("Should revert when settling with invalid agent ID", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });
    await betting.write.closeBetting([0n]);

    try {
      await betting.write.settleTournament([0n, 99n]);
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Invalid agent ID/);
    }
  });

  it("Should revert when settling without closing betting first", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });

    try {
      await betting.write.settleTournament([0n, 1n]);
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Betting still active/);
    }
  });

  it("Should revert when settling with no bets placed", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);
    await betting.write.closeBetting([0n]);

    try {
      await betting.write.settleTournament([0n, 1n]);
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /No bets placed/);
    }
  });

  it("Should revert when settling already settled tournament", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });
    await betting.write.closeBetting([0n]);
    await betting.write.settleTournament([0n, 1n]);

    try {
      await betting.write.settleTournament([0n, 1n]);
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Already settled/);
    }
  });

  it("Should revert when claiming before settlement", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });

    try {
      await betting.write.claimWinnings([0n], { account: alice.account });
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Tournament not settled/);
    }
  });

  it("Should revert when claiming twice", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });
    await betting.write.closeBetting([0n]);
    await betting.write.settleTournament([0n, 1n]);
    await betting.write.claimWinnings([0n], { account: alice.account });

    try {
      await betting.write.claimWinnings([0n], { account: alice.account });
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Already claimed/);
    }
  });

  it("Should revert when loser tries to claim", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });
    await betting.write.placeBet([0n, 2n], {
      value: parseEther("1"),
      account: bob.account,
    });
    await betting.write.closeBetting([0n]);
    await betting.write.settleTournament([0n, 1n]); // Agent 1 wins

    try {
      await betting.write.claimWinnings([0n], { account: bob.account }); // Bob bet on agent 2
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /No winning bets/);
    }
  });

  it("Should revert when user with no bets tries to claim", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });
    await betting.write.closeBetting([0n]);
    await betting.write.settleTournament([0n, 1n]);

    try {
      await betting.write.claimWinnings([0n], { account: bob.account }); // Bob never bet
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /No winning bets|No winnings to claim/); // Changed this line
    }
  });

  it("Should handle maximum agent count (100)", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([100n]);

    // Bet on agent 100
    await betting.write.placeBet([0n, 100n], {
      value: parseEther("1"),
      account: alice.account,
    });

    const pool = await betting.read.agentPools([0n, 100n]);
    assert.equal(pool, parseEther("1"));
  });

  it("Should revert when creating tournament with too many agents", async function () {
    const betting = await viem.deployContract("AgonusBetting");

    try {
      await betting.write.createTournament([101n]);
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Invalid agent count/);
    }
  });

  it("Should revert when creating tournament with too few agents", async function () {
    const betting = await viem.deployContract("AgonusBetting");

    try {
      await betting.write.createTournament([1n]);
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Invalid agent count/);
    }
  });

  it("Should handle multiple bets from same user on same agent", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);

    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("0.5"),
      account: alice.account,
    });
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("0.3"),
      account: alice.account,
    });

    const totalBet = await betting.read.userBets([
      0n,
      alice.account.address,
      1n,
    ]);
    assert.equal(totalBet, parseEther("1.8"));
  });

  it("Should handle user betting on multiple agents", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);

    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });
    await betting.write.placeBet([0n, 2n], {
      value: parseEther("2"),
      account: alice.account,
    });
    await betting.write.placeBet([0n, 3n], {
      value: parseEther("0.5"),
      account: alice.account,
    });

    const bet1 = await betting.read.userBets([0n, alice.account.address, 1n]);
    const bet2 = await betting.read.userBets([0n, alice.account.address, 2n]);
    const bet3 = await betting.read.userBets([0n, alice.account.address, 3n]);

    assert.equal(bet1, parseEther("1"));
    assert.equal(bet2, parseEther("2"));
    assert.equal(bet3, parseEther("0.5"));
  });

  it("Should calculate correct payout with precision", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);

    // Create uneven distribution
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("1"),
      account: alice.account,
    });
    await betting.write.placeBet([0n, 1n], {
      value: parseEther("2"),
      account: bob.account,
    });
    await betting.write.placeBet([0n, 2n], {
      value: parseEther("5"),
      account: carol.account,
    });

    await betting.write.closeBetting([0n]);
    await betting.write.settleTournament([0n, 1n]);

    // Total: 8 ETH, Fee: 0.4 ETH, Winner pool: 7.6 ETH
    // Agent 1 pool: 3 ETH
    // Alice (1 ETH): 1/3 * 7.6 = 2.533333... ETH

    const alicePayout = await betting.read.calculatePayout([
      0n,
      alice.account.address,
    ]);
    assert.equal(alicePayout, 2533333333333333333n); // ~2.533 ETH
  });

  it("Should revert non-owner trying to create tournament", async function () {
    const betting = await viem.deployContract("AgonusBetting");

    try {
      await betting.write.createTournament([3n], { account: alice.account });
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Not owner|OwnableUnauthorizedAccount/); // Changed this line
    }
  });

  it("Should revert non-owner trying to close betting", async function () {
    const betting = await viem.deployContract("AgonusBetting");
    await betting.write.createTournament([3n]);

    try {
      await betting.write.closeBetting([0n], { account: alice.account });
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Not owner|OwnableUnauthorizedAccount/); // Changed this line
    }
  });

  it("Should revert when setting platform wallet to zero address", async function () {
    const betting = await viem.deployContract("AgonusBetting");

    try {
      await betting.write.setPlatformWallet([
        "0x0000000000000000000000000000000000000000",
      ]);
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Invalid address/);
    }
  });

  it("Should reject direct ETH transfers", async function () {
    const betting = await viem.deployContract("AgonusBetting");

    try {
      await alice.sendTransaction({
        to: betting.address,
        value: parseEther("1"),
      });
      assert.fail("Should have reverted");
    } catch (error: any) {
      assert.match(error.message, /Use placeBet function/);
    }
  });
});
