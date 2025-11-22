import React, { useEffect, useState } from 'react';
import { render, act } from '@testing-library/react';
import { WagmiProvider, createConfig, useAccount, useConnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { baseSepolia } from 'wagmi/chains';
import { http, injected } from 'wagmi';
import { ethers } from 'ethers';
import { usePlaceBet } from '../useBettingContracts';
import { useTournament } from '../useTournament';
import { useUserBets } from '../useUserBets';

// ---------------------
// Local Hardhat RPC setup
// ---------------------
const LOCAL_RPC = 'http://127.0.0.1:8545';
const provider = new ethers.JsonRpcProvider(LOCAL_RPC);

// Mock window.ethereum for testing
function mockEthereumProvider(accountAddress: string) {
  return {
    request: async ({ method, params }: any) => {
      if (method === 'eth_requestAccounts') {
        return [accountAddress];
      }
      if (method === 'eth_accounts') {
        return [accountAddress];
      }
      if (method === 'eth_chainId') {
        return `0x${baseSepolia.id.toString(16)}`;
      }
      if (method === 'wallet_requestPermissions') {
        return [];
      }
      if (method === 'eth_sendTransaction') {
        // Forward to the local provider
        return await provider.send(method, params);
      }
      // Forward other methods to the local provider
      try {
        return await provider.send(method, params);
      } catch (error: any) {
        if (method === 'wallet_requestPermissions') {
          return [];
        }
        throw error;
      }
    },
    on: () => {},
    removeListener: () => {},
    isMetaMask: false,
  };
}

// Create Wagmi config for test
const config = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(LOCAL_RPC),
  },
});

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

interface Result {
  tournamentPool?: string;
  userBets?: any[];
  error?: any;
}

// ---------------------
// Hook Tester Component
// ---------------------
function HookTester({
  userAddress,
  tournamentId,
  agentId,
  stakeEth,
  onDone,
}: {
  userAddress: string;
  tournamentId: number;
  agentId: number;
  stakeEth: string;
  onDone: (res: Result) => void;
}) {
  const [result, setResult] = useState<Result>({});
  const { connect, connectors } = useConnect();
  const { isConnected, address } = useAccount();
  const placeBetHook = usePlaceBet();
  const tournamentHook = useTournament(tournamentId);
  const userBetsHook = useUserBets(tournamentId);

  useEffect(() => {
    async function run() {
      try {
        // Mock window.ethereum with the user's address
        if (typeof window !== 'undefined') {
          (window as any).ethereum = mockEthereumProvider(userAddress);
        }

        // Connect wallet first
        if (!isConnected && connectors.length > 0) {
          console.log(`🔌 Connecting wallet for user: ${userAddress.substring(0, 10)}...`);
          await act(async () => {
            await connect({ connector: connectors[0] });
          });
          // Wait for connection to complete
          await act(async () => {
            await new Promise((res) => setTimeout(res, 500));
          });
          console.log(`✅ Wallet connected: ${address || userAddress}`);
        }

        // Get initial pool before bet
        const initialPool = tournamentHook.totalPoolEth || '0';
        console.log(`\n💰 User ${userAddress.substring(0, 10)}... placing bet:`);
        console.log(`   Tournament ID: ${tournamentId}`);
        console.log(`   Agent ID: ${agentId}`);
        console.log(`   Stake: ${stakeEth} ETH`);
        console.log(`   Pool before bet: ${initialPool} ETH`);

        // Place bet
        await act(async () => {
          placeBetHook.mutate({ tournamentId, agentId, stakeEth });
        });

        console.log(`   ⏳ Transaction submitted, waiting for confirmation...`);

        // Wait until transaction is confirmed or error occurs
        let attempts = 0;
        const maxAttempts = 50; // 10 seconds max wait
        while (placeBetHook.isPending && !placeBetHook.error && attempts < maxAttempts) {
          await act(async () => {
            await new Promise((res) => setTimeout(res, 200));
          });
          attempts++;
        }

        // Check for errors
        if (placeBetHook.error) {
          console.error(`   ❌ Transaction failed:`, placeBetHook.error);
          throw placeBetHook.error;
        }

        // If still pending after max attempts, log and continue
        if (placeBetHook.isPending) {
          console.warn(`   ⚠️ Transaction still pending after ${maxAttempts} attempts`);
        } else if (placeBetHook.isSuccess && placeBetHook.hash) {
          console.log(`   ✅ Transaction confirmed! Hash: ${placeBetHook.hash}`);
        }

        // Wait a bit for hooks to update after transaction
        await act(async () => {
          await new Promise((res) => setTimeout(res, 1000));
        });

        // Get the latest data from hooks
        const updatedPool = tournamentHook.totalPoolEth || '0';
        const resultData: Result = {
          tournamentPool: updatedPool,
          userBets: userBetsHook.data?.bets,
        };

        console.log(`   💎 Pool after bet: ${updatedPool} ETH`);
        const poolChange = Number(updatedPool) - Number(initialPool);
        console.log(`   📊 Pool change: ${poolChange >= 0 ? '+' : ''}${poolChange.toFixed(4)} ETH\n`);

        // Update state and call onDone with the actual data
        await act(async () => {
          setResult(resultData);
        });

        // Call onDone with the actual data, not the stale state
        onDone(resultData);
      } catch (err) {
        console.error(`   ❌ Error for user ${userAddress.substring(0, 10)}...:`, err);
        const errorResult: Result = { error: err };
        await act(async () => {
          setResult(errorResult);
        });
        onDone(errorResult);
      }
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ---------------------
// Multi-user Test
// ---------------------
describe('Multi-user frontend integration test', () => {
  let accounts: string[];

  beforeAll(async () => {
    jest.setTimeout(60000);
    // Fetch local Hardhat accounts and extract addresses
    const signers = await provider.listAccounts();
    accounts = signers.map(signer => signer.address);
  }, 60000);

  it('should allow multiple users to place bets', async () => {
    jest.setTimeout(60000);
    const tournamentId = 1;
    const results: Result[] = [];

    // Create a new query client for each test to avoid state pollution
    const testQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Sequentially render HookTester for 3 users
    for (let i = 0; i < 3; i++) {
      await new Promise<void>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            results.push({ error: 'Test timeout' });
            resolve();
          }
        }, 8000); // 8 second timeout per user

        act(() => {
          const { unmount } = render(
            <WagmiProvider config={config}>
              <QueryClientProvider client={testQueryClient}>
                <HookTester
                  userAddress={accounts[i + 1]}
                  tournamentId={tournamentId}
                  agentId={(i % 3) + 1}
                  stakeEth="0.01"
                  onDone={(res) => {
                    if (!resolved) {
                      resolved = true;
                      clearTimeout(timeout);
                      results.push(res);
                      unmount();
                      resolve();
                    }
                  }}
                />
              </QueryClientProvider>
            </WagmiProvider>
          );
        });
      });
    }

    console.log('\n📋 Test Summary:');
    console.log('='.repeat(50));
    results.forEach((result, index) => {
      if (result.error) {
        console.log(`User ${index + 1}: ❌ Error - ${result.error}`);
      } else {
        console.log(`User ${index + 1}: ✅ Success - Pool: ${result.tournamentPool || '0'} ETH`);
      }
    });
    console.log('='.repeat(50));

    expect(results.length).toBe(3);
    expect(results.every((r) => r.error === undefined)).toBe(true);
    
    // Get the final pool (should be the last result's pool)
    const finalPool = results[results.length - 1]?.tournamentPool || '0';
    console.log(`\n🏆 Final Tournament Pool: ${finalPool} ETH`);
  });
});
