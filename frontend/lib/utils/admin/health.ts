// Health monitoring utilities
import type { HealthStatus } from "@/types/admin";

// TODO: Get this from backend - hardcoded for now
export const DEFAULT_DECISION_INTERVAL_MINUTES = 5;

/**
 * Calculate agent health status based on last update time
 *
 * @param lastUpdate - ISO datetime string of last agent decision
 * @param intervalMinutes - How often agents should make decisions (default: 5)
 * @returns HealthStatus - "healthy", "slow", or "stuck"
 */
export function calculateHealthStatus(
  lastUpdate: string | Date,
  intervalMinutes: number = DEFAULT_DECISION_INTERVAL_MINUTES
): HealthStatus {
  const now = new Date();
  const lastUpdateDate = new Date(lastUpdate);
  const minutesSince = (now.getTime() - lastUpdateDate.getTime()) / 60000;

  // Thresholds based on decision interval
  const slowThreshold = intervalMinutes * 1.5;   // e.g., 7.5 min if interval is 5 min
  const stuckThreshold = intervalMinutes * 3;     // e.g., 15 min if interval is 5 min

  if (minutesSince > stuckThreshold) return "stuck";
  if (minutesSince > slowThreshold) return "slow";
  return "healthy";
}

/**
 * Get color for health status
 */
export function getHealthColor(status: HealthStatus): string {
  const colors = {
    healthy: "#10b981",  // Green
    slow: "#f59e0b",     // Yellow
    stuck: "#ef4444",    // Red
  };
  return colors[status];
}

/**
 * Get label for health status
 */
export function getHealthLabel(status: HealthStatus): string {
  const labels = {
    healthy: "Healthy",
    slow: "Slow",
    stuck: "STUCK",
  };
  return labels[status];
}

/**
 * Calculate minutes since last update
 */
export function getMinutesSince(lastUpdate: string | Date): number {
  const now = new Date();
  const lastUpdateDate = new Date(lastUpdate);
  return Math.round((now.getTime() - lastUpdateDate.getTime()) / 60000);
}

/**
 * Check if tournament has any stuck agents
 */
export function hasStuckAgents(agentStates: Array<{ updated_at: string }>): boolean {
  return agentStates.some(
    (state) => calculateHealthStatus(state.updated_at) === "stuck"
  );
}

/**
 * Get overall tournament health
 */
export function getOverallHealth(
  agentStates: Array<{ updated_at: string }>
): HealthStatus {
  if (agentStates.length === 0) return "healthy";

  const statuses = agentStates.map((state) =>
    calculateHealthStatus(state.updated_at)
  );

  if (statuses.some((s) => s === "stuck")) return "stuck";
  if (statuses.some((s) => s === "slow")) return "slow";
  return "healthy";
}
