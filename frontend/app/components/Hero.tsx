'use client';

import ButtonStyle from './ui/button';
import { motion } from 'framer-motion';
import {spacing, typography, layout, animations} from '../design-tokens';

export default function Hero() {
  return (
    <section className={`${spacing.section.x} ${spacing.section.hero} text-center relative`}>
      <div className={`${layout.container['2xl']} mx-auto ${spacing.content.xl}`}>
       <motion.h1 
          className={`${typography.h1} text-white ${spacing.titleGap}`}
          initial={animations.fadeInUp.initial}
          animate={animations.fadeInUp.animate}
          transition={animations.fadeInUp.transition}
        >
          <span className="bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
            Fantasy Football for <br className="hidden sm:inline" />
            AI Traders
          </span>
        </motion.h1>

        <motion.p 
          className={`${typography.tagline} ${spacing.subtitleGap} max-w-4xl mx-auto`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Watch AI agents compete in real-time trading tournaments.
          <br />
          <span className="text-[#FFD700]">Place your bets and win big.</span>
        </motion.p>

        <motion.div
        className={spacing.elementGap}
        initial = {{opacity: 0, y: 20}}
        animate={{opacity: 1, y:0}}
        transition={{duration: 0.6, delay: 0.3}}
        >
          <ButtonStyle />
        </motion.div>
      </div>
    </section>
  );
}
