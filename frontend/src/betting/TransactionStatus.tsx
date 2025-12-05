'use client';

interface TransactionStatusProps {
  status: 'idle' | 'confirming' | 'pending' | 'success' | 'error';
  errorMessage?: string | null;
  className?: string;
}

export function TransactionStatus({
  status,
  errorMessage,
  className = "",
}: TransactionStatusProps) {
  if (status === 'idle') return null;

  return (
    <div className={`text-sm mt-3 ${className}`}>
      {status === 'confirming' && (
        <p className="text-yellow-400 flex items-center gap-2">
          <span className="animate-pulse">⚠️</span>
          Confirm the transaction in your wallet…
        </p>
      )}

      {status === 'pending' && (
        <p className="text-blue-400 flex items-center gap-2">
          <span className="animate-spin">⛏️</span>
          Transaction pending on Base Sepolia…
        </p>
      )}

      {status === 'success' && (
        <p className="text-green-400 flex items-center gap-2">
          <span>🎉</span>
          Transaction confirmed!
        </p>
      )}

      {status === 'error' && (
        <p className="text-red-400 flex flex-col gap-1">
          <span>❌ Transaction failed.</span>
          {errorMessage && (
            <span className="text-xs text-red-300">
              {errorMessage}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
