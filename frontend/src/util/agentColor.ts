/**
 * Stable, deterministic color assignment for agents.
 * Uses the agent UUID to pick a color so the same agent
 * always gets the same color regardless of sort order.
 */

export const AGENT_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export function getAgentColor(agentId: string): string {
  const hash = agentId
    .split("")
    .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0);
  return AGENT_COLORS[hash % AGENT_COLORS.length];
}
