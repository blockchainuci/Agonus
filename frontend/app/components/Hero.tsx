'use client';

import ButtonStyle from './ui/button';
import { motion } from 'framer-motion';
import {spacing, typography, layout, animations} from '../design-tokens';

export default function Hero() {
  return (
    <section className="px-8 sm:px-12 lg:px-16 xl:px-20 pt-10 sm:pt-14 lg:pt-16 xl:pt-20 pb-20 sm:pb-24 lg:pb-32 xl:pb-36 text-center relative">
      <div className={`${layout.container['2xl']} mx-auto ${spacing.content.xl}`}>
       
       <motion.div
          className="mb-8 sm:mb-20 lg:mb-24"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-9xl sm:text-[10rem] lg:text-[13rem]  font-bold text-[#FFD700] mb-8 leading-none">
            Agonus
          </h1>
          <p className="text-sm sm:text-base text-gray-400 tracking-widest uppercase">
            Developed by Blockchain @ UCI
          </p>
        </motion.div>

       <motion.h1 
          className={`${typography.h2} text-white ${spacing.titleGap}`}
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
          transition={{ duration: 0.6, delay: 0.35 }}
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
