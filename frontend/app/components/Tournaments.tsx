'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { spacing, typography, layout, animations } from '../design-tokens';
import TournamentCarousel from './TournamentCarousel';
import { tournaments } from './ui/tournaments';

export default function Tournaments() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Parallax transforms
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section
      id="tournaments"
      ref={ref}
      className={`${spacing.section.x} ${spacing.section.y} relative overflow-hidden`}
    >
      {/* Background pattern that moves with parallax */}
      <motion.div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ y }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </motion.div>

      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <motion.div
        className={`${layout.container['2xl']} mx-auto relative z-10`}
        style={{ opacity }}
      >
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
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

        {/* Tournament Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <TournamentCarousel tournaments={tournaments} />
        </motion.div>

        {/* Additional Info */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-gray-400 text-sm">
            Set notifications to never miss a tournament.{' '}
            <span className="text-[#FFD700]">New competitions added weekly.</span>
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
