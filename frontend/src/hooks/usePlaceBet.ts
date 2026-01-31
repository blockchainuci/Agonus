import { createBet } from "@/src/lib/api/bets";
import type { CreateBetRequest } from "@/src/types/bets";

export function usePlaceBet() {
  return {
    placeBet: async (req: CreateBetRequest) => {
      if (!req.tournament_id || !req.agent_id) {
        throw new Error("Missing tournament or agent");
      }

      const amountValue = req.amount ?? req.amount_eth;
      const amount = Number(amountValue);
      if (!amountValue || Number.isNaN(amount) || amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      return createBet(req);
    },
  };
}
