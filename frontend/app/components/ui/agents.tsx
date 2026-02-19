'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { animations, typography, effects } from '../../design-tokens';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card';

export const agents = [
  {
    id: 1,
    name: 'Diamond Hands Dan',
    emoji: '🤖',
    strategy: 'Never sells, only buys dips',
    winRate: 85,
    badgeColor: 'blue',
    badgeText: 'Passive Investor',
    trend: 'up',
    risk: 'Low',
    avgHold: '14d',
    focus: 'BTC/ETH',
    playstyle: ['Momentum', 'Long Bias'],
    recentForm: { streak: 'W4', pnl7d: '+6.2%', drawdown: '-2.1%' },
    metrics: { win: '85%', avgTrade: '+0.8%', vol: 'Med' },
  },
  {
    id: 2,
    name: 'Paper Hands Pete',
    emoji: '😰',
    strategy: 'Sells at first sign of trouble',
    winRate: 62,
    badgeColor: 'red',
    badgeText: 'Quick Exit',
    trend: 'down',
    risk: 'Med',
    avgHold: '2h',
    focus: 'ALT',
    playstyle: ['Scalper', 'Risk-Off'],
    recentForm: { streak: 'L2', pnl7d: '-1.4%', drawdown: '-5.0%' },
    metrics: { win: '62%', avgTrade: '+0.3%', vol: 'High' },
  },
  {
    id: 3,
    name: 'YOLO Trader',
    emoji: '🎲',
    strategy: 'All-in on risky bets',
    winRate: 78,
    badgeColor: 'yellow',
    badgeText: 'High Risk',
    trend: 'up',
    risk: 'High',
    avgHold: '6h',
    focus: 'Memes',
    playstyle: ['YOLO', 'Volatility'],
    recentForm: { streak: 'W2', pnl7d: '+4.8%', drawdown: '-7.4%' },
    metrics: { win: '78%', avgTrade: '+1.6%', vol: 'High' },
  },
  {
    id: 4,
    name: 'Safe Mode Sarah',
    emoji: '🛡️',
    strategy: 'Conservative, plays it safe',
    winRate: 71,
    badgeColor: 'green',
    badgeText: 'Low Risk',
    trend: 'up',
    risk: 'Low',
    avgHold: '9d',
    focus: 'ETH',
    playstyle: ['Mean Reversion', 'Low Vol'],
    recentForm: { streak: 'W6', pnl7d: '+3.1%', drawdown: '-1.2%' },
    metrics: { win: '71%', avgTrade: '+0.4%', vol: 'Low' },
  },
  {
    id: 5,
    name: 'Sniper Bot',
    emoji: '🎯',
    strategy: 'Waits for perfect moment to strike',
    winRate: 92,
    badgeColor: 'purple',
    badgeText: 'Precise',
    trend: 'up',
    risk: 'Med',
    avgHold: '1d',
    focus: 'SOL',
    playstyle: ['Sniper', 'Breakouts'],
    recentForm: { streak: 'W5', pnl7d: '+7.9%', drawdown: '-3.3%' },
    metrics: { win: '92%', avgTrade: '+1.1%', vol: 'Med' },
  },
];

export type Agent = (typeof agents)[number];

const badgeColors = {
  blue: 'bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/30',
  red: 'bg-red-400/10 text-red-400 ring-1 ring-red-400/30',
  yellow: 'bg-yellow-400/10 text-yellow-500 ring-1 ring-yellow-400/30',
  green: 'bg-green-400/10 text-green-400 ring-1 ring-green-400/30',
  purple: 'bg-purple-400/10 text-purple-400 ring-1 ring-purple-400/30',
};

const getValueTone = (value?: string) => {
  if (!value) return 'text-white';
  if (value.startsWith('-') || value.startsWith('L')) return 'text-red-300';
  if (value.startsWith('+') || value.startsWith('W')) return 'text-green-300';
  return 'text-white';
};

