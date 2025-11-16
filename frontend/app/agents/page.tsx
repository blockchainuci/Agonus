'use client';

import CenteredAgentCarousel from '../components/CenteredAgentCarousel';
import { agents } from '../components/ui/agents';

export default function AgentsPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center py-24 px-4">
      <h1 className="text-4xl font-bold text-white mb-12">Agents</h1>

      <CenteredAgentCarousel items={agents} />
    </main>
  );
}
