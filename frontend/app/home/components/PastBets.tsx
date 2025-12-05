'use client';

import { useState } from "react";
import { mockBets } from "../data/mockBets";
import { ClaimWinnings } from "@/src/betting/ClaimWinnings";
import type { Bet } from "./ActiveBets";

// ------------------------------
// Enriched Past Bet
// ------------------------------
interface EnrichedBet extends Bet {
  status: "won" | "lost";
}

function getBetStatus(bet: Bet): "won" | "lost" {
  return bet.payout && bet.payout > 0 ? "won" : "lost";
}

export default function PastBets() {
  // Track claimed bets locally (prevents double claiming)
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});

  // Past bets = settled = true
  const past: EnrichedBet[] = mockBets
    .filter((b) => b.settled === true)
    .map((b) => ({
      ...b,
      status: getBetStatus(b),
    }));

  // Mock Claim Function — replace with real Web3 later
  const handleClaim = async (bet: EnrichedBet): Promise<void> => {
    console.log("Claim clicked:", bet);
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));

    // Mark this bet as claimed
    setClaimed((prev) => ({ ...prev, [bet.id]: true }));

    console.log("Claim complete!");
  };

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
              className="border border-white/5 rounded-lg p-3"
            >
              {/* TOP ROW */}
              <div className="flex justify-between items-start">
                {/* Agent + info */}
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

                {/* Status Badge */}
                {!claimed[bet.id] ? (
                  <p
                    className={`text-xs font-semibold ${
                      bet.status === "won"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {bet.status.toUpperCase()}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-blue-400">
                    CLAIMED ✔
                  </p>
                )}
              </div>

              {/* CLAIM WINNINGS — only show if NOT claimed */}
              {bet.status === "won" &&
                bet.payout &&
                bet.payout > 0 &&
                !claimed[bet.id] && (
                  <div className="mt-4">
                    <ClaimWinnings
                      payoutAmountEth={bet.payout.toString()}
                      tournamentId={Number(bet.tournament_id)}
                      alreadyClaimed={claimed[bet.id] === true}
                      onClaim={() => handleClaim(bet)}
                    />
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