const sectionTooltips = {
  recentForm: {
    title: 'Recent Form',
    body: 'Snapshot of short-term performance: streak, 7-day PnL, and drawdown.',
  },
  playstyle: {
    title: 'Playstyle',
    body: 'High-level behavior tags that describe how the agent trades.',
  },
  keyMetrics: {
    title: 'Key Metrics',
    body: 'Core stats used to compare agents at a glance.',
  },
  streak: {
    title: 'Streak',
    body: 'Current win/loss run. W = wins, L = losses.',
  },
  pnl7d: {
    title: '7d PnL',
    body: 'Net percentage change over the last 7 days.',
  },
  drawdown: {
    title: 'Drawdown',
    body: 'Largest peak-to-trough decline in the recent period.',
  },
  win: {
    title: 'Win',
    body: 'Percent of profitable trades.',
  },
  avgTrade: {
    title: 'Avg Trade',
    body: 'Average return per trade.',
  },
  volatility: {
    title: 'Volatility',
    body: 'How much returns vary; higher means more risk.',
  },
};

export function AgentCard({
  agent,
  index,
}: {
  agent: (typeof agents)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={animations.fadeInUp.initial}
      whileInView={animations.fadeInUp.animate}
      viewport={{ once: true , margin: '-50px'}}
      transition={{ ...animations.fadeInUp.transition, delay: index * 0.08 }}
      whileHover={{y:-4}}
      className="h-full"
    >
      <Card className={`${effects.rounded.xl} bg-[#0A2540]/90 border-2 border-white/20 ${effects.shadow.lg} h-full relative overflow-hidden`}>
        <div className="p-6 space-y-5">
          {/* Header row: icon + name + short desc + strategy */}
          <CardHeader className="p-0">
            <div className="flex flex-col md:flex-row md:items-center md:gap-6 gap-3">
              <div className="text-6xl md:text-5xl shrink-0">{agent.emoji}</div>
              <div className="flex-1 min-w-0">
                <CardTitle className={`${typography.h4} text-white`}>
                  {agent.name}
                </CardTitle>
                <CardDescription className={`${typography.body.sm} text-gray-300 mt-1`}>
                  {agent.strategy}
                </CardDescription>
              </div>
              <span
                className={`inline-flex items-center ${effects.rounded.base} px-4 py-2 ${typography.label} ${
                  badgeColors[agent.badgeColor as keyof typeof badgeColors]
                }`}
              >
                {agent.badgeText}
              </span>
            </div>
          </CardHeader>

          {/* Win rate */}
          <CardContent className="p-0">
            <div className="space-y-3">
              <p className={`${typography.body.sm} text-gray-400 uppercase tracking-wider`}>Win Rate</p>
              <div className="flex items-center gap-3">
                <p className={`${typography.h3} text-white font-bold`}>{agent.winRate}%</p>
                {agent.trend === 'up' ? (
                  <TrendingUp className="w-6 h-6 text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-400" />
                )}
              </div>
              <div className="w-full bg-white/5 backdrop-blur-sm rounded-full h-2.5 overflow-hidden ring-1 ring-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FFD700] to-[#d4af37] rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${agent.winRate}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.08 + 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          </CardContent>

          <div className="w-full space-y-4">
            {/* Recent Form */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs md:text-sm text-emerald-300/80 uppercase tracking-wider">Recent Form</p>
                <div className="relative group">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-emerald-400/40 text-emerald-200/80 text-[10px]">i</span>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-20">
                    <div className="rounded-xl px-3 py-2 bg-[#0A2540]/95 border border-emerald-400/30 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                      <p className="text-xs font-semibold text-emerald-200">{sectionTooltips.recentForm.title}</p>
                      <p className="text-[11px] text-gray-300 mt-1">{sectionTooltips.recentForm.body}</p>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-emerald-400/30" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/30 px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-[11px] md:text-xs text-emerald-200/80 uppercase tracking-wider">Streak</p>
                    <div className="relative group">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-emerald-400/40 text-emerald-200/80 text-[9px]">i</span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-20">
                        <div className="rounded-xl px-3 py-2 bg-[#0A2540]/95 border border-emerald-400/30 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                          <p className="text-xs font-semibold text-emerald-200">{sectionTooltips.streak.title}</p>
                          <p className="text-[11px] text-gray-300 mt-1">{sectionTooltips.streak.body}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                    <p className={`text-base font-semibold ${getValueTone(agent.recentForm?.streak)}`}>{agent.recentForm?.streak}</p>
                </div>
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/30 px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-[11px] md:text-xs text-emerald-200/80 uppercase tracking-wider">7d PnL</p>
                    <div className="relative group">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-emerald-400/40 text-emerald-200/80 text-[9px]">i</span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-20">
                        <div className="rounded-xl px-3 py-2 bg-[#0A2540]/95 border border-emerald-400/30 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                          <p className="text-xs font-semibold text-emerald-200">{sectionTooltips.pnl7d.title}</p>
                          <p className="text-[11px] text-gray-300 mt-1">{sectionTooltips.pnl7d.body}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                    <p className={`text-base font-semibold ${getValueTone(agent.recentForm?.pnl7d)}`}>{agent.recentForm?.pnl7d}</p>
                </div>
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/30 px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-[11px] md:text-xs text-emerald-200/80 uppercase tracking-wider">Drawdown</p>
                    <div className="relative group">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-emerald-400/40 text-emerald-200/80 text-[9px]">i</span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-20">
                        <div className="rounded-xl px-3 py-2 bg-[#0A2540]/95 border border-emerald-400/30 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                          <p className="text-xs font-semibold text-emerald-200">{sectionTooltips.drawdown.title}</p>
                          <p className="text-[11px] text-gray-300 mt-1">{sectionTooltips.drawdown.body}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                    <p className={`text-base font-semibold ${getValueTone(agent.recentForm?.drawdown)}`}>{agent.recentForm?.drawdown}</p>
                </div>
              </div>
            </div>

            {/* Playstyle */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs md:text-sm text-purple-300/80 uppercase tracking-wider">Playstyle</p>
                <div className="relative group">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-purple-400/40 text-purple-200/80 text-[10px]">i</span>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-20">
                    <div className="rounded-xl px-3 py-2 bg-[#0A2540]/95 border border-purple-400/30 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                      <p className="text-xs font-semibold text-purple-200">{sectionTooltips.playstyle.title}</p>
                      <p className="text-[11px] text-gray-300 mt-1">{sectionTooltips.playstyle.body}</p>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-purple-400/30" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {agent.playstyle?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-purple-500/10 border border-purple-400/30 px-3 py-1 text-sm text-purple-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs md:text-sm text-cyan-300/80 uppercase tracking-wider">Key Metrics</p>
                <div className="relative group">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-cyan-400/40 text-cyan-200/80 text-[10px]">i</span>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-20">
                    <div className="rounded-xl px-3 py-2 bg-[#0A2540]/95 border border-cyan-400/30 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                      <p className="text-xs font-semibold text-cyan-200">{sectionTooltips.keyMetrics.title}</p>
                      <p className="text-[11px] text-gray-300 mt-1">{sectionTooltips.keyMetrics.body}</p>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-cyan-400/30" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-cyan-500/10 border border-cyan-400/30 px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-[11px] md:text-xs text-cyan-200/80 uppercase tracking-wider">Win</p>
                    <div className="relative group">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-cyan-400/40 text-cyan-200/80 text-[9px]">i</span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-20">
                        <div className="rounded-xl px-3 py-2 bg-[#0A2540]/95 border border-cyan-400/30 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                          <p className="text-xs font-semibold text-cyan-200">{sectionTooltips.win.title}</p>
                          <p className="text-[11px] text-gray-300 mt-1">{sectionTooltips.win.body}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                    <p className="text-base text-white font-semibold">{agent.metrics?.win}</p>
                </div>
                <div className="rounded-lg bg-cyan-500/10 border border-cyan-400/30 px-2 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-[11px] md:text-xs text-cyan-200/80 uppercase tracking-wider">Avg Trade</p>
                    <div className="relative group">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-cyan-400/40 text-cyan-200/80 text-[9px]">i</span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-20">
                        <div className="rounded-xl px-3 py-2 bg-[#0A2540]/95 border border-cyan-400/30 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                          <p className="text-xs font-semibold text-cyan-200">{sectionTooltips.avgTrade.title}</p>
                          <p className="text-[11px] text-gray-300 mt-1">{sectionTooltips.avgTrade.body}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-base text-white font-semibold">{agent.metrics?.avgTrade}</p>
                </div>
                <div className="rounded-lg bg-cyan-500/10 border border-cyan-400/30 px-2 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-[11px] md:text-xs text-cyan-200/80 uppercase tracking-wider">Volatility</p>
                    <div className="relative group">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-cyan-400/40 text-cyan-200/80 text-[9px]">i</span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-20">
                        <div className="rounded-xl px-3 py-2 bg-[#0A2540]/95 border border-cyan-400/30 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                          <p className="text-xs font-semibold text-cyan-200">{sectionTooltips.volatility.title}</p>
                          <p className="text-[11px] text-gray-300 mt-1">{sectionTooltips.volatility.body}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-base text-white font-semibold">{agent.metrics?.vol}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
