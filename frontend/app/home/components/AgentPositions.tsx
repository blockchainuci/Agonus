"use client";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  PieChart,
  Sparkles,
  X,
  Brain,
  Activity,
  Clock,
  Target,
} from "lucide-react";
import { useTournamentAgentStates } from "@/src/hooks/useAgentStates";
import { useAgents } from "@/src/hooks/useAgents";
import { useTournament } from "@/src/hooks/useTournaments";
import { AgentState, Agent } from "@/src/types";
import { useBettingStore } from "@/src/store/useBettingStore";
import { useTournamentStore } from "@/src/store/useTournamentStore";
import { findAgentById } from "@/src/util/findAgentById";

const TOKEN_LOGOS: Record<string, string> = {
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  WETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  CBBTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  TBTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
  AVAX: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  LINK: "https://cryptologos.cc/logos/chainlink-link-logo.png",
  SUI: "https://cryptologos.cc/logos/sui-sui-logo.png",
  BNB: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  DOGE: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
  XRP: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
  TRX: "https://cryptologos.cc/logos/tron-trx-logo.png",
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
};

interface AgentPositionsProps {
  tournamentId: string;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string | null) => void;
}

interface SelectedAgentData {
  agentState: AgentState;
  agent: Agent | undefined;
  portfolioValue: number;
  percentOfTotal: number;
}

