'use client';

import { useAccount } from 'wagmi';
import { useTournamentStore } from '@/src/store/useTournamentStore';
import { TransactionStatus } from './TransactionStatus';
import { txToast } from './TransactionToast';
import { useClaimWinningsOnchain } from '@/src/hooks/useOnchainBetting';
import { AGONUS_CHAIN_ID } from '@/src/lib/agonusContract';

interface ClaimWinningsProps {
  payoutAmountEth: string;   // e.g. "0.052"
  tournamentId: number;
  contractTournamentId?: number | null;
  alreadyClaimed: boolean;       // from backend API
  className?: string;
}

export function ClaimWinnings({
  payoutAmountEth,
  tournamentId,
  contractTournamentId,
  alreadyClaimed,
  className = "",
}: ClaimWinningsProps) {

  const {
    txStatus,
    txError,
    setTxStatus,
    setTxError,
    resetTxState,
  } = useTournamentStore();

  const { chainId, isConnected } = useAccount();
  const wrongNetwork = isConnected && chainId !== AGONUS_CHAIN_ID;
  const claimWinningsOnchain = useClaimWinningsOnchain();

  const isBusy = txStatus === 'pending' || txStatus === 'confirming';
  const missingContract = !contractTournamentId;
  const disabled = alreadyClaimed || wrongNetwork || isBusy || missingContract;

  async function handleClaim() {
    if (wrongNetwork) {
      txToast.error(`Switch to Base Sepolia (${AGONUS_CHAIN_ID}) to claim winnings.`);
      return;
    }

    if (alreadyClaimed) {
      txToast.error("You already claimed your winnings.");
      return;
    }
    if (!contractTournamentId) {
      txToast.error("Tournament is not linked on-chain yet.");
      return;
    }

    try {
      resetTxState();
      setTxStatus('confirming');
      txToast.pending("Confirm claim in your wallet…");

      // 🔥 Call the real Web3 function
      // Should return a transaction hash or receipt
      await claimWinningsOnchain(contractTournamentId);

      setTxStatus('pending');
      txToast.pending("Claiming winnings on Base Sepolia…");

      setTxStatus('success');
      txToast.success("Winnings claimed successfully!");

    } catch (err: unknown) {
      console.error(err);
      setTxStatus('error');
      setTxError((err as Error)?.message || "Transaction failed");
      txToast.error("Claim failed");
    }
  }

  // 🔘 Determine what the button should say
  function getButtonLabel() {
    if (alreadyClaimed) return "Claimed";
    if (wrongNetwork) return "Wrong Network";
    if (missingContract) return "Not Linked";
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
          Switch to <strong>Base Sepolia ({AGONUS_CHAIN_ID})</strong> to claim winnings.
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
