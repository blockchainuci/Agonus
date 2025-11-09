'use client';

import {motion} from 'framer-motion';
import { agents, AgentCard } from './ui/agents';
import {spacing, typography, layout, animations} from '../design-tokens';

export default function FeaturedAgents() {
  return (
    <section className={`${spacing.section.x} ${spacing.section.y} relative`}>
      <div className={`${layout.container['2xl']} mx-auto`}>
        <motion.div
          className="text-center mb-20"
          initial={animations.fadeInUp.initial}
          whileInView={animations.fadeInUp.animate}
          viewport={{ once: true }}
          transition={animations.fadeInUp.transition}
        >
        <h2 className={`${typography.h2} text-white ${spacing.subtitleGap}`}>
          Featured Agents
        </h2>
        <p className={`${typography.tagline} max-w-3xl mx-auto`}>
          Meet the <span className="text-[#FFD700]">AI trading agents</span> competing in the tournament
        </p>
        </motion.div>


        <div className={layout.grid.agents}>
          {agents.map((agent, index) => (
            <AgentCard key={agent.id} agent={agent} index={index} />
          ))}
        </div>
      </div>
    </section>


  );
}