export default function AgentPositions({ tournamentId, selectedAgentId, onSelectAgent }: AgentPositionsProps) {
  const { data: agentStates, isLoading: statesLoading } =
    useTournamentAgentStates(tournamentId);
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: tournament } = useTournament(tournamentId);
  const openBetModal = useBettingStore((s) => s.openBetModal);
  const tournamentStatus = useTournamentStore(
    (s) => s.selectedTournamentStatus,
  );

  const isLoading = statesLoading || agentsLoading;

  const [selectedAgent, setSelectedAgent] = useState<SelectedAgentData | null>(
    null,
  );

  const hasLiveStates = agentStates && agentStates.length > 0;
  const mappedAgentIds = tournament?.agent_contract_mapping
    ? Object.keys(tournament.agent_contract_mapping)
    : [];
  const hasMappedAgents = mappedAgentIds.length > 0;

  const fallbackAgentStates: AgentState[] =
    !hasLiveStates && hasMappedAgents
      ? mappedAgentIds.map((agentId, idx) => ({
          agent_id: agentId,
          tournament_id: tournamentId,
          portfolio: {},
          portfolio_value_usd: "0",
          rank: idx + 1,
          trades_count: 0,
          last_decision: "Waiting to start trading",
          updated_at: new Date().toISOString(),
        }))
      : [];

  const displayedStates = hasLiveStates ? agentStates : fallbackAgentStates;
  const isFallback = !hasLiveStates && fallbackAgentStates.length > 0;

  const sortedStates = [...displayedStates].sort(
    (a, b) => (a.rank || 999) - (b.rank || 999),
  );

  const totalValue =
    sortedStates.reduce(
      (sum, state) => sum + parseFloat(state.portfolio_value_usd),
      0,
    ) || 0;

  const handleAgentClick = (
    agentState: AgentState,
    agent: Agent | undefined,
    portfolioValue: number,
    percentOfTotal: number,
  ) => {
    setSelectedAgent({ agentState, agent, portfolioValue, percentOfTotal });
  };

  const closeModal = useCallback(() => {
    setSelectedAgent(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedAgent) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAgent, closeModal]);

  return (
    <>
      <motion.div
        className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg p-4 md:p-6 min-h-[500px] md:h-full relative overflow-hidden flex flex-col"
        key={tournamentId}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Agent Positions</h3>
              <p className="text-xs text-gray-400">
                {tournament?.name || "Loading..."}
              </p>
            </div>
          </div>

          <motion.button
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PieChart className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>

        <div className="space-y-3 mb-6 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading agent data...</p>
            </div>
          ) : sortedStates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No agents for this tournament</p>
            </div>
          ) : (
            <>
              {isFallback && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-2">
                  <p className="text-xs text-blue-300">
                    Agents assigned but not yet trading. Data will update once
                    the tournament starts.
                  </p>
                </div>
              )}
              {sortedStates.map((agentState, index) => {
                const agent = findAgentById(agents, agentState.agent_id);
                const agentName = agent?.name || `Agent ${index + 1}`;
                const portfolioValue = parseFloat(
                  agentState.portfolio_value_usd,
                );
                const percentOfTotal =
                  totalValue > 0 ? (portfolioValue / totalValue) * 100 : 0;

                const holdings =
                  (
                    agentState.portfolio as {
                      holdings?: Record<string, number>;
                    }
                  )?.holdings || {};
                const portfolioEntries = Object.entries(holdings) as [
                  string,
                  number,
                ][];
                const topAsset =
                  portfolioEntries.length > 0
                    ? portfolioEntries.reduce((max, current) =>
                        current[1] > max[1] ? current : max,
                      )
                    : null;

                const isSelected = selectedAgentId === String(agentState.agent_id);

                return (
                  <motion.div
                    key={agentState.agent_id}
                    className={`rounded-xl p-4 border cursor-pointer group relative overflow-hidden transition-colors ${
                      isSelected
                        ? 'bg-[#FFD700]/10 border-[#FFD700]/40 ring-1 ring-[#FFD700]/30'
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => {
                      if (onSelectAgent) {
                        onSelectAgent(String(agentState.agent_id));
                      } else {
                        handleAgentClick(agentState, agent, portfolioValue, percentOfTotal);
                      }
                    }}
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FFD700]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden shadow-lg">
                            <img
                              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                                agentName,
                              )}`}
                              alt={agentName}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div>
                            <p className="font-bold text-white">{agentName}</p>
                            <p className="text-xs text-gray-400">
                              Rank #{agentState.rank} •{" "}
                              {agentState.trades_count} trades
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-white">
                            $
                            {portfolioValue.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <div className="flex items-center gap-1 text-xs justify-end text-gray-400">
                            {topAsset && <>Top: {topAsset[0]}</>}
                          </div>
                          {tournamentStatus === "LIVE" &&
                          !tournament?.betting_closed ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openBetModal({
                                  tournament_id: tournamentId,
                                  tournament_name: tournament?.name,
                                  agent_id: agentState.agent_id,
                                  agent_name: agentName,
                                  contract_tournament_id:
                                    tournament?.contract_tournament_id ?? null,
                                  contract_agent_id:
                                    tournament?.agent_contract_mapping?.[
                                      agentState.agent_id
                                    ] ?? null,
                                });
                              }}
                              className="mt-2 inline-flex items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition"
                            >
                              Place Bet
                            </button>
                          ) : (
                            <span
                              className={`mt-2 inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                tournamentStatus === "ENDED"
                                  ? "bg-red-500/10 border border-red-500/20 text-red-400"
                                  : tournament?.betting_closed
                                    ? "bg-orange-500/10 border border-orange-500/20 text-orange-400"
                                    : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {tournamentStatus === "ENDED"
                                ? "Tournament Ended"
                                : tournament?.betting_closed
                                  ? "Betting Closed"
                                  : "Betting Opens Soon"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">
                            Tournament share
                          </span>
                          <span className="text-[#FFD700] font-semibold">
                            {percentOfTotal.toFixed(1)}%
                          </span>
                        </div>

                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFC300] relative overflow-hidden"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentOfTotal}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          >
                            <div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                              style={{ animationDelay: `${index * 0.3}s` }}
                            />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>

        {sortedStates.length > 0 && !isFallback && (
          <div className="pt-6 border-t border-white/10 relative z-10">
            <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#FFC300]/5 rounded-xl p-4 border border-[#FFD700]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FFD700]" />
                  <span className="text-gray-300 text-sm font-medium">
                    Total Portfolio Value
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#FFD700]">
                    $
                    {totalValue.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {sortedStates.length} agents
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-30" />
      </motion.div>

      {selectedAgent &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[200] p-4"
              onClick={closeModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-gradient-to-br from-[#0a2540]/95 to-[#001D3D]/95 border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-[#FFD700]/5 to-transparent">
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/30 hover:border-red-500/50 flex items-center justify-center border border-white/20 transition-all duration-200 group"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                  </button>

                  <div className="flex items-center gap-4 pr-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden shadow-lg ring-2 ring-white/20">
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                          selectedAgent.agent?.name || "Agent",
                        )}`}
                        alt={selectedAgent.agent?.name || "Agent"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {selectedAgent.agent?.name || "Unknown Agent"}
                      </h2>
                      <p className="text-sm text-[#FFD700] font-medium">
                        Rank #{selectedAgent.agentState.rank}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {selectedAgent.agent?.strategy_type || "No strategy"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <div className="bg-gradient-to-r from-[#FFD700]/15 to-[#FFC300]/10 rounded-xl p-4 border border-[#FFD700]/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-5 h-5 text-[#FFD700]" />
                      <span className="text-sm text-gray-300">
                        Portfolio Value
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-[#FFD700]">
                      $
                      {selectedAgent.portfolioValue.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedAgent.percentOfTotal.toFixed(1)}% of tournament
                      total
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/8 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-gray-400">
                          Total Trades
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {selectedAgent.agentState.trades_count}
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/8 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-gray-400">Strategy</span>
                      </div>
                      <p className="text-lg font-bold text-white truncate capitalize">
                        {selectedAgent.agent?.strategy_type || "N/A"}
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const portfolio = selectedAgent.agentState.portfolio as {
                      holdings?: Record<string, number>;
                    };
                    const holdings = portfolio?.holdings || {};
                    const hasHoldings = Object.keys(holdings).length > 0;

                    if (!hasHoldings) return null;

                    return (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <PieChart className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-gray-300">
                            Holdings
                          </span>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(holdings).map(([asset, amount]) => {
                            const logoUrl = TOKEN_LOGOS[asset];
                            return (
                              <div
                                key={asset}
                                className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {logoUrl ? (
                                    <img
                                      src={logoUrl}
                                      alt={asset}
                                      className="w-7 h-7 rounded-full bg-white/10"
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-bold text-white">
                                      {asset.slice(0, 2)}
                                    </div>
                                  )}
                                  <span className="text-sm text-white font-medium">
                                    {asset}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-300 font-mono">
                                  {(amount as number).toLocaleString(
                                    undefined,
                                    {
                                      maximumFractionDigits: 4,
                                    },
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {selectedAgent.agent?.personality && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-gray-300">
                          Personality
                        </span>
                      </div>
                      <p className="text-sm text-white leading-relaxed">
                        {selectedAgent.agent.personality}
                      </p>
                    </div>
                  )}

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-300">
                        Last Decision
                      </span>
                    </div>
                    <p className="text-sm text-white leading-relaxed">
                      {selectedAgent.agentState.last_decision ||
                        "No decision recorded"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-white/5">
                    <Clock className="w-3 h-3" />
                    <span>
                      Last updated:{" "}
                      {new Date(
                        selectedAgent.agentState.updated_at,
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
