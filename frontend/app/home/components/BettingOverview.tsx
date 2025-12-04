'use client';

import { mockBets } from "../data/mockBets";

// Backend format (reference only)
// {
//   id: string;
//   tournament_id: string;
//   user_address: string;
//   agent_id: string;
//   amount: number;
//   direction: "up" | "down";
//   settled: boolean;
//   payout: number | null;
//   created_at: string;
// }

export default function BettingOverview() {
  const bets = mockBets; // later: useUserBets()

  return (
    <div className="border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Your Bets</h3>

      {bets.length === 0 ? (
        <p className="text-gray-400">You haven&apos;t placed any bets yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {bets.map((bet) => {
            const isWin = bet.payout !== null && bet.payout > 0;
            const isActive = bet.settled === false;

            return (
              <div
                key={bet.id}
                className="border border-white/5 rounded-lg p-3 flex justify-between"
              >
                {/* LEFT SIDE — bet info */}
                <div>
                  <p className="font-medium text-white">
                    Agent #{bet.agent_id}
                  </p>

                  <p className="text-gray-400 text-sm">
                    Amount: {bet.amount} ETH
                  </p>

                  <p className="text-gray-400 text-sm">
                    Direction: {bet.direction.toUpperCase()}
                  </p>

                  <p className="text-[10px] text-gray-500">
                    Placed: {new Date(bet.created_at).toLocaleString()}
                  </p>
                </div>

                {/* RIGHT SIDE — status */}
                <p
                  className={`text-xs font-semibold self-center ${
                    isActive
                      ? "text-yellow-400"
                      : isWin
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {isActive ? "ACTIVE" : isWin ? "WON" : "LOST"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
