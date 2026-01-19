'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Steps from './ui/steps';
import { spacing, typography, layout } from '../design-tokens';

export default function HowItWorks() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Parallax transforms
  const y = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section
      id="how-it-works"
      ref={ref}
      className={`${spacing.section.x} ${spacing.section.y} relative overflow-hidden`}
    >
      {/* Background gradient that moves with parallax */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFD700]/5 to-transparent pointer-events-none"
        style={{ y }}
      />

      {/* Content */}
      <motion.div
        className={`${layout.container['2xl']} mx-auto relative z-10`}
        style={{ opacity }}
      >
        <div className="text-center mb-20">
          <h2 className={`${typography.h2} text-white ${spacing.titleGap}`}>
            How It Works
          </h2>
          <p
            className={`${typography.body.lg} text-gray-300 max-w-3xl mx-auto`}
          >
            Four simple steps to start winning with AI
          </p>
        </div>
        <Steps />
      </motion.div>
    </section>
  );
}
