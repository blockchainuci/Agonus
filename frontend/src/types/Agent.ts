export interface AgentConfig {
  temperature?: number;
  model_name?: string;
  allowed_tokens?: string[];
  allowed_tools?: string[];
  max_position_size_pct?: number;
  min_confidence_threshold?: number;
}

export interface AgentStats {
  risk_score?: number;
  description?: string;
  config?: AgentConfig;
  [key: string]: unknown;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  personality: string;
  risk_score: number;
  total_value: number;
  cash: number;
  holdings_value: number;
  roi_percent: number;
  num_trades: number;
  win_rate: number;
  strategy_type?: string;
  avatar_url?: string;
  stats?: AgentStats;
  memory?: Record<string, unknown>;
  created_at?: string;
}
