'use client';

import { NetworkGuard } from '@/src/components/wallet/NetworkGuard';
import { useTournamentStore } from '@/src/store/useTournamentStore';
import { TransactionStatus } from './TransactionStatus';
import { txToast } from './TransactionToast';

interface ClaimWinningsProps {
  payoutAmountEth: string;   // e.g. "0.052"
  tournamentId: number;
  onClaim: () => Promise<void>;  // Web3 claim function from Tucker/Ali
  className?: string;
}

export function ClaimWinnings({
  payoutAmountEth,
  tournamentId,
  onClaim,
  className = "",
}: ClaimWinningsProps) {

  const {
    txStatus,
    txError,
    setTxStatus,
    setTxError,
    setTxHash,
    resetTxState,
  } = useTournamentStore();

  const handleClaim = async () => {
    try {
      resetTxState();
      setTxStatus('confirming');
      txToast.pending("Confirm claim in your wallet…");

      await onClaim();   // Call real contract function

      setTxStatus('pending');
      txToast.pending("Claiming winnings…");

      // Tucker/Ali will update this once tx hash is available
      // setTxHash(receipt.transactionHash);

      // Simulate success for UI:
      setTimeout(() => {
        setTxStatus('success');
        txToast.success("Winnings claimed successfully!");
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setTxStatus('error');
      setTxError(err?.message || "Transaction failed");
      txToast.error("Claim failed");
    }
  };

  return (
    <NetworkGuard>
      <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-2">
          Claim Winnings
        </h3>

        <p className="text-sm text-gray-300 mb-3">
          You won <span className="text-green-400 font-semibold">{payoutAmountEth} ETH</span>  
          in Tournament #{tournamentId}.
        </p>

        <button
          disabled={txStatus === 'pending' || txStatus === 'confirming'}
          onClick={handleClaim}
          className="
            w-full px-4 py-2 rounded-lg 
            bg-green-500 hover:bg-green-400 
            text-black font-semibold
            disabled:opacity-40 disabled:cursor-not-allowed
            transition
          "
        >
          Claim Winnings
        </button>

        <TransactionStatus status={txStatus} errorMessage={txError} />
      </div>
    </NetworkGuard>
  );
}
