'use client';

import { motion } from 'framer-motion';
import {Play, Wallet} from 'lucide-react'
import {components, animations} from '../../design-tokens';

export default function ButtonStyle() {
  return (
      <div className="flex flex-wrap gap-4 justify-center">
      <motion.button
        type="button"
        className={`${components.button.base} ${components.button.primary} text-white`}
        whileHover={animations.hoverScale.whileHover}
        whileTap={{ scale: 0.95 }}
        initial={animations.fadeInUp.initial}
        animate={animations.fadeInUp.animate}
        transition={{...animations.fadeInUp.transition, delay: 0.4}}
      >
        <Play className="w-6 h-6 " />
        Watch Tournament
      </motion.button>
      <motion.button
        type="button"
        className={`${components.button.base} ${components.button.gold}`}
        whileHover={{y: -4}}
        whileTap={{ scale: 0.98 }}
        initial={animations.fadeInUp.initial}
        animate={animations.fadeInUp.animate}
        transition={{ ...animations.fadeInUp.transition, delay: 0.2 }}
      >
        <Wallet className="w-6 h-6" />
        Connect Wallet
      </motion.button>
    </div>
  );
}
