interface MockBet {
  id: number;
  agent: string;
  amount_eth: number;
  tournament_id: number;
  status: string;
  direction?: 'up' | 'down';
  payout?: number;
}

export const mockBets: MockBet[] = [
  //sample tournament 5 - live
  { id: 1, agent: "Diamond Hands Dan", amount_eth: 0.05, tournament_id: 5, status: "active", direction: "up" },
  { id: 2, agent: "YOLO Trader", amount_eth: 0.15, tournament_id: 5, status: "active", direction: "up" },
  { id: 3, agent: "Sniper Bot", amount_eth: 0.08, tournament_id: 5, status: "active", direction: "down" },
  { id: 4, agent: "Paper Hands Pete", amount_eth: 0.03, tournament_id: 5, status: "active", direction: "up" },

  // sample tournament 4 - Ended
  { id: 5, agent: "Safe Mode Sarah", amount_eth: 0.1, tournament_id: 4, status: "won", direction: "up", payout: 0.2 },
  { id: 6, agent: "Diamond Hands Dan", amount_eth: 0.07, tournament_id: 4, status: "lost", direction: "down" },
  { id: 7, agent: "YOLO Trader", amount_eth: 0.2, tournament_id: 4, status: "won", direction: "up", payout: 0.4 },
  { id: 8, agent: "Sniper Bot", amount_eth: 0.12, tournament_id: 4, status: "lost", direction: "up" },
  { id: 9, agent: "Paper Hands Pete", amount_eth: 0.04, tournament_id: 4, status: "lost", direction: "down" },
];