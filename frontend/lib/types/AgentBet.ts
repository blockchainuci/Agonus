import { Agent } from '@/src/types';

export interface AgentBet extends Agent {
  // tournament linkage for Zustand filtering later
  tournamentId: string;    

  // Betting UI fields
  winRate: number;
  portfolioValue: number;
  odds: number;

  // Optional extended stats
  rank?: number;
  pnl?: number;
  volatility?: number;

  // UI-only content
  quote?: string;
}
