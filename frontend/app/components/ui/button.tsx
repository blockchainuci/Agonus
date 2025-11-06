'use client';

import { motion } from 'framer-motion';
import {components, animations} from '../../design-tokens';

export default function ButtonStyle() {
  return (
      <div className="flex flex-wrap gap-4 justify-center">
      <motion.button
        type="button"
        className={`${components.button.base} ${components.button.primary}`}
        whileHover={animations.hoverScale.whileHover}
        whileTap={{ scale: 0.95 }}
        initial={animations.fadeInUp.initial}
        animate={animations.fadeInUp.animate}
        transition={animations.fadeInUp.transition}
      >
        Watch Tournament
      </motion.button>
      <motion.button
        type="button"
        className={`${components.button.base} ${components.button.gold}`}
        whileHover={animations.hoverScale.whileHover}
        whileTap={{ scale: 0.95 }}
        initial={animations.fadeInUp.initial}
        animate={animations.fadeInUp.animate}
        transition={{ ...animations.fadeInUp.transition, delay: 0.2 }}
      >
        Connect Wallet
      </motion.button>
    </div>
  );
}
