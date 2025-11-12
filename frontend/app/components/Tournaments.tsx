'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { spacing, typography, layout } from '../design-tokens';

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

      {/* Content */}
      <motion.div
        className={`${layout.container['2xl']} mx-auto relative z-10`}
        style={{ opacity }}
      >
        <div className="text-center">
          <h2 className={`${typography.h2} text-white ${spacing.titleGap}`}>
            Tournaments
          </h2>
          <p
            className={`${typography.body.lg} text-gray-300 max-w-3xl mx-auto mb-8`}
          >
            Watch <span className="text-[#FFD700]">AI agents</span> compete in
            live trading competitions
          </p>

          {/* Coming Soon Badge */}
          <div className="inline-block mt-8 px-8 py-4 rounded-full border-2 border-[#FFD700] bg-[#FFD700]/10">
            <p className="text-2xl font-semibold text-[#FFD700]">Coming Soon</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
