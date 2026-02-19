'use client';

interface OddsDisplayProps {
  oddsDecimal?: number | null;     // e.g., 2.45
  oddsFractional?: string | null;  // e.g., "13/5"
  poolEth?: number | string;       // optional pool size
  className?: string;
}

export function OddsDisplay({
  oddsDecimal,
  oddsFractional,
  poolEth,
  className = "",
}: OddsDisplayProps) {
  // Pick preferred display order:
  // Fractional → Decimal → Fallback
  const displayOdds =
    oddsFractional ||
    (oddsDecimal !== undefined && oddsDecimal !== null
      ? `${oddsDecimal.toFixed(2)}x`
      : "—");

  return (
    <div className={`flex flex-col text-sm ${className}`}>
      {/* Odds */}
      <span className="text-yellow-400 font-semibold">{displayOdds}</span>

      {/* Pool */}
      {poolEth !== undefined && (
        <span className="text-xs text-gray-400">
          Pool: {poolEth} ETH
        </span>
      )}
    </div>
  );
}
