'use client';

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { components, animations, typography } from "../../design-tokens";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";

export interface Agent {
  id: string;
  name: string;
  type: string;
  personality: string;
  risk_score: number;
  total_value: number;
  cash: number;
  holdings_value: number;
  roi_percent: number;
  num_trades: number;
  win_rate: number; // 0–1 from backend
}

// Convert 0–1 → badge
function getRiskBadge(score: number) {
  if (score >= 0.75)
    return { text: "High Risk", class: "bg-red-500/10 text-red-400 ring-red-500/30" };
  if (score >= 0.45)
    return { text: "Medium Risk", class: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/30" };
  return { text: "Low Risk", class: "bg-green-500/10 text-green-400 ring-green-500/30" };
}

// Convert "NeuralNetTrader" → "Neural Net Trader"
function formatType(type: string) {
  return type.replace(/([A-Z])/g, " $1").trim();
}

export function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const risk = getRiskBadge(agent.risk_score);
  const winRatePct = agent.win_rate * 100;

  return (
    <motion.div
      initial={animations.fadeInUp.initial}
      animate={animations.fadeInUp.animate}
      transition={{ ...animations.fadeInUp.transition, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className={`${components.card.strong} h-full flex flex-col relative`}>

        {/* HEADER */}
        <CardHeader className="text-center">
          <CardTitle className={`${typography.h4} text-white`}>
            {agent.name}
          </CardTitle>

          <CardDescription className="text-gray-300 mt-1 capitalize">
            {formatType(agent.type)}
          </CardDescription>

          <span
            className={`inline-flex items-center mt-4 px-4 py-1.5 rounded-full text-sm font-medium ring-1 ${risk.class}`}
          >
            {risk.text}
          </span>
        </CardHeader>

        {/* MAIN */}
        <CardContent className="flex-1 flex flex-col items-center space-y-8 mt-4">

          {/* ROI */}
          <div className="text-center">
            <p className="text-gray-400 uppercase text-xs tracking-wide">ROI</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p
                className={`${typography.h3} font-bold ${
                  agent.roi_percent >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {agent.roi_percent.toFixed(1)}%
              </p>
              {agent.roi_percent >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-400" />
              )}
            </div>
          </div>

          {/* Win Rate Bar */}
          <div className="w-full text-center">
            <p className="text-gray-400 uppercase text-xs tracking-wide">Win Rate</p>

            <p className={`${typography.h3} text-white font-bold mt-1`}>
              {winRatePct.toFixed(0)}%
            </p>

            <div className="w-full bg-white/5 rounded-full h-2 mt-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FFD700] to-[#d4af37] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${winRatePct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="w-full grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-xs">Total Value</p>
              <p className="text-white font-semibold">
                ${agent.total_value.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs">Cash</p>
              <p className="text-white font-semibold">
                ${agent.cash.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs">Holdings</p>
              <p className="text-white font-semibold">
                ${agent.holdings_value.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs">Trades</p>
              <p className="text-white font-semibold">
                {agent.num_trades}
              </p>
            </div>
          </div>
        </CardContent>

        {/* FOOTER */}
        <CardFooter className="flex justify-center pb-6">
          <motion.button
            className="w-full px-8 py-3 rounded-xl text-lg font-semibold 
                       bg-gradient-to-r from-[#FFD700] to-[#d4af37]
                       text-[#0A2540] shadow-md hover:shadow-lg
                       transition-all duration-300"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Bet on Agent
          </motion.button>
        </CardFooter>

      </Card>
    </motion.div>
  );
}
