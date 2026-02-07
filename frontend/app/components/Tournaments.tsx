'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { spacing, typography, layout, animations } from '../design-tokens';
import TournamentCarousel from './TournamentCarousel';
import { tournaments } from './ui/tournaments';

export default function Tournaments() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Filter out ended tournaments for carousel, or show all
  const activeTournaments = tournaments.filter(t => t.status !== 'ENDED');
  const displayTournaments = activeTournaments.length > 0 ? activeTournaments : tournaments;

  return (
    <section
      ref={ref}
      className={`${spacing.section.x} ${spacing.section.y} relative overflow-hidden`}
    >
      {/* Content */}
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

        {/* Tournament Carousel - shows remaining tournaments */}
        {displayTournaments.length > 1 && (
          <>
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
      
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <TournamentCarousel tournaments={displayTournaments} />
            </motion.div>
          </>
        )}

      </motion.div>
    </section>
  );
}
