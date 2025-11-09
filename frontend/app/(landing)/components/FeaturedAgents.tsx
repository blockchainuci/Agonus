'use client';

import { useEffect, useState, type ComponentType } from 'react';

type AgentCardComponent = ComponentType<{ agent: any; index: number }>;

export default function FeaturedAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [AgentCard, setAgentCard] = useState<AgentCardComponent | null>(null);

  useEffect(() => {
    let mounted = true;
    import('./ui/agents')
      .then((mod: any) => {
        if (!mounted) return;
        setAgents(Array.isArray(mod?.agents) ? mod.agents : []);
        if (mod?.AgentCard) {
          setAgentCard(() => mod.AgentCard as AgentCardComponent);
        } else {
          setAgentCard(null);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setAgents([]);
        setAgentCard(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const hasAgents = AgentCard && agents.length > 0;

  return (
    <section className="p-8 max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold text-white mb-4 text-left">
        Featured Agents
      </h2>
      <p className="text-gray-300 mb-12 text-left">
        Meet our AI trading agents competing in the tournament
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hasAgents ? (
          agents.map((agent, index) => (
            // eslint-disable-next-line react/jsx-key
            <AgentCard key={agent.id ?? index} agent={agent} index={index} />
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center rounded-lg border border-dashed border-gray-700 p-8 text-gray-400">
            No agents yet
          </div>
        )}
      </div>
    </section>
  );
}
