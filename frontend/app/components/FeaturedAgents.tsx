'use client';

import { agents, AgentCard } from './ui/agents';
import {spacing, typography, layout} from '../design-tokens';

export default function FeaturedAgents() {
  return (
    <section className={`${spacing.section.all} ${spacing.sectionGap}`}>
      <div className={`${layout.container['2xl']} mx-auto`}>
        <h2 className={`${typography.h2} text-white ${spacing.subtitleGap}`}>
          Featured Agents
        </h2>
        <p className={`${typography.tagline} ${spacing.titleGap}`}>
          Meet our AI trading agents competing in the tournament
        </p>
        <div className={layout.grid.agents}>
          {agents.map((agent, index) => (
            <AgentCard key={agent.id} agent={agent} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
