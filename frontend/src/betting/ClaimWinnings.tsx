'use client';

import { useAccount } from 'wagmi';
import { useTournamentStore } from '@/src/store/useTournamentStore';
import { TransactionStatus } from './TransactionStatus';
import { txToast } from './TransactionToast';

interface ClaimWinningsProps {
  payoutAmountEth: string;   // e.g. "0.052"
  tournamentId: number;
  onClaim: () => Promise<void>;  // Web3 claim function from Tucker/Ali
  alreadyClaimed: boolean;       // from backend API
  className?: string;
}

export function ClaimWinnings({
  payoutAmountEth,
  tournamentId,
  onClaim,
  alreadyClaimed,
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

  const { chainId, isConnected } = useAccount();
  const TARGET_CHAIN = 84532;
  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN;

  const isBusy = txStatus === 'pending' || txStatus === 'confirming';
  const disabled = alreadyClaimed || wrongNetwork || isBusy;

  async function handleClaim() {
    if (wrongNetwork) {
      txToast.error("Switch to Base Sepolia (84532) to claim winnings.");
      return;
    }

    if (alreadyClaimed) {
      txToast.error("You already claimed your winnings.");
      return;
    }

    try {
      resetTxState();
      setTxStatus('confirming');
      txToast.pending("Confirm claim in your wallet…");

      // 🔥 Call the real Web3 function
      // Should return a transaction hash or receipt
      const tx = await onClaim();

      setTxStatus('pending');
      txToast.pending("Claiming winnings on Base Sepolia…");

      // If Tucker/Ali return a hash:
      // setTxHash(tx);

      // Simulate network delay (remove when real hook implemented)
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
  }

  // 🔘 Determine what the button should say
  function getButtonLabel() {
    if (alreadyClaimed) return "Claimed";
    if (wrongNetwork) return "Wrong Network";
    if (txStatus === 'confirming') return "Confirming…";
    if (txStatus === 'pending') return "Claiming…";
    return "Claim Winnings";
  }

  return (
    <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-2">
        Claim Winnings
      </h3>

      {/* Display winnings summary */}
      <p className="text-sm text-gray-300 mb-3">
        {alreadyClaimed ? (
          <>
            You already claimed your winnings for Tournament #{tournamentId}.
          </>
        ) : (
          <>
            You won{" "}
            <span className="text-green-400 font-semibold">
              {payoutAmountEth} ETH
            </span>{" "}
            in Tournament #{tournamentId}.
          </>
        )}
      </p>

      {/* 🔥 WRONG NETWORK WARNING */}
      {wrongNetwork && (
        <div className="bg-red-500/20 border border-red-700 text-red-300 text-sm p-2 rounded-md mb-3">
          ⚠️ You are on the wrong network.  
          Switch to <strong>Base Sepolia (84532)</strong> to claim winnings.
        </div>
      )}

      {/* Claim Button */}
      <button
        disabled={disabled}
        onClick={handleClaim}
        className={`
          w-full px-4 py-2 rounded-lg font-semibold transition
          ${disabled
            ? "bg-gray-600 cursor-not-allowed opacity-40"
            : "bg-green-500 hover:bg-green-400 text-black"
          }
        `}
      >
        {getButtonLabel()}
      </button>

      {/* Transaction status box (pending, error, success) */}
      <TransactionStatus status={txStatus} errorMessage={txError} />
    </div>
  );
}
