// --- PRIMITIVES ---
export type ID = string; // UUID
export type ISODate = string; // ISO 8601 string
export type DecimalString = string; // Backend sends Decimals as strings to preserve precision

// --- ENUMS (Must match Python Enums) ---
export type TournamentStatus = "upcoming" | "live" | "completed";
export type TradeAction = "buy" | "sell" | "hold";

// --- CORE ENTITIES ---

export interface Agent {
  id: ID;
  name: string;
  personality: string;
  strategy_type: string;
  avatar_url?: string;
  stats: Record<string, any>; // Flexible JSON field
  memory: Record<string, any>; // Flexible JSON field
  created_at: ISODate;
}

// ** NEW ** - Required for Leaderboard & Live state
export interface AgentState {
  agent_id: ID;
  tournament_id: ID;
  portfolio: Record<string, number>; // Asset -> Quantity
  portfolio_value_usd: DecimalString;
  rank: number;
  trades_count: number;
  last_decision: string;
  updated_at: ISODate;
}

export interface Tournament {
  id: ID;
  name: string;
  status: TournamentStatus;
  start_date: ISODate;
  end_date: ISODate;
  prize_pool: DecimalString;
  winner_agent_id?: ID;

  // Critical for smart contract integration
  contract_tournament_id?: number;
  agent_contract_mapping: Record<string, number>; // { "agent_uuid": contract_id }

  created_at: ISODate;
}

export interface Trade {
  id: ID;
  agent_id: ID;
  tournament_id: ID;

  action: TradeAction;
  asset: string; // Renamed from 'token' to match backend
  amount: DecimalString; // Renamed from 'amountTotal'
  price: DecimalString; // Renamed from 'priceUSD'

  timestamp: ISODate;
}

export interface Bet {
  id: ID;
  user_address: string;
  tournament_id: ID;
  agent_id: ID;

  amount: DecimalString;
  odds: DecimalString;

  placed_at: ISODate;
  settled: boolean;
  payout?: DecimalString;
}

// --- API ERROR ---
export interface ApiError {
  message: string;
  detail?: string | any[]; // FastApi validation errors are arrays
  status?: number;
}

// --- DTOs (Data Transfer Objects for POST/PUT) ---

export interface CreateAgentData {
  name: string;
  personality: string;
  strategy_type: string;
  avatar_url?: string;
}

export interface UpdateAgentData extends Partial<CreateAgentData> {
  stats?: Record<string, any>;
}

export interface CreateTournamentData {
  name: string;
  start_date: ISODate;
  end_date: ISODate;
  prize_pool: number | string;
  agent_ids: ID[]; // List of agents to include
}

export interface UpdateTournamentData {
  name?: string;
  status?: TournamentStatus;
  winner_agent_id?: ID;
}

export interface CreateBetData {
  user_address: string; // The connect wallet address
  tournament_id: ID;
  agent_id: ID;
  amount: number | string;
  odds: number | string;
}

export interface UpdateBetData {
  settled?: boolean;
  payout?: number | string;
}

export interface UserBetsSummary {
  total_bets: number;
  active_bets: number;
  total_wagered: number;
  total_winnings: number;
  win_rate: number;
  bets: Bet[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// --- UTILITY TYPES ---

// Helper for UI components that need an Agent with their specific contract ID
export interface AgentWithContract extends Agent {
  contractId?: number;
}

