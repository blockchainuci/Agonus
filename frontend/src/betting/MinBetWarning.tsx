'use client';

interface MinBetWarningProps {
  minEth: string | number;     // e.g., "0.001"
  show?: boolean;              // optional toggle
  className?: string;
}

export function MinBetWarning({
  minEth,
  show = true,
  className = "",
}: MinBetWarningProps) {
  if (!show) return null;

  return (
    <p className={`text-xs text-red-400 mt-1 ${className}`}>
      ⚠️ Minimum bet: <span className="font-semibold">{minEth} ETH</span>
    </p>
  );
}
