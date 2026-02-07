type AgentLike = { id: string | number };

export function findAgentById<T extends AgentLike>(
  agents: T[] | undefined,
  id: string | number
): T | undefined {
  if (!agents) return undefined;
  const idStr = String(id);
  return agents.find((agent) => String(agent.id) === idStr);
}
