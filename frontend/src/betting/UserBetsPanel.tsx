'use client';

import { ClaimWinnings } from './ClaimWinnings';
import { OddsDisplay } from './OddsDisplay';

interface UserBet {
  betId: string;
  agentName: string;
  agentId: number;
  tournamentId: number;
  amountEth: string;
  oddsDecimal?: number;
  oddsFractional?: string;
  isWinningBet: boolean;
  hasClaimed: boolean;
  payoutAmountEth?: string | null;
}

interface UserBetsPanelProps {
  bets: UserBet[];
  onClaim: (bet: UserBet) => Promise<void>;
}

export function UserBetsPanel({ bets, onClaim }: UserBetsPanelProps) {
  if (!bets || bets.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
        <p className="text-gray-400 text-sm">You have no bets yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {bets.map((bet) => (
        <div
          key={bet.betId}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-white font-semibold">
              Bet on {bet.agentName}
            </h3>

            <OddsDisplay
              oddsDecimal={bet.oddsDecimal}
              oddsFractional={bet.oddsFractional}
            />
          </div>

          <p className="text-gray-300 text-sm">
            Amount: <span className="text-white font-medium">{bet.amountEth} ETH</span>
          </p>

          {bet.isWinningBet && (
            <p className="text-green-400 text-sm">
              Winning Bet! 🎉
            </p>
          )}

          {bet.hasClaimed && (
            <p className="text-blue-400 text-sm mt-1">
              Claimed: {bet.payoutAmountEth} ETH
            </p>
          )}

          {/* If user can claim winnings */}
          {bet.isWinningBet && !bet.hasClaimed && bet.payoutAmountEth && (
            <ClaimWinnings
              payoutAmountEth={bet.payoutAmountEth}
              tournamentId={bet.tournamentId}
              onClaim={() => onClaim(bet)}
              className="mt-3"
            />
          )}
        </div>
      ))}
    </div>
  );
}
