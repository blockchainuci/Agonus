'use client';

import { motion } from 'framer-motion';

export type Agent = {
  id: string | number;
  name?: string;
  imageUrl?: string | null;
  [key: string]: any;
};

export const agents: Agent[] = [
  { id: 1, name: 'Diamond Hands Dan', imageUrl: null },
  { id: 2, name: 'Paper Hands Pete', imageUrl: null },
  { id: 3, name: 'YOLO Trader', imageUrl: null },
];

export function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const hasImage = Boolean(agent?.imageUrl);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ scale: 1.05, y: -8 }}
      className="rounded-lg bg-[#0B1730] border border-[#243B6B] p-4 text-white shadow-[0_0_8px_rgba(255,215,0,0.1)] hover:shadow-[0_0_16px_rgba(255,215,0,0.3)] transition-all"
    >
      <div className="aspect-video w-full rounded-md mb-3 overflow-hidden bg-gray-800 flex items-center justify-center">
        {hasImage ? (
          <motion.img
            src={agent.imageUrl as string}
            alt={agent.name ?? `Agent ${index + 1}`}
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <span className="text-gray-400 text-sm">No image yet</span>
        )}
      </div>
      <div className="font-semibold text-lg text-[#FFD700]">{agent.name}</div>
    </motion.div>
  );
}
