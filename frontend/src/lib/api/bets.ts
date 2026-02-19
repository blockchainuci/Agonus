import { apiFetch } from "@/src/lib/api/client";
import type { Bet, CreateBetRequest } from "@/src/types/bets";

export async function createBet(req: CreateBetRequest): Promise<Bet> {
  // user_address comes from JWT token on backend - don't send from frontend
  const payload = {
    tournament_id: req.tournament_id,
    agent_id: req.agent_id,
    amount: String(req.amount ?? req.amount_eth),
    odds: String(req.odds ?? 1),
  };

  const data = await apiFetch<Bet | { bet: Bet }>("/bets/", {
    method: "POST",
    body: payload,
  });

  return "bet" in data ? data.bet : data;
}

export async function settleBet(betId: string, payout: number): Promise<Bet> {
  return apiFetch<Bet>(`/bets/${betId}/settle?payout=${payout}`, {
    method: "PATCH",
  });
}

export async function getMyBets(params?: {
  tournament_id?: string | number;
}): Promise<Bet[]> {
  const qs = params?.tournament_id
    ? `?tournament_id=${encodeURIComponent(params.tournament_id)}`
    : "";

  const data = await apiFetch<Bet[] | { bets: Bet[] }>(`/bets/my-bets${qs}`);
  const bets = Array.isArray(data) ? data : data.bets;
  return bets.map((b) => {
    const status =
      b.status ??
      (b.settled
        ? b.payout && Number(b.payout) > 0
          ? "SETTLED"
          : "FAILED"
        : "PENDING");

    return {
      ...b,
      status,
      amount_eth: b.amount_eth ?? String(b.amount ?? ""),
      created_at: b.created_at ?? b.placed_at,
    };
  });
}
