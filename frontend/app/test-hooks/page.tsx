/**
 * COMPREHENSIVE TEST SUITE FOR BLOCKCHAIN HOOKS
 * 
 * This component tests all requirements for the three blockchain hook files:
 * - useBettingContract.ts
 * - useTournament.ts  
 * - useUserBets.ts
 */

'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

// Import all hooks to test
import {
  usePlaceBet,
  useClaimWinnings,
  useCreateTournament,
  useCloseBetting,
  useSettleTournament,
  useCancelTournament,
  BETTING_CONTRACT_ADDRESS,
  MIN_BET,
  MIN_AGENTS,
  MAX_AGENTS,
  formatTransactionError,
} from '../../src/hooks/useBettingContract';

import {
  useTournament,
  useAgentOdds,
  useAgentPool,
  type Tournament,
  type AgentData,
} from '../../src/hooks/useTournament';

import {
  useUserBets,
  useUserBetOnAgent,
  useHasClaimed,
  usePotentialPayout,
  type UserBettingData,
} from '../../src/hooks/useUserBets';

// ============================================================================
// TEST COMPONENT
// ============================================================================

export default function Page() {
  const { address, isConnected } = useAccount();
  const [tournamentId, setTournamentId] = useState(1);
  const [agentId, setAgentId] = useState(1);
  const [betAmount, setBetAmount] = useState('0.01');

  // ============================================================================
  // REQUIREMENT 1: useBettingContract.ts - Core contract interactions
  // ============================================================================

  const placeBet = usePlaceBet();
  const claimWinnings = useClaimWinnings();
  const createTournament = useCreateTournament();
  const closeBetting = useCloseBetting();
  const settleTournament = useSettleTournament();
  const cancelTournament = useCancelTournament();

  // ============================================================================
  // REQUIREMENT 2: useTournament.ts - Fetch tournament data
  // ============================================================================

  const {
    tournament,
    agents,
    loading: tournamentLoading,
    refetch: refetchTournament,
  } = useTournament(tournamentId);

  // Helper hooks
  const { odds: singleAgentOdds, loading: oddsLoading } = useAgentOdds(
    tournamentId,
    agentId
  );
  const { pool, poolEth, loading: poolLoading } = useAgentPool(
    tournamentId,
    agentId
  );

  // ============================================================================
  // REQUIREMENT 3: useUserBets.ts - Get user's bets
  // ============================================================================

  const {
    data: userBettingData,
    loading: userBetsLoading,
    refetch: refetchUserBets,
  } = useUserBets(tournamentId);

  // Helper hooks
  const { amount: userBetAmount, amountEth: userBetAmountEth } =
    useUserBetOnAgent(tournamentId, agentId);
  const { hasClaimed } = useHasClaimed(tournamentId);
  const { payout, payoutEth } = usePotentialPayout(tournamentId);

  // ============================================================================
  // TEST RESULT VALIDATORS
  // ============================================================================

  const validateRequirements = () => {
    const results = {
      'useBettingContract.ts': {
        '✓ Contract address configured': !!BETTING_CONTRACT_ADDRESS && BETTING_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
        '✓ MIN_BET constant exists': typeof MIN_BET === 'string',
        '✓ MIN_AGENTS constant exists': typeof MIN_AGENTS === 'number',
        '✓ MAX_AGENTS constant exists': typeof MAX_AGENTS === 'number',
        '✓ usePlaceBet hook available': typeof placeBet.mutate === 'function',
        '✓ useClaimWinnings hook available': typeof claimWinnings.mutate === 'function',
        '✓ useCreateTournament hook available': typeof createTournament.mutate === 'function',
        '✓ useCloseBetting hook available': typeof closeBetting.mutate === 'function',
        '✓ useSettleTournament hook available': typeof settleTournament.mutate === 'function',
        '✓ useCancelTournament hook available': typeof cancelTournament.mutate === 'function',
        '✓ Transaction state (hash)': placeBet.hash !== undefined,
        '✓ Transaction state (isPending)': typeof placeBet.isPending === 'boolean',
        '✓ Transaction state (isConfirming)': typeof placeBet.isConfirming === 'boolean',
        '✓ Transaction state (isSuccess)': typeof placeBet.isSuccess === 'boolean',
        '✓ Transaction state (error)': placeBet.error === null || placeBet.error instanceof Error,
        '✓ Error formatter exists': typeof formatTransactionError === 'function',
      },
      'useTournament.ts': {
        '✓ Tournament data structure': tournament === null || (
          typeof tournament.isActive === 'boolean' &&
          typeof tournament.isSettled === 'boolean' &&
          typeof tournament.totalPool === 'bigint' &&
          typeof tournament.totalPoolEth === 'string' &&
          typeof tournament.winningAgentId === 'number' &&
          typeof tournament.agentCount === 'number'
        ),
        '✓ Agents array exists': Array.isArray(agents),
        '✓ Agent data structure': agents.length === 0 || (
          typeof agents[0].agentId === 'number' &&
          typeof agents[0].pool === 'bigint' &&
          typeof agents[0].poolEth === 'string' &&
          typeof agents[0].odds === 'number' &&
          typeof agents[0].oddsFractional === 'string' &&
          typeof agents[0].oddsAmerican === 'string'
        ),
        '✓ Loading state exists': typeof tournamentLoading === 'boolean',
        '✓ Refetch function exists': typeof refetchTournament === 'function',
        '✓ useAgentOdds hook works': (
          typeof singleAgentOdds.decimal === 'number' &&
          typeof singleAgentOdds.fractional === 'string' &&
          typeof singleAgentOdds.american === 'string' &&
          typeof singleAgentOdds.bp === 'bigint'
        ),
        '✓ useAgentPool hook works': (
          typeof pool === 'bigint' &&
          typeof poolEth === 'string'
        ),
        '✓ Odds conversion (decimal)': singleAgentOdds.decimal >= 0,
        '✓ Odds conversion (fractional)': singleAgentOdds.fractional.includes('/'),
        '✓ Odds conversion (american)': !!singleAgentOdds.american.match(/^[+-]\d+$/),
      },
      'useUserBets.ts': {
        '✓ User betting data structure': userBettingData === null || (
          Array.isArray(userBettingData.bets) &&
          typeof userBettingData.totalExposure === 'bigint' &&
          typeof userBettingData.totalExposureEth === 'string' &&
          typeof userBettingData.hasClaimed === 'boolean' &&
          typeof userBettingData.potentialPayout === 'bigint' &&
          typeof userBettingData.potentialPayoutEth === 'string'
        ),
        '✓ User bets array': userBettingData === null || userBettingData.bets.every(bet =>
          typeof bet.agentId === 'number' &&
          typeof bet.amount === 'bigint' &&
          typeof bet.amountEth === 'string'
        ),
        '✓ Loading state exists': typeof userBetsLoading === 'boolean',
        '✓ Refetch function exists': typeof refetchUserBets === 'function',
        '✓ useUserBetOnAgent works': (
          typeof userBetAmount === 'bigint' &&
          typeof userBetAmountEth === 'string'
        ),
        '✓ useHasClaimed works': typeof hasClaimed === 'boolean',
        '✓ usePotentialPayout works': (
          typeof payout === 'bigint' &&
          typeof payoutEth === 'string'
        ),
        '✓ Total exposure calculated': userBettingData === null || typeof userBettingData.totalExposure === 'bigint',
      },
    };

    return results;
  };

  const results = validateRequirements();

  // Calculate pass/fail stats
  const calculateStats = (section: Record<string, boolean>) => {
    const total = Object.keys(section).length;
    const passed = Object.values(section).filter(Boolean).length;
    return { passed, total, percentage: ((passed / total) * 100).toFixed(1) };
  };

  // ============================================================================
  // RENDER TEST RESULTS
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-4">
            🧪 Blockchain Hooks Test Suite
          </h1>
          <p className="text-purple-200">
            Comprehensive testing of all blockchain hook requirements
          </p>
          
          {/* Connection Status */}
          <div className="mt-4 p-4 bg-black/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Connection Status:</span>
              <span className={`px-4 py-2 rounded-full font-semibold ${isConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                {isConnected ? '✓ Connected' : '✗ Not Connected'}
              </span>
            </div>
            {isConnected && address && (
              <div className="mt-2 text-purple-200 text-sm">
                Address: {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}
          </div>

          {/* Contract Address */}
          <div className="mt-4 p-4 bg-black/20 rounded-lg">
            <div className="text-white font-semibold mb-2">Contract Address:</div>
            <code className="text-purple-300 text-sm break-all">{BETTING_CONTRACT_ADDRESS}</code>
          </div>
        </div>

        {/* Test Results */}
        {Object.entries(results).map(([fileName, tests]) => {
          const stats = calculateStats(tests);
          const allPassed = stats.passed === stats.total;

          return (
            <div
              key={fileName}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              {/* File Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{fileName}</h2>
                <div className={`px-6 py-2 rounded-full font-bold text-lg ${
                  allPassed 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {stats.passed}/{stats.total} ({stats.percentage}%)
                </div>
              </div>

              {/* Test Items */}
              <div className="space-y-2">
                {Object.entries(tests).map(([testName, passed]) => (
                  <div
                    key={testName}
                    className={`p-4 rounded-lg flex items-center justify-between ${
                      passed
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <span className="text-white font-medium">{testName}</span>
                    <span className={`text-2xl ${passed ? 'text-green-400' : 'text-red-400'}`}>
                      {passed ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Live Data Preview */}
        {isConnected && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">📊 Live Data Preview</h2>

            {/* Tournament Controls */}
            <div className="mb-6 p-4 bg-black/20 rounded-lg">
              <label className="text-white font-semibold mb-2 block">
                Tournament ID:
              </label>
              <input
                type="number"
                value={tournamentId}
                onChange={(e) => setTournamentId(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                min="1"
              />
            </div>

            {/* Tournament Data */}
            {tournamentLoading ? (
              <div className="text-purple-300 text-center py-8">Loading tournament data...</div>
            ) : tournament ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <DataCard label="Status" value={tournament.isActive ? '🟢 Active' : '🔴 Inactive'} />
                <DataCard label="Settled" value={tournament.isSettled ? 'Yes' : 'No'} />
                <DataCard label="Total Pool" value={`${tournament.totalPoolEth} ETH`} />
                <DataCard label="Agent Count" value={tournament.agentCount.toString()} />
                <DataCard label="Winning Agent" value={tournament.winningAgentId > 0 ? `#${tournament.winningAgentId}` : 'TBD'} />
              </div>
            ) : (
              <div className="text-yellow-300 text-center py-8">No tournament data available</div>
            )}

            {/* Agents Data */}
            {agents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4">Agent Pools & Odds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.slice(0, 6).map((agent) => (
                    <div key={agent.agentId} className="p-4 bg-black/20 rounded-lg border border-white/10">
                      <div className="text-purple-300 font-bold mb-2">Agent #{agent.agentId}</div>
                      <div className="text-white text-sm space-y-1">
                        <div>Pool: {agent.poolEth} ETH</div>
                        <div>Decimal: {agent.odds.toFixed(2)}</div>
                        <div>Fractional: {agent.oddsFractional}</div>
                        <div>American: {agent.oddsAmerican}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Betting Data */}
            {userBettingData && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Your Bets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <DataCard label="Total Exposure" value={`${userBettingData.totalExposureEth} ETH`} />
                  <DataCard label="Potential Payout" value={`${userBettingData.potentialPayoutEth} ETH`} />
                  <DataCard label="Has Claimed" value={userBettingData.hasClaimed ? 'Yes' : 'No'} />
                  <DataCard label="Number of Bets" value={userBettingData.bets.length.toString()} />
                </div>

                {userBettingData.bets.length > 0 && (
                  <div className="space-y-2">
                    {userBettingData.bets.map((bet) => (
                      <div key={bet.agentId} className="p-3 bg-black/20 rounded-lg border border-white/10 flex justify-between items-center">
                        <span className="text-white font-semibold">Agent #{bet.agentId}</span>
                        <span className="text-purple-300">{bet.amountEth} ETH</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Test Actions */}
        {isConnected && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">🎮 Test Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Place Bet */}
              <div className="p-4 bg-black/20 rounded-lg">
                <h3 className="text-white font-bold mb-3">Place Bet</h3>
                <input
                  type="number"
                  placeholder="Agent ID"
                  value={agentId}
                  onChange={(e) => setAgentId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white mb-2"
                />
                <input
                  type="text"
                  placeholder="Amount (ETH)"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white mb-2"
                />
                <button
                  onClick={() => placeBet.mutate({ tournamentId, agentId, amountEth: betAmount })}
                  disabled={placeBet.isPending}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded font-semibold"
                >
                  {placeBet.isPending ? 'Placing...' : 'Place Bet'}
                </button>
                {placeBet.error && (
                  <div className="mt-2 text-red-300 text-sm">
                    {formatTransactionError(placeBet.error)}
                  </div>
                )}
              </div>

              {/* Claim Winnings */}
              <div className="p-4 bg-black/20 rounded-lg">
                <h3 className="text-white font-bold mb-3">Claim Winnings</h3>
                <button
                  onClick={() => claimWinnings.mutate(tournamentId)}
                  disabled={claimWinnings.isPending}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-semibold"
                >
                  {claimWinnings.isPending ? 'Claiming...' : 'Claim Winnings'}
                </button>
                {claimWinnings.error && (
                  <div className="mt-2 text-red-300 text-sm">
                    {formatTransactionError(claimWinnings.error)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Test Summary
          </h2>
          <div className="text-6xl mb-4">
            {Object.values(results).every(section => 
              Object.values(section).every(Boolean)
            ) ? '✅' : '⚠️'}
          </div>
          <p className="text-purple-200 text-lg">
            {Object.values(results).every(section => 
              Object.values(section).every(Boolean)
            )
              ? 'All requirements passing! Your blockchain hooks are working correctly.'
              : 'Some tests need attention. Check the details above.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function DataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-black/20 rounded-lg border border-white/10">
      <div className="text-purple-300 text-sm mb-1">{label}</div>
      <div className="text-white font-bold text-lg">{value}</div>
    </div>
  );
}