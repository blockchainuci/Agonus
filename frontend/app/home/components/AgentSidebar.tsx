'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Trophy,
  XCircle,
  Clock,
  RefreshCw,
  Gift,
} from 'lucide-react';
import { useAccount, useSwitchChain } from 'wagmi';

import { useTournamentAgentStates } from '@/src/hooks/useAgentStates';
import { useAgents } from '@/src/hooks/useAgents';
import { useTournament } from '@/src/hooks/useTournaments';
import { useBettingStore } from '@/src/store/useBettingStore';
import { useTournamentStore } from '@/src/store/useTournamentStore';
import { useWalletAuth } from '@/src/hooks/useWalletAuth';
import {
  useClaimStatus,
  useClaimWinningsOnchain,
} from '@/src/hooks/useOnchainBetting';
import { AGONUS_CHAIN_ID } from '@/src/lib/agonusContract';
import { settleBet } from '@/src/lib/api/bets';
import { findAgentById } from '@/src/util/findAgentById';
import type { Bet } from '@/src/types/bets';

const AGENT_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

interface AgentSidebarProps {
  tournamentId: string;
  onAgentHover: (agentId: string | null) => void;
  highlightedAgentId: string | null;
}

type UiStatus = 'active' | 'won' | 'lost';

export default function AgentSidebar({
  tournamentId,
  onAgentHover,
  highlightedAgentId,
}: AgentSidebarProps) {
  const [betsOpen, setBetsOpen] = useState(false);

  const { data: agentStates } = useTournamentAgentStates(tournamentId);
  const { data: agents } = useAgents();
  const { data: tournament } = useTournament(tournamentId);
  const openBetModal = useBettingStore((s) => s.openBetModal);
  const tournamentStatus = useTournamentStore(
    (s) => s.selectedTournamentStatus
  );

  const { isConnected } = useAccount();
  const { isAuthenticated } = useWalletAuth();
  const myBets = useBettingStore((s) => s.myBets);
  const isLoadingBets = useBettingStore((s) => s.isLoadingBets);
  const refreshMyBets = useBettingStore((s) => s.refreshMyBets);

  const contractTournamentId = tournament?.contract_tournament_id;
  const isTournamentSettled = tournament?.status === 'completed';
  const {
    claimed: alreadyClaimed,
    payoutEth,
    hasClaimable,
    isLoading: claimStatusLoading,
    refetch: refetchClaimStatus,
  } = useClaimStatus(isTournamentSettled ? contractTournamentId : null);
  const claimWinningsOnchain = useClaimWinningsOnchain();
  const [claimState, setClaimState] = useState<
    'idle' | 'confirming' | 'pending' | 'success' | 'error'
  >('idle');
  const [claimError, setClaimError] = useState<string | null>(null);
  const { chainId } = useAccount();
  const wrongNetwork = isConnected && chainId !== AGONUS_CHAIN_ID;
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  useEffect(() => {
    if (!isConnected || !isAuthenticated) return;
    refreshMyBets(tournamentId);
  }, [isConnected, isAuthenticated, refreshMyBets, tournamentId]);

  const hasLiveStates = agentStates && agentStates.length > 0;
  const mappedAgentIds = tournament?.agent_contract_mapping
    ? Object.keys(tournament.agent_contract_mapping)
    : [];

  const displayedStates = useMemo(() => {
    if (hasLiveStates)
      return [...agentStates].sort((a, b) => (a.rank || 999) - (b.rank || 999));
    if (mappedAgentIds.length > 0) {
      return mappedAgentIds.map((agentId, idx) => ({
        agent_id: agentId,
        tournament_id: tournamentId,
        portfolio: {},
        portfolio_value_usd: '0',
        rank: idx + 1,
        trades_count: 0,
        last_decision: 'Waiting to start',
        updated_at: new Date().toISOString(),
      }));
    }
    return [];
  }, [agentStates, hasLiveStates, mappedAgentIds, tournamentId]);

  const totalValue =
    displayedStates.reduce(
      (sum, s) => sum + parseFloat(s.portfolio_value_usd),
      0
    ) || 0;

  const scopedBets = myBets.filter(
    (b) => String(b.tournament_id) === String(tournamentId)
  );
  const winnerId = tournament?.winner_agent_id;

  const getBetUiStatus = (bet: Bet): UiStatus => {
    if (isTournamentSettled) {
      if (winnerId && String(bet.agent_id) === String(winnerId)) return 'won';
      return 'lost';
    }
    if (bet.settled) {
      return bet.payout && Number(bet.payout) > 0 ? 'won' : 'lost';
    }
    if (bet.status === 'CANCELED' || bet.status === 'FAILED') return 'lost';
    return 'active';
  };

  const agentMap = useMemo(() => {
    if (!agents) return new Map<string, { name: string }>();
    return new Map(agents.map((a) => [String(a.id), { name: a.name }]));
  }, [agents]);

  const handleClaim = useCallback(async () => {
    if (!contractTournamentId || wrongNetwork) return;
    try {
      setClaimState('confirming');
      setClaimError(null);
      await claimWinningsOnchain(contractTournamentId);
      setClaimState('success');
      refetchClaimStatus();

      const totalPayout = parseFloat(payoutEth) || 0;
      const betsForTournament = myBets.filter(
        (b) => String(b.tournament_id) === String(tournamentId) && !b.settled
      );
      const winningBets = betsForTournament.filter(
        (b) => winnerId && String(b.agent_id) === String(winnerId)
      );
      const totalWinningAmount = winningBets.reduce(
        (sum, b) => sum + (parseFloat(String(b.amount_eth ?? b.amount)) || 0),
        0
      );

      await Promise.allSettled(
        betsForTournament.map((bet) => {
          const isWinner =
            winnerId && String(bet.agent_id) === String(winnerId);
          const betAmount =
            parseFloat(String(bet.amount_eth ?? bet.amount)) || 0;
          const betPayout =
            isWinner && totalWinningAmount > 0
              ? (betAmount / totalWinningAmount) * totalPayout
              : 0;
          return settleBet(String(bet.id), betPayout);
        })
      );
      refreshMyBets(tournamentId);
    } catch (err: unknown) {
      setClaimState('error');
      setClaimError((err as Error)?.message || 'Claim failed');
    }
  }, [
    contractTournamentId,
    wrongNetwork,
    claimWinningsOnchain,
    refetchClaimStatus,
    tournament,
    payoutEth,
    myBets,
    tournamentId,
    refreshMyBets,
    winnerId,
  ]);

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] rounded-2xl overflow-hidden border border-white/5">
      {/* Agent Watchlist */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-3 border-b border-white/5">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Agents
          </h3>
        </div>

        <div className="divide-y divide-white/5">
          {displayedStates.map((state, index) => {
            const agent = findAgentById(agents, state.agent_id);
            const agentName = agent?.name || `Agent ${index + 1}`;
            const portfolioValue = parseFloat(state.portfolio_value_usd);
            const pctOfTotal =
              totalValue > 0 ? (portfolioValue / totalValue) * 100 : 0;
            const color = AGENT_COLORS[index % AGENT_COLORS.length];
            const isHighlighted = highlightedAgentId === state.agent_id;
            const canBet =
              tournamentStatus === 'LIVE' && !tournament?.betting_closed;

            return (
              <div
                key={state.agent_id}
                className={`group relative px-3 py-2.5 cursor-pointer transition-colors ${
                  isHighlighted ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                }`}
                onMouseEnter={() => onAgentHover(state.agent_id)}
                onMouseLeave={() => onAgentHover(null)}
              >
                <div className="flex items-center gap-2.5">
                  {/* Color dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />

                  {/* Name + rank */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {agentName}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      #{state.rank} · {state.trades_count} trades
                    </p>
                  </div>

                  {/* Value */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-white font-medium tabular-nums">
                      $
                      {portfolioValue.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p
                      className={`text-[11px] tabular-nums ${pctOfTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {pctOfTotal.toFixed(1)}%
                    </p>
                  </div>

                  {/* Bet button on hover */}
                  {canBet && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openBetModal({
                          tournament_id: tournamentId,
                          tournament_name: tournament?.name,
                          agent_id: state.agent_id,
                          agent_name: agentName,
                          contract_tournament_id:
                            tournament?.contract_tournament_id ?? null,
                          contract_agent_id:
                            tournament?.agent_contract_mapping?.[
                              state.agent_id
                            ] ?? null,
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md hover:bg-emerald-500/30 transition-all"
                    >
                      Bet
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {displayedStates.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-zinc-500">No agents yet</p>
            </div>
          )}
        </div>

        {/* Total */}
        {totalValue > 0 && (
          <div className="px-3 py-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Total Value</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                $
                {totalValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Your Bets Accordion */}
      <div className="border-t border-white/5">
        <button
          onClick={() => setBetsOpen(!betsOpen)}
          className="w-full flex items-center justify-between px-3 py-3 hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Your Bets
            </span>
            {scopedBets.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 rounded-full">
                {scopedBets.length}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${betsOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {betsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-1.5 max-h-[240px] overflow-y-auto">
                {!isConnected ? (
                  <p className="text-xs text-zinc-500 py-2">
                    Connect wallet to view bets
                  </p>
                ) : !isAuthenticated ? (
                  <p className="text-xs text-zinc-500 py-2">
                    Sign in to view bets
                  </p>
                ) : isLoadingBets ? (
                  <p className="text-xs text-zinc-500 py-2">Loading...</p>
                ) : scopedBets.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-2">No bets placed</p>
                ) : (
                  scopedBets.map((bet) => {
                    const uiStatus = getBetUiStatus(bet);
                    const agentData = agentMap.get(String(bet.agent_id));
                    const agentName =
                      bet.agent_name || agentData?.name || 'Agent';
                    const StatusIcon =
                      uiStatus === 'won'
                        ? Trophy
                        : uiStatus === 'lost'
                          ? XCircle
                          : Clock;
                    const statusColor =
                      uiStatus === 'won'
                        ? 'text-emerald-400'
                        : uiStatus === 'lost'
                          ? 'text-red-400'
                          : 'text-cyan-400';

                    return (
                      <div
                        key={bet.id}
                        className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/[0.02]"
                      >
                        <StatusIcon
                          className={`w-3 h-3 flex-shrink-0 ${statusColor}`}
                        />
                        <span className="text-xs text-white truncate flex-1">
                          {agentName}
                        </span>
                        <span className="text-xs text-zinc-400 tabular-nums flex-shrink-0">
                          {bet.amount_eth || bet.amount || '0'} ETH
                        </span>
                      </div>
                    );
                  })
                )}

                {/* Claim Banner */}
                {isConnected &&
                  isAuthenticated &&
                  isTournamentSettled &&
                  contractTournamentId &&
                  scopedBets.length > 0 && (
                    <div className="mt-2">
                      {claimStatusLoading ? (
                        <p className="text-[11px] text-zinc-500">
                          Checking claim status...
                        </p>
                      ) : alreadyClaimed ? (
                        <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-500/10">
                          <Trophy className="w-3 h-3 text-emerald-400" />
                          <span className="text-[11px] text-emerald-400 font-medium">
                            Winnings claimed
                          </span>
                        </div>
                      ) : hasClaimable ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-emerald-500/10">
                            <div className="flex items-center gap-1.5">
                              <Gift className="w-3 h-3 text-emerald-400" />
                              <span className="text-[11px] text-emerald-400 font-medium">
                                Claimable
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-400">
                              {payoutEth} ETH
                            </span>
                          </div>
                          {wrongNetwork ? (
                            <button
                              onClick={() =>
                                switchChain({ chainId: AGONUS_CHAIN_ID })
                              }
                              disabled={isSwitching}
                              className="w-full py-1.5 text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/20 transition disabled:opacity-50"
                            >
                              {isSwitching ? 'Switching...' : 'Switch Network'}
                            </button>
                          ) : (
                            <button
                              onClick={handleClaim}
                              disabled={
                                claimState === 'confirming' ||
                                claimState === 'pending'
                              }
                              className="w-full py-1.5 text-[11px] font-semibold bg-emerald-500 text-black rounded-md hover:bg-emerald-400 transition disabled:opacity-50"
                            >
                              {claimState === 'confirming'
                                ? 'Confirm in Wallet...'
                                : claimState === 'pending'
                                  ? 'Claiming...'
                                  : 'Claim'}
                            </button>
                          )}
                          {claimState === 'error' && claimError && (
                            <p className="text-[10px] text-red-400">
                              {claimError}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 py-1">
                          No winnings to claim
                        </p>
                      )}
                    </div>
                  )}

                {/* Refresh */}
                {isConnected && isAuthenticated && (
                  <button
                    onClick={() => refreshMyBets(tournamentId)}
                    disabled={isLoadingBets}
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isLoadingBets ? 'animate-spin' : ''}`}
                    />
                    Refresh
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
