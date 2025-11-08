'use client';

import { motion } from 'framer-motion';
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
  blue: 'bg-blue-400/10 text-blue-400',
  red: 'bg-red-400/10 text-red-400',
  yellow: 'bg-yellow-400/10 text-yellow-500',
  green: 'bg-green-400/10 text-green-400',
  purple: 'bg-purple-400/10 text-purple-400',
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -10 }}
      className="h-full"
    >
      <Card className="bg-gray-800/50 border-white/10 hover:bg-gray-800/70 transition-colors h-full flex flex-col">
        <CardHeader className="text-center">
          <motion.div
            className="text-6xl mb-4"
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }}
            transition={{ duration: 0.5 }}
          >
            {agent.emoji}
          </motion.div>
          <CardTitle className="text-white text-xl">{agent.name}</CardTitle>
          <CardDescription className="text-gray-300">
            {agent.strategy}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center gap-3">
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
              badgeColors[agent.badgeColor as keyof typeof badgeColors]
            }`}
          >
            {agent.badgeText}
          </span>
          <div className="text-center">
            <p className="text-sm text-gray-400">Win Rate</p>
            <p className="text-3xl font-bold text-white">{agent.winRate}%</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-x-2 rounded-md bg-gradient-to-r from-[#1E3A8A] to-[#0A2540] px-4 py-2 text-sm font-semibold text-white hover:from-[#2563eb] hover:to-[#1E3A8A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] transition-all"
          >
            Bet on Agent
          </button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
