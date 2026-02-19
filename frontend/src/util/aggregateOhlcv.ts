import type { UTCTimestamp } from "lightweight-charts";

export interface OhlcCandle {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradeInput {
  price: string | number;
  amount: string | number;
  timestamp: string | Date;
}

interface NormalizedTrade {
  price: number;
  amount: number;
  ts: number;
}

export function computeOhlcv(trades: TradeInput[], intervalMs = 5 * 60 * 1000): OhlcCandle[] {
  if (!trades || trades.length === 0) return [];

  // 1. Convert trades → numeric + unix time
  const normalized: NormalizedTrade[] = trades.map((t) => ({
    price: parseFloat(String(t.price)),
    amount: parseFloat(String(t.amount)),
    ts: new Date(t.timestamp).getTime(),
  }));

  // 2. Sort by time
  normalized.sort((a, b) => a.ts - b.ts);

  const buckets = new Map<number, NormalizedTrade[]>();

  for (const t of normalized) {
    const bucketStart = Math.floor(t.ts / intervalMs) * intervalMs;
    if (!buckets.has(bucketStart)) buckets.set(bucketStart, []);
    buckets.get(bucketStart)!.push(t);
  }

  // 3. Compute OHLCV per bucket
  const candles: OhlcCandle[] = [];

  for (const [bucketTime, bucketTrades] of buckets) {
    const open = bucketTrades[0].price;
    const close = bucketTrades[bucketTrades.length - 1].price;
    const high = Math.max(...bucketTrades.map((t) => t.price));
    const low = Math.min(...bucketTrades.map((t) => t.price));
    const volume = bucketTrades.reduce((sum, t) => sum + t.amount, 0);

    candles.push({
      time: Math.floor(bucketTime / 1000) as UTCTimestamp,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return candles;
}
