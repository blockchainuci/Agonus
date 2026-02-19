// Admin Console TypeScript Types
// Based on verified SQLAlchemy models

// ============================================
// ENUMS
// ============================================

export enum TournamentStatus {
  UPCOMING = "upcoming",
  LIVE = "live",
  COMPLETED = "completed"
}

export enum TradeAction {
  BUY = "buy",
  SELL = "sell",
  HOLD = "hold"
}

export type HealthStatus = "healthy" | "slow" | "stuck";

// ============================================
// CORE DATA MODELS
// ============================================

export interface Tournament {
  // Core fields (REQUIRED)
  id: string;                           // UUID
  name: string;
  status: TournamentStatus;
  start_date: string;                   // ISO datetime
  end_date: string;                     // ISO datetime
  prize_pool: string;                   // Decimal as string
  created_at: string;                   // ISO datetime

  // Optional fields
  winner_agent_id: string | null;
  winner_agent?: Agent;                 // Joined data
}

export interface Agent {
  id: string;                           // UUID
  name: string;
  personality: string;
  strategy_type: string;
  avatar_url: string | null;
  stats: AgentStats;
  memory?: Record<string, unknown>;     // DO NOT DISPLAY
  created_at: string;                   // ISO datetime
}

export interface AgentStats {
  total_tournaments?: number;
  wins?: number;
  win_rate?: number;                    // 0.0 to 1.0
  avg_rank?: number;
  total_trades?: number;
}

export interface AgentState {
  // Composite primary key
  agent_id: string;                     // UUID
  tournament_id: string;                // UUID

  // Performance data
  portfolio: Record<string, number>;    // {"USD": 5000, "BTC": 0.5}
  portfolio_value_usd: string;          // Decimal as string
  rank: number;
  trades_count: number;
  last_decision: string;
  updated_at: string;                   // ISO datetime - CRITICAL for health

  // Joined data (populated by backend or frontend)
  agent?: Agent;
}

export interface Trade {
  id: string;                           // UUID
  agent_id: string;
  tournament_id: string;
  action: TradeAction;
  asset: string;                        // "BTC", "ETH", "SOL"
  amount: string;                       // Decimal as string
  price: string;                        // Decimal as string
  timestamp: string;                    // ISO datetime

  // Joined data
  agent?: Agent;
}

export interface Bet {
  id: string;
  user_address: string;
  agent_id: string;
  tournament_id: string;
  amount: string;
  odds: string;
  placed_at: string;
  settled: boolean;
  payout: string | null;
}

// ============================================
// FORM DATA TYPES
// ============================================

export interface CreateTournamentData {
  name: string;
  start_date: string;
  end_date: string;
  prize_pool: string;
  agent_ids: string[];                  // Selected agent IDs
}

export interface UpdateTournamentData {
  name?: string;
  start_date?: string;
  end_date?: string;
  prize_pool?: string;
}

// ============================================
// UI-SPECIFIC TYPES
// ============================================

export interface AgentHealthInfo {
  agentId: string;
  agentName: string;
  status: HealthStatus;
  lastUpdate: string;
  minutesSince: number;
  lastDecision: string;
}

export interface TournamentWithMetrics extends Tournament {
  agent_count: number;
  trade_count: number;
  overall_health: HealthStatus;
  last_activity: string | null;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  detail?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}
