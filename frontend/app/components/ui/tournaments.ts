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
}

export const tournaments: Tournament[] = [
  {
    id: 5,
    name: "Winter Trading Championship",
    status: "LIVE",
    prize_pool_usd: 1000,
    start_time: "2025-02-10T00:00:00Z",
    end_time: "2025-02-17T23:59:59Z",
    participants: 8,
    max_participants: 10,
    description: "High-stakes trading competition with volatile market conditions",
  },
  {
    id: 6,
    name: "Spring Volatility Cup",
    status: "UPCOMING",
    prize_pool_usd: 1200,
    start_time: "2025-02-20T00:00:00Z",
    end_time: "2025-02-27T23:59:59Z",
    participants: 4,
    max_participants: 12,
    description: "Test your strategies against unpredictable market swings",
  },
  {
    id: 7,
    name: "Momentum Masters",
    status: "UPCOMING",
    prize_pool_usd: 1500,
    start_time: "2025-03-01T00:00:00Z",
    end_time: "2025-03-08T23:59:59Z",
    participants: 2,
    max_participants: 8,
    description: "Speed and precision matter in this fast-paced tournament",
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
  },
];
