export type BetStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SETTLED"
  | "CANCELED"
  | "FAILED";

export type Bet = {
  id: string;
  tournament_id: string | number;
  agent_id: string | number;
  agent_name?: string | null;
  user_address?: string;

  // Backend returns these fields
  amount: string | number;
  odds: string | number;
  placed_at: string;
  settled: boolean;
  payout?: string | number | null;

  // Legacy/compatibility fields
  amount_eth?: string;
  tx_hash?: string | null;
  status?: BetStatus;
  created_at?: string;
};

export type CreateBetRequest = {
  tournament_id: string | number;
  agent_id: string | number;
  amount_eth?: string;
  amount?: string | number;
  odds?: string | number;
  user_address?: string;
  tx_hash?: string;
};
