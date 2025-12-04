'use client';

import { mockBets } from "../data/mockBets";
import type { Bet } from "./ActiveBets";

// UI-only fields (same pattern as ActiveBets)
interface EnrichedBet extends Bet {
  status: "won" | "lost";
}

// Determine win/loss based on backend fields
function getBetStatus(bet: Bet): "won" | "lost" {
  return bet.payout && bet.payout > 0 ? "won" : "lost";
}

export default function PastBets() {
  // Only settled = true are past bets
  const past: EnrichedBet[] = mockBets
    .filter((b) => b.settled === true)
    .map((b) => ({
      ...b,
      status: getBetStatus(b),
    }));

  return (
    <div className="border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Past Bets</h3>

      {past.length === 0 ? (
        <p className="text-gray-500 text-sm">No past bets</p>
      ) : (
        <div className="flex flex-col gap-3">
          {past.map((bet) => (
            <div
              key={bet.id}
              className="border border-white/5 rounded-lg p-3 flex justify-between"
            >
              <div>
                <p className="font-medium text-white">
                  Agent #{bet.agent_id}
                </p>
                <p className="text-xs text-gray-400">
                  Amount: {bet.amount} ETH
                </p>
                <p className="text-[10px] text-gray-500">
                  Placed: {new Date(bet.created_at).toLocaleString()}
                </p>
              </div>

              <p
                className={`text-xs font-semibold self-center ${
                  bet.status === "won" ? "text-green-400" : "text-red-400"
                }`}
              >
                {bet.status.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
