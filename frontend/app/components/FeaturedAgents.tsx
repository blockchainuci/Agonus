'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { agents } from './ui/agents';
import { spacing, typography, layout, animations } from '../design-tokens';

// ⭐ Correct component import
import CenteredAgentCarousel from './CenteredAgentCarousel';

export default function FeaturedAgents() {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

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

        {/* ⭐ NEW Centered carousel */}
        <CenteredAgentCarousel items={agents} />
      </motion.div>
    </section>
  );
}
