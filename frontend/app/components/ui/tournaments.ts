export interface TournamentAgent {
  id: number;
  name: string;
  emoji: string;
  strategy?: string;
  personality?: string;
}

export interface Tournament {
  id: number;
  name: string;
  status: 'LIVE' | 'UPCOMING' | 'ENDED';
  prize_pool_usd: number;
  start_time: string;
  end_time: string;
  participants: number;
  max_participants: number;
  description?: string;
  agents?: TournamentAgent[];
}

export const tournaments: Tournament[] = [
  {
    id: 5,
    name: "Winter Trading Championship",
    status: "LIVE",
    prize_pool_usd: 1000,
    start_time: "2026-01-20T00:00:00Z",
    end_time: "2026-01-28T23:59:59Z",
    participants: 8,
    max_participants: 10,
    description: "High-stakes trading competition with volatile market conditions",
    agents: [
      { id: 1, name: "AlphaBot", emoji: "🤖" },
      { id: 2, name: "TrendHunter", emoji: "🦊" },
      { id: 3, name: "WhaleWatch", emoji: "🐋" },
      { id: 4, name: "MomentumX", emoji: "⚡" },
      { id: 5, name: "DeepValue", emoji: "💎" },
    ],
  },
  {
    id: 6,
    name: "Spring Volatility Cup",
    status: "UPCOMING",
    prize_pool_usd: 1200,
    start_time: "2026-02-02T00:00:00Z",
    end_time: "2026-02-09T23:59:59Z",
    participants: 4,
    max_participants: 12,
    description: "Test your strategies against unpredictable market swings",
    agents: [
      { id: 6, name: "SwingTrader", emoji: "🎯" },
      { id: 7, name: "VolBot", emoji: "📊" },
      { id: 8, name: "RiskMaster", emoji: "🛡️" },
      { id: 9, name: "SpeedDemon", emoji: "🏎️" },
    ],
  },
  {
    id: 7,
    name: "Momentum Masters",
    status: "UPCOMING",
    prize_pool_usd: 1500,
    start_time: "2026-02-15T00:00:00Z",
    end_time: "2026-02-22T23:59:59Z",
    participants: 2,
    max_participants: 8,
    description: "Speed and precision matter in this fast-paced tournament",
    agents: [
      { id: 10, name: "FlashTrader", emoji: "⚡" },
      { id: 11, name: "QuickSilver", emoji: "🥈" },
    ],
  },
  {
    id: 4,
    name: "February Showdown",
    status: "ENDED",
    prize_pool_usd: 800,
    start_time: "2025-02-01T00:00:00Z",
    end_time: "2025-02-10T23:59:59Z",
    participants: 10,
    max_participants: 10,
    description: "Completed tournament with fierce competition",
    agents: [
      { id: 12, name: "Champion", emoji: "🏆" },
      { id: 13, name: "SilverStar", emoji: "⭐" },
      { id: 14, name: "BronzeBeast", emoji: "🥉" },
    ],
  },
];
