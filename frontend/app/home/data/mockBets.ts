import type { Bet } from "@/app/home/components/ActiveBets";

export const mockBets: Bet[] = [
  {
    id: "101",
    tournament_id: "5",
    user_address: "0x123",
    agent_id: "1",
    direction: "up",
    amount: 0.25,
    settled: false,
    payout: null,
    created_at: "2025-02-01T10:00:00Z",
  },
  {
    id: "102",
    tournament_id: "5",
    user_address: "0x123",
    agent_id: "2",
    direction: "down",
    amount: 0.15,
    settled: false,
    payout: null,
    created_at: "2025-02-01T10:05:00Z",
  },
  {
    id: "103",
    tournament_id: "5",
    user_address: "0x123",
    agent_id: "3",
    direction: "up",
    amount: 0.32,
    settled: false,
    payout: null,
    created_at: "2025-02-01T10:10:00Z",
  },
  {
    id: "104",
    tournament_id: "5",
    user_address: "0x123",
    agent_id: "1",
    direction: "up",
    amount: 0.20,
    settled: true,
    payout: 0.4,
    created_at: "2025-01-28T14:00:00Z",
  },
  {
    id: "105",
    tournament_id: "5",
    user_address: "0x123",
    agent_id: "2",
    direction: "down",
    amount: 0.18,
    settled: true,
    payout: 0,
    created_at: "2025-01-29T09:30:00Z",
  },
  {
    id: "201",
    tournament_id: "4",
    user_address: "0x123",
    agent_id: "10",       // WINNER (Rank 1)
    direction: "up",
    amount: 0.20,
    settled: true,
    payout: 0.45,         // user can claim
    created_at: "2025-01-10T08:00:00Z",
  },

  {
    id: "202",
    tournament_id: "4",
    user_address: "0x123",
    agent_id: "12",       // WINNER (Rank 3), already claimed
    direction: "up",
    amount: 0.1,
    settled: true,
    payout: 0.18,         // already claimed
    created_at: "2025-01-11T12:30:00Z",
  },

  {
    id: "203",
    tournament_id: "4",
    user_address: "0x123",
    agent_id: "13",       // LOSER
    direction: "down",
    amount: 0.3,
    settled: true,
    payout: 0,
    created_at: "2025-01-12T15:45:00Z",
  },
];
