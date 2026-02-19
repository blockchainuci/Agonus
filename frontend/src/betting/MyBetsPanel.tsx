"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useBettingStore } from "@/src/store/useBettingStore";
import { useWalletAuth } from "@/src/hooks/useWalletAuth";
import { SignInPrompt } from "@/src/components/auth/SignInPrompt";

export function MyBetsPanel({
  tournamentId,
}: {
  tournamentId?: string | number;
}) {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useWalletAuth();
  const myBets = useBettingStore((s) => s.myBets);
  const isLoadingBets = useBettingStore((s) => s.isLoadingBets);
  const betsError = useBettingStore((s) => s.betsError);
  const refreshMyBets = useBettingStore((s) => s.refreshMyBets);

  useEffect(() => {
    // Only fetch bets when both connected AND authenticated
    if (!isConnected || !isAuthenticated) return;
    refreshMyBets(tournamentId);
  }, [isConnected, isAuthenticated, tournamentId, refreshMyBets]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">My Bets</h3>
          {tournamentId && (
            <p className="text-xs text-gray-400">Tournament {tournamentId}</p>
          )}
        </div>

        <button
          onClick={() => {
            if (isAuthenticated) refreshMyBets(tournamentId);
          }}
          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-200 hover:bg-white/5"
          disabled={!isConnected || !isAuthenticated}
        >
          Refresh
        </button>
      </div>

      {!isConnected && (
        <p className="text-sm text-gray-400">
          Connect your wallet to view your bets.
        </p>
      )}

      {isConnected && !isAuthenticated && (
        <div className="mt-2">
          <SignInPrompt variant="inline" />
        </div>
      )}

      {isConnected && isAuthenticated && isLoadingBets && (
        <p className="text-sm text-gray-400">Loading bets...</p>
      )}

      {isConnected && isAuthenticated && betsError && (
        <p className="text-sm text-red-400">{betsError}</p>
      )}

      {isConnected &&
        isAuthenticated &&
        !isLoadingBets &&
        !betsError &&
        myBets.length === 0 && (
          <p className="text-sm text-gray-400">No bets yet.</p>
        )}

      <ul className="mt-4 space-y-3">
        {myBets.map((b) => {
          // Use backend field names with fallbacks for compatibility
          const amount = b.amount ?? b.amount_eth ?? "0";
          const placedAt = b.placed_at ?? b.created_at;
          const status = b.settled ? "Settled" : "Pending";

          return (
            <li
              key={b.id}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">
                  {b.agent_name
                    ? b.agent_name
                    : `Agent ${String(b.agent_id).slice(0, 8)}...`}
                </div>
                <div className="text-sm text-gray-300">{amount} ETH</div>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span
                  className={b.settled ? "text-green-400" : "text-yellow-400"}
                >
                  {status}
                </span>
                <span>
                  {placedAt ? new Date(placedAt).toLocaleString() : "—"}
                </span>
              </div>

              {b.payout && (
                <div className="mt-2 text-xs text-green-400">
                  Payout: {b.payout} ETH
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
