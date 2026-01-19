'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {components, animations, typography, spacing, effects} from '../../design-tokens';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

export const agents = [
  {
    id: 1,
    name: 'Diamond Hands Dan',
    emoji: '🤖',
    strategy: 'Never sells, only buys dips',
    winRate: 85,
    badgeColor: 'blue',
    badgeText: 'Passive Investor',
    trend: 'up',
  },
  {
    id: 2,
    name: 'Paper Hands Pete',
    emoji: '😰',
    strategy: 'Sells at first sign of trouble',
    winRate: 62,
    badgeColor: 'red',
    badgeText: 'Quick Exit',
    trend: 'down',
  },
  {
    id: 3,
    name: 'YOLO Trader',
    emoji: '🎲',
    strategy: 'All-in on risky bets',
    winRate: 78,
    badgeColor: 'yellow',
    badgeText: 'High Risk',
    trend: 'up',
  },
  {
    id: 4,
    name: 'Safe Mode Sarah',
    emoji: '🛡️',
    strategy: 'Conservative, plays it safe',
    winRate: 71,
    badgeColor: 'green',
    badgeText: 'Low Risk',
    trend: 'up',
  },
  {
    id: 5,
    name: 'Sniper Bot',
    emoji: '🎯',
    strategy: 'Waits for perfect moment to strike',
    winRate: 92,
    badgeColor: 'purple',
    badgeText: 'Precise',
    trend: 'up',
  },
];

export type Agent = (typeof agents)[number];

const badgeColors = {
  blue: 'bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/30',
  red: 'bg-red-400/10 text-red-400 ring-1 ring-red-400/30',
  yellow: 'bg-yellow-400/10 text-yellow-500 ring-1 ring-yellow-400/30',
  green: 'bg-green-400/10 text-green-400 ring-1 ring-green-400/30',
  purple: 'bg-purple-400/10 text-purple-400 ring-1 ring-purple-400/30',
};

export function AgentCard({
  agent,
  index,
}: {
  agent: (typeof agents)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={animations.fadeInUp.initial}
      whileInView={animations.fadeInUp.animate}
      viewport={{ once: true , margin: '-50px'}}
      transition={{ ...animations.fadeInUp.transition, delay: index * 0.08 }}
      whileHover={{y:-4}}
      className="h-full"
    >
      <Card className={`${components.card.strong} h-full flex flex-col relative overflow-hidden`}>
        <CardHeader className="text-center relative">
          <div className="text-7xl mb-6">
            {agent.emoji}
          </div>
          
          <CardTitle className={`${typography.h4} text-white`}>
            {agent.name}
          </CardTitle>
          <CardDescription className={`${typography.body.sm} text-gray-300 mt-3`}>
            {agent.strategy}
          </CardDescription>
        </CardHeader>

        <CardContent className={`flex-1 flex flex-col items-center ${spacing.content.sm}`}>
          <span
            className={`inline-flex items-center ${effects.rounded.base} px-4 py-2 ${typography.label} ${
              badgeColors[agent.badgeColor as keyof typeof badgeColors]
            }`}
          >
            {agent.badgeText}
          </span>

          
          <div className="text-center space-y-3 w-full">
            <p className={`${typography.body.sm} text-gray-400 uppercase tracking-wider`}>Win Rate</p>
            <div className="flex items-center justify-center gap-3">
              <p className={`${typography.h3} text-white font-bold`}>{agent.winRate}%</p>
              {agent.trend === 'up' ? (
                <TrendingUp className="w-6 h-6 text-green-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-400" />
              )}
            </div>

           <div className="w-full bg-white/5 backdrop-blur-sm rounded-full h-2.5 overflow-hidden ring-1 ring-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FFD700] to-[#d4af37] rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: `${agent.winRate}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.08 + 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center pb-8">
          <motion.button
            type="button"
            className={`w-full inline-flex items-center justify-center gap-x-2 rounded-xl px-8 py-4 text-lg font-semibold bg-gradient-to-r from-[#FFD700] to-[#d4af37] text-[#0A2540] ring-2 ring-[#FFD700] ring-offset-2 ring-offset-transparent shadow-[0_4px_16px_rgba(255,215,0,0.15)] transition-all duration-300 ease-out focus-visible:outline-none relative overflow-hidden
                       before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Bet on Agent
          </motion.button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
