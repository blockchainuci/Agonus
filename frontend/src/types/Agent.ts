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
}
