'use client';

import { motion } from 'framer-motion';
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
  },
  {
    id: 2,
    name: 'Paper Hands Pete',
    emoji: '😰',
    strategy: 'Sells at first sign of trouble',
    winRate: 62,
    badgeColor: 'red',
    badgeText: 'Quick Exit',
  },
  {
    id: 3,
    name: 'YOLO Trader',
    emoji: '🎲',
    strategy: 'All-in on risky bets',
    winRate: 78,
    badgeColor: 'yellow',
    badgeText: 'High Risk',
  },
  {
    id: 4,
    name: 'Safe Mode Sarah',
    emoji: '🛡️',
    strategy: 'Conservative, plays it safe',
    winRate: 71,
    badgeColor: 'green',
    badgeText: 'Low Risk',
  },
  {
    id: 5,
    name: 'Sniper Bot',
    emoji: '🎯',
    strategy: 'Waits for perfect moment to strike',
    winRate: 92,
    badgeColor: 'purple',
    badgeText: 'Precise',
  },
];

const badgeColors = {
  blue: 'bg-blue-400/10 text-blue-400 border border-blue-400/20',
  red: 'bg-red-400/10 text-red-400 border border-red-400/20',
  yellow: 'bg-yellow-400/10 text-yellow-500 border border-yellow-400/20',
  green: 'bg-green-400/10 text-green-400 border border-green-400/20',
  purple: 'bg-purple-400/10 text-purple-400 border border-purple-400/20',
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
      viewport={{ once: true }}
      transition={{ ...animations.fadeInUp.transition, delay: index * 0.1 }}
      whileHover={animations.hoverLift.whileHover}
      className="h-full"
    >
      <Card className={`${components.card.base} ${components.card.hover} h-full flex flex-col`}>
        <CardHeader className="text-center">
          <motion.div
            className="text-6xl mb-4"
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }}
            transition={{ duration: 0.5 }}
          >
            {agent.emoji}
          </motion.div>
          <CardTitle className={`${typography.h4} text-white`}>
            {agent.name}
          </CardTitle>
          <CardDescription className={`${typography.body.sm} text-gray-300`}>
            {agent.strategy}
          </CardDescription>
        </CardHeader>
        <CardContent className={`flex-1 flex flex-col items-center ${spacing.content.sm}`}>
          <span
            className={`inline-flex items-center ${effects.rounded.base} px-3 py-1 ${typography.label} ${
              badgeColors[agent.badgeColor as keyof typeof badgeColors]
            }`}
          >
            {agent.badgeText}
          </span>
          <div className="text-center">
            <p className={`${typography.body.sm} text-gray-400`}>Win Rate</p>
            <p className={`${typography.h3} text-white`}>{agent.winRate}%</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <button
            type="button"
            className={`${components.button.base} ${components.button.gold}`}
          >
            Bet on Agent
          </button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
