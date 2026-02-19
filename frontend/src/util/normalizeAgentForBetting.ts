import type { AgentBet } from '@/src/types/AgentBet';

// Example: what your backend agent summary might look like
export interface BackendAgent {
  agent_id: number;
  tournament_id: number;
  name: string;
  personality: string;
  total_value: number;
  roi_percent: number;     // 0.12 = 12% up
  risk_score: number;      // 0–1
  win_rate: number;        // 0–1
  // ...any other backend fields from API
}

export function normalizeAgentForBetting(raw: BackendAgent): AgentBet {
  const portfolioValue = raw.total_value;
  const startingValue = 10000;   // or from backend if available
  const pnl = portfolioValue - startingValue;

  // For now, derive odds from ROI or win rate in a naive way.
  // Ali/Tucker will later replace this with contract-driven odds.
  const decimalOdds = 1 + Math.max(raw.roi_percent, 0.05); // very rough placeholder
  const fractionalOdds = '1/1'; // TODO: replace with real conversion

  return {
    id: String(raw.agent_id),
    tournamentId: String(raw.tournament_id),

    name: raw.name,
    personality: raw.personality,

    odds: decimalOdds,
    winRate: raw.win_rate * 100,
    portfolioValue,
    pnl,
    volatility: raw.risk_score * 100,

    // Optional fields
    oddsDecimal: decimalOdds,
    oddsFractional: fractionalOdds,
    minBetEth: '0.001',
  };
}
