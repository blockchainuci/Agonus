'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { agents } from './ui/agents';
import { spacing, typography, layout, animations } from '../design-tokens';
import { useAgents } from '@/src/hooks/useAgents';
import { useTournaments } from '@/src/hooks/useTournaments';
import { Agent as ApiAgent } from '@/src/types';
import { ChevronLeft, ChevronRight, Trophy, TrendingUp, Calendar, Zap, Brain } from 'lucide-react';
import CenteredAgentCarousel from './CenteredAgentCarousel';

// ─────────────────────────────────────────────
// Module-level helpers — never recreated
// ─────────────────────────────────────────────

const AUTOROTATE_MS = 8000;

function deriveRiskLabel(strategyType: string): string {
  const s = strategyType.toLowerCase();
  if (s.includes('aggressive') || s.includes('high') || s.includes('yolo')) return 'High Risk';
  if (s.includes('conservative') || s.includes('safe') || s.includes('low')) return 'Low Risk';
  if (s.includes('momentum') || s.includes('trend')) return 'Trend Follower';
  if (s.includes('arbitrage') || s.includes('market_making')) return 'Market Maker';
  if (s.includes('mean_reversion') || s.includes('mean')) return 'Mean Reversion';
  return 'Balanced';
}

function formatMonthYear(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Split "momentum_trader" → ["Momentum", "Trader"]
function strategyTags(strategyType: string): string[] {
  return strategyType
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

// ─────────────────────────────────────────────
// RealAgentCard — only renders sections w/ data
// ─────────────────────────────────────────────

interface RealAgentCardProps {
  agent: ApiAgent;
  competitionCount: number;
  index: number;
}

function RealAgentCard({ agent, competitionCount, index }: RealAgentCardProps) {
  const rawWinRate = agent.stats.win_rate;
  const winRate = typeof rawWinRate === 'number' ? Math.round(rawWinRate * 100) : null;

  const rawTotalTrades = agent.stats.total_trades;
  const totalTrades = typeof rawTotalTrades === 'number' ? rawTotalTrades : null;

  const riskLabel = deriveRiskLabel(agent.strategy_type);
  const tags = strategyTags(agent.strategy_type);

  return (
    <motion.div
      initial={animations.fadeInUp.initial}
      whileInView={animations.fadeInUp.animate}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ ...animations.fadeInUp.transition, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <div className="rounded-2xl bg-[#0A2540]/90 border-2 border-white/20 shadow-xl h-full overflow-hidden">
        <div className="p-6 space-y-5">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-center md:gap-5 gap-3">
            <div className="w-16 h-16 md:w-14 md:h-14 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 overflow-hidden shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- DiceBear serves SVGs; next/image doesn't optimise SVG from external domains */}
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agent.name)}`}
                alt={agent.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white leading-tight">{agent.name}</h3>
              <p className="text-sm text-gray-300 mt-1 line-clamp-2">{agent.personality}</p>
            </div>
            <span className="self-start md:self-center shrink-0 inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold bg-[#FFD700]/10 text-[#FFD700] ring-1 ring-[#FFD700]/30 whitespace-nowrap">
              {agent.strategy_type.replace(/_/g, ' ')}
            </span>
          </div>

          {/* ── Win Rate (conditional) ── */}
          {winRate !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Win Rate</p>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-white font-bold text-lg">{winRate}%</span>
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden ring-1 ring-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FFD700] to-[#d4af37] rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${winRate}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.08 + 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* ── Stats Grid — always has data ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Competitions — always derivable */}
            <div className="rounded-xl bg-purple-500/10 border border-purple-400/30 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="w-3.5 h-3.5 text-purple-300" />
                <p className="text-[11px] text-purple-200/80 uppercase tracking-wider">Competitions</p>
              </div>
              <p className="text-lg font-bold text-white">{competitionCount}</p>
            </div>

            {/* Active Since — always from created_at */}
            <div className="rounded-xl bg-blue-500/10 border border-blue-400/30 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-300" />
                <p className="text-[11px] text-blue-200/80 uppercase tracking-wider">Active Since</p>
              </div>
              <p className="text-sm font-bold text-white">{formatMonthYear(agent.created_at)}</p>
            </div>

            {/* Total Trades (conditional) */}
            {totalTrades !== null && (
              <div className="rounded-xl bg-cyan-500/10 border border-cyan-400/30 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  <p className="text-[11px] text-cyan-200/80 uppercase tracking-wider">Total Trades</p>
                </div>
                <p className="text-lg font-bold text-white">{totalTrades.toLocaleString()}</p>
              </div>
            )}

            {/* Risk Profile — always derivable */}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Brain className="w-3.5 h-3.5 text-emerald-300" />
                <p className="text-[11px] text-emerald-200/80 uppercase tracking-wider">Risk Profile</p>
              </div>
              <p className="text-sm font-bold text-white">{riskLabel}</p>
            </div>
          </div>

          {/* ── Strategy Tags — always from strategy_type ── */}
          {tags.length > 0 && (
            <div>
              <p className="text-xs text-purple-300/80 uppercase tracking-wider mb-2">Strategy</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-purple-500/10 border border-purple-400/30 px-3 py-1 text-sm text-purple-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// RealAgentCarousel — same pattern as CenteredAgentCarousel
// ─────────────────────────────────────────────

interface RealAgentCarouselProps {
  items: ApiAgent[];
  competitionCounts: Record<string, number>;
}

function RealAgentCarousel({ items, competitionCounts }: RealAgentCarouselProps) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const goNextRef = useRef<() => void>(() => {});

  const goNext = useCallback(() => {
    setActive((prev) => {
      startRef.current = performance.now();
      lastUpdateRef.current = 0;
      setProgress(0);
      return (prev + 1) % items.length;
    });
  }, [items.length]);

  const goPrev = useCallback(() => {
    setActive((prev) => {
      startRef.current = performance.now();
      lastUpdateRef.current = 0;
      setProgress(0);
      return (prev - 1 + items.length) % items.length;
    });
  }, [items.length]);

  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);

  // Auto-rotate via rAF — throttled to ~10fps state updates
  useEffect(() => {
    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const pct = Math.min(elapsed / AUTOROTATE_MS, 1);
      if (now - lastUpdateRef.current > 100 || pct >= 1) {
        lastUpdateRef.current = now;
        setProgress(pct * 100);
      }
      if (pct < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        goNextRef.current();
      }
    };
    startRef.current = performance.now();
    lastUpdateRef.current = 0;
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [active]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  const agent = items[active];

  return (
    <div className="flex flex-col items-center gap-12 w-full px-4 mx-auto">
      {/* Card */}
      <div className="max-w-[720px] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <RealAgentCard
              agent={agent}
              competitionCount={competitionCounts[agent.id] ?? 0}
              index={active}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xl flex items-center justify-center gap-6">
        <button
          onClick={goPrev}
          aria-label="Previous agent"
          className="p-3 rounded-full border border-white/10 hover:border-yellow-400 transition-all bg-white/5 hover:bg-white/10"
        >
          <ChevronLeft className="w-6 h-6 text-gray-300 hover:text-yellow-400" />
        </button>

        <div className="flex flex-col items-center flex-1">
          <span className="text-gray-200 font-semibold text-base mb-2">{agent.name}</span>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2, ease: 'linear' }}
            />
          </div>
        </div>

        <button
          onClick={goNext}
          aria-label="Next agent"
          className="p-3 rounded-full border border-white/10 hover:border-yellow-400 transition-all bg-white/5 hover:bg-white/10"
        >
          <ChevronRight className="w-6 h-6 text-gray-300 hover:text-yellow-400" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FeaturedAgents — main export
// ─────────────────────────────────────────────

export default function FeaturedAgents() {
  const ref = useRef<HTMLElement>(null);
  const { data: realAgents, isLoading: agentsLoading } = useAgents();
  const { data: tournaments } = useTournaments();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // agentId → number of tournaments that include them
  const competitionCounts = useMemo<Record<string, number>>(() => {
    if (!tournaments) return {};
    const counts: Record<string, number> = {};
    for (const t of tournaments) {
      for (const id of Object.keys(t.agent_contract_mapping)) {
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }
    return counts;
  }, [tournaments]);

  return (
    <section
      ref={ref}
      className={`${spacing.section.x} ${spacing.section.y} relative overflow-hidden`}
    >
      <motion.div
        className={`${layout.container['2xl']} mx-auto relative z-10`}
        style={{ opacity }}
      >
        <motion.div
          className="text-center mb-20"
          initial={animations.fadeInUp.initial}
          whileInView={animations.fadeInUp.animate}
          viewport={{ once: true }}
          transition={animations.fadeInUp.transition}
        >
          <h2 className={`${typography.h2} text-white ${spacing.subtitleGap}`}>
            Featured Agents
          </h2>
          <p className={`${typography.tagline} max-w-3xl mx-auto`}>
            Meet the <span className="text-[#FFD700]">AI trading agents</span>{' '}
            competing in the tournament
          </p>
        </motion.div>

        {agentsLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : realAgents && realAgents.length > 0 ? (
          <RealAgentCarousel items={realAgents} competitionCounts={competitionCounts} />
        ) : (
          <CenteredAgentCarousel items={agents} />
        )}
      </motion.div>
    </section>
  );
}
