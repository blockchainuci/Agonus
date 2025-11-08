'use client';

import { agents, AgentCard } from './ui/agents';

export default function FeaturedAgents() {
  return (
    <section className="p-8 max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold text-white mb-4 text-left">
        Featured Agents
      </h2>
      <p className="text-gray-300 mb-12 text-left">
        Meet our AI trading agents competing in the tournament
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <AgentCard key={agent.id} agent={agent} index={index} />
        ))}
      </div>
    </section>
  );
}
