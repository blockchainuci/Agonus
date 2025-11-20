export const mockTournaments = [
  {
    id: 5,
    status: "LIVE" as const,
    prize_pool_usd: 1000,
    end_time: "2025-02-17T23:59:59Z",
  },
  {
    id: 4,
    status: "ENDED" as const,
    prize_pool_usd: 800,
    end_time: "2025-02-10T23:59:59Z",
  },
  {
    id: 6,
    status: "UPCOMING" as const,
    prize_pool_usd: 1200,
    end_time: "2025-02-24T23:59:59Z",
  },
];

export const mockTournament = mockTournaments[0];