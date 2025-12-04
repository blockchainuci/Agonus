// Final normalized agent passed into BetModal
export interface AgentBet {
  // Identity
  id: string;
  tournamentId: string;   // comes from backend agent.tournament_id (converted to string)

  // Display metadata
  name: string;
  personality: string;

  // Values required for betting UI
  odds: number;            // computed in frontend
  winRate: number;         // agent.win_rate * 100
  portfolioValue: number;  // agent.total_value
  pnl: number;             // computed: portfolioValue - 10000
  volatility: number;      // risk_score * 100

  // Optional fields (BetModal will ignore if not needed)
  rank?: number;
  avatar_url?: string;
}
