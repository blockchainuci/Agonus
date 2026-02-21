'use client';

import { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { spacing, typography, layout, animations } from '../design-tokens';
import TournamentCarousel from './TournamentCarousel';
import {
  tournaments as hardcodedTournaments,
  Tournament as CarouselTournament,
  TournamentAgent,
} from './ui/tournaments';
import { useTournaments } from '@/src/hooks/useTournaments';
import { useAgents } from '@/src/hooks/useAgents';
import { Tournament as ApiTournament, Agent as ApiAgent } from '@/src/types';

// ─────────────────────────────────────────────
// Module-level helpers — never recreated
// ─────────────────────────────────────────────

const EMOJIS = ['🤖', '🧠', '🎯', '⚡', '🛡️', '🔮', '🦊', '💎', '📊', '🏎️'] as const;

/** Map API lowercase status → carousel uppercase status */
function mapStatus(status: ApiTournament['status']): CarouselTournament['status'] {
  if (status === 'live') return 'LIVE';
  if (status === 'upcoming') return 'UPCOMING';
  return 'ENDED'; // 'completed'
}

/** Convert a real API tournament into the shape TournamentCarousel/TournamentCard expects */
function mapToCarouselTournament(
  t: ApiTournament,
  agents: ApiAgent[],
  index: number,
): CarouselTournament {
  const agentIds = Object.keys(t.agent_contract_mapping);

  const mappedAgents: TournamentAgent[] = agentIds.reduce<TournamentAgent[]>((acc, id, i) => {
    const agent = agents.find((a) => a.id === id);
    if (agent) {
      acc.push({
        id: i + 1,
        name: agent.name,
        emoji: EMOJIS[i % EMOJIS.length],
        strategy: agent.strategy_type.replace(/_/g, ' '),
        personality: agent.personality,
      });
    }
    return acc;
  }, []);

  return {
    id: index + 1,
    name: t.name,
    status: mapStatus(t.status),
    prize_pool_usd: parseFloat(t.prize_pool),
    start_time: t.start_date,
    end_time: t.end_date,
    participants: agentIds.length,
    max_participants: agentIds.length,
    agents: mappedAgents.length > 0 ? mappedAgents : undefined,
  };
}

// ─────────────────────────────────────────────
// Tournaments section
// ─────────────────────────────────────────────

export default function Tournaments() {
  const ref = useRef<HTMLElement>(null);
  const { data: apiTournaments, isLoading: tournamentsLoading } = useTournaments();
  const { data: agents } = useAgents();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const displayTournaments = useMemo<CarouselTournament[]>(() => {
    // No real data yet — fall back to hardcoded (excluding ENDED)
    if (!apiTournaments || apiTournaments.length === 0) {
      return hardcodedTournaments.filter((t) => t.status !== 'ENDED');
    }

    const agentsList = agents ?? [];

    return apiTournaments
      .filter((t) => t.status !== 'completed') // never show ended tournaments
      .map((t, i) => mapToCarouselTournament(t, agentsList, i));
  }, [apiTournaments, agents]);

  return (
    <section
      ref={ref}
      className={`${spacing.section.x} ${spacing.section.y} relative overflow-hidden`}
    >
      <motion.div
        className={`${layout.container['2xl']} mx-auto relative z-10`}
        style={{ opacity }}
      >
        {/* Heading */}
        <motion.div
          className="text-center mb-12"
          initial={animations.fadeInUp.initial}
          whileInView={animations.fadeInUp.animate}
          viewport={{ once: true }}
          transition={animations.fadeInUp.transition}
        >
          <h2 className={`${typography.h2} text-white ${spacing.subtitleGap}`}>
            Tournaments
          </h2>
          <p className={`${typography.tagline} max-w-3xl mx-auto`}>
            Watch <span className="text-[#FFD700]">AI agents</span> compete in
            live trading competitions
          </p>
        </motion.div>

        {/* Body */}
        {tournamentsLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayTournaments.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <TournamentCarousel tournaments={displayTournaments} />
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-400 text-lg">No active tournaments right now. Check back soon!</p>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
