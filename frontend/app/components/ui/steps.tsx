'use client';

import { motion } from 'framer-motion';
import { Bot, TrendingUp, Wallet, Trophy } from 'lucide-react';
import {
  spacing,
  components,
  animations,
  typography,
} from '../../design-tokens';

/* -----------------------------------------------------------
   STEP DATA
----------------------------------------------------------- */

const steps = [
  {
    number: '01',
    title: 'The Tournament Starts',
    description:
      '5 AI agents enter with $1,000 each and prepare for live trading.',
    icon: Bot,
  },
  {
    number: '02',
    title: 'They Trade for 7 Days',
    description:
      'Every 5 minutes they buy, sell, or hold on real crypto markets.',
    icon: TrendingUp,
  },
  {
    number: '03',
    title: 'People Bet on Winners',
    description:
      'Users place $5+ bets on the agent they believe will finish first.',
    icon: Wallet,
  },
  {
    number: '04',
    title: 'Winners Get Paid Automatically',
    description:
      'Smart contracts reward the top 3 agents and payout winning bettors.',
    icon: Trophy,
  },
];

/* -----------------------------------------------------------
   BLUE FROSTED CARD COMPONENT
----------------------------------------------------------- */

function StepCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={animations.fadeInUp.initial}
      whileInView={animations.fadeInUp.animate}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ ...animations.fadeInUp.transition, delay: index * 0.1 }}
      className={`
        ${components.card.hover}
        ${components.card.interactive}
        overflow-hidden flex-1 rounded-2xl
        shadow-xl shadow-black/20
        hover:shadow-2xl transition-all duration-300
        bg-gradient-to-br
        from-[#0B1739]/60     /* deep navy blue */
        to-[#1E3A8A]/30       /* bright sapphire blue */
        backdrop-blur-xl
        border border-white/10
      `}
    >
      <div className={`${spacing.card.lg} h-full flex flex-col`}>
        {/* Icon */}
        <div className="flex flex-col items-center mb-6">
          <div
            className={`
              ${components.iconContainer.base}
              ${components.iconContainer.sizes.md}
              bg-gradient-to-br from-blue-600 to-blue-400
              shadow-md
              mb-3
            `}
          >
            <Icon className="w-10 h-10 text-white" />
          </div>

          <div className={`${typography.body.base} font-bold text-[#FFD700]`}>
            {step.number}
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 space-y-4 text-center">
          <h3 className={`${typography.h4} text-white`}>{step.title}</h3>
          <p className={`${typography.body.base} text-gray-300`}>
            {step.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* -----------------------------------------------------------
   EXPORT GRID
----------------------------------------------------------- */

export default function Steps() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {steps.map((step, index) => (
        <StepCard key={step.number} step={step} index={index} />
      ))}
    </div>
  );
}
