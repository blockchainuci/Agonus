'use client';

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { useTournamentStore } from "@/src/store/useTournamentStore";
import Tooltip from "@/app/components/ui/Tooltip";

import type { Agent } from "@/src/types/Agent";
import type { AgentBet } from "@/src/types/AgentBet";

/* ------------------------------------------------------
   NORMALIZER — Convert backend Agent → AgentBet
------------------------------------------------------- */
function normalizeAgent(agent: Agent): AgentBet {
  const selectedTournamentId =
    useTournamentStore.getState().selectedTournamentId;

  return {
    id: agent.id,
    name: agent.name,
    personality: agent.personality,
    tournamentId: String(selectedTournamentId),

    winRate: agent.win_rate * 100,
    portfolioValue: agent.total_value,
    pnl: agent.total_value - 10000,
    volatility: agent.risk_score * 100,
    odds: Number((1 + agent.risk_score).toFixed(2)),
  };
}

/* ------------------------------------------------------
   COMPONENT PROPS
------------------------------------------------------- */
interface AgentCardProps {
  agent: Agent;
  rank: number;           // <-- NEW: pass rank from parent list
  totalAgents: number;
  forceExpand?: boolean;
}

export default function AgentCard({
  agent,
  rank,
  totalAgents,
  forceExpand,
}: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const openBetModal = useTournamentStore((s) => s.openBetModal);

  useEffect(() => {
    if (forceExpand !== undefined) setExpanded(forceExpand);
  }, [forceExpand]);

  const modalAgent = normalizeAgent(agent);

  const winRatePct = modalAgent.winRate.toFixed(1);
  const roiPct = agent.roi_percent.toFixed(2);

  return (
    <div
      className={`rounded-xl p-5 border cursor-pointer transition-all duration-300
      ${expanded ? "bg-[#0a0f1f] border-blue-400/40" : "bg-[#111827] border-white/10"}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* ---------- HEADER ---------- */}
      <div className="flex items-start justify-between">

        {/* LEFT SIDE: Rank / Name / Portfolio */}
        <div>
          {/* Rank Badge */}
          <div className="mb-1">
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-600/40 text-blue-200 font-semibold">
              Rank #{rank}
            </span>
          </div>

          <p className="text-lg font-semibold text-blue-300">{agent.name}</p>

          <p className="text-gray-400 text-sm">
            Portfolio: ${modalAgent.portfolioValue.toLocaleString()}
          </p>

          <p className="text-gray-400 text-sm">
            Win rate: {winRatePct}%
          </p>
        </div>

        {/* RIGHT SIDE: Odds / Bet Button / Expand */}
        <div className="flex flex-col items-end">
          {/* Odds */}
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-lg font-bold">
              {modalAgent.odds}x
            </span>
            <Tooltip content={<p>Payout multiplier if this agent wins.</p>}>
              <span className="cursor-help text-gray-400">ⓘ</span>
            </Tooltip>
          </div>

          {/* Bet Button */}
          <button
            className="mt-2 px-3 py-1.5 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400"
            onClick={(e) => {
              e.stopPropagation();
              openBetModal(modalAgent);
            }}
          >
            Bet on Agent
          </button>

          {/* Expand / Collapse */}
          <button
            className="text-gray-300 mt-2 flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <>
                Collapse <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                Expand <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ---------- EXPANDED SECTION ---------- */}
      {expanded && (
        <div className="mt-5 pt-5 border-t border-white/10 space-y-5 animate-fadeInUp">

          {/* Personality */}
          <p className="text-gray-300">
            <span className="font-semibold text-white">Personality:</span>{" "}
            {agent.personality}
          </p>

          {/* GRID METRICS */}
          <div className="grid grid-cols-2 gap-4 text-gray-300">

            {/* ROI */}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white">ROI:</span> {roiPct}%
              <Tooltip content={<p>Return relative to starting balance.</p>}>
                <span className="cursor-help text-gray-400">ⓘ</span>
              </Tooltip>
            </div>

            {/* P&L */}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white">P&L:</span> $
              {modalAgent.pnl.toLocaleString()}
              <Tooltip content={<p>Profit or loss from the $10,000 baseline.</p>}>
                <span className="cursor-help text-gray-400">ⓘ</span>
              </Tooltip>
            </div>

            {/* Trades */}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white">Trades:</span>{" "}
              {agent.num_trades}
              <Tooltip content={<p>Total number of executed trades.</p>}>
                <span className="cursor-help text-gray-400">ⓘ</span>
              </Tooltip>
            </div>

            {/* Volatility */}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white">Volatility:</span>{" "}
              {modalAgent.volatility.toFixed(1)}%
              <Tooltip content={<p>Higher volatility means larger swings.</p>}>
                <span className="cursor-help text-gray-400">ⓘ</span>
              </Tooltip>
            </div>

            {/* NEW: Win Rate in expanded grid for consistency */}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white">Win Rate:</span>{" "}
              {winRatePct}%
              <Tooltip content={<p>Percentage of profitable trades.</p>}>
                <span className="cursor-help text-gray-400">ⓘ</span>
              </Tooltip>
            </div>

            {/* NEW: Odds inside expanded grid also (optional duplicate display) */}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white">Odds:</span>{" "}
              {modalAgent.odds}x
              <Tooltip content={<p>Payout multiplier if this agent wins.</p>}>
                <span className="cursor-help text-gray-400">ⓘ</span>
              </Tooltip>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
