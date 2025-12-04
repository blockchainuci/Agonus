// app/home/data/mockOhlcv.ts
// 7 days of 1-minute OHLCV data per tournament
// T1 = uptrend, T2 = downtrend, T3 = sideways

import type { Time } from 'lightweight-charts';

export interface OhlcCandle {
  time: Time;     // MUST be Time (not number)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type Trend = 'up' | 'down' | 'sideways';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_DAY = 1440;
const DAYS = 7;
const TOTAL_MINUTES = MINUTES_PER_DAY * DAYS;

// random float helper
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate realistic OHLCV series.
 */
function generateSeries(options: {
  trend: Trend;
  startPrice: number;
  baseVolume: number;
  startTimeSec?: number;
}): OhlcCandle[] {
  const {
    trend,
    startPrice,
    baseVolume,
    startTimeSec = 1730000000,
  } = options;

  const data: OhlcCandle[] = [];
  let price = startPrice;

  for (let i = 0; i < TOTAL_MINUTES; i++) {
    const t = startTimeSec + i * SECONDS_PER_MINUTE;

    // trend behavior
    let drift = 0;
    let noise = 0;

    if (trend === 'up') {
      drift = rand(0.001, 0.004);
      noise = rand(-0.15, 0.15);
    } else if (trend === 'down') {
      drift = rand(-0.004, -0.001);
      noise = rand(-0.15, 0.15);
    } else {
      drift = rand(-0.001, 0.001);
      noise = rand(-0.3, 0.3);
    }

    price += drift + noise;

    // clamp
    price = Math.max(100, Math.min(130, price));

    const open = price + rand(-0.1, 0.1);
    const close = price + rand(-0.1, 0.1);
    const high = Math.max(open, close) + rand(0.05, 0.35);
    const low = Math.min(open, close) - rand(0.05, 0.35);
    const vol =
      baseVolume + rand(-0.4 * baseVolume, 0.4 * baseVolume);

    data.push({
      time: t as Time,        // FIXED: must cast to Time
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.max(10, Math.round(vol)),
    });
  }

  return data;
}

// Export final dataset
export const mockOhlcv: Record<number, OhlcCandle[]> = {
  1: generateSeries({
    trend: 'up',
    startPrice: 100,
    baseVolume: 900,
  }),
  2: generateSeries({
    trend: 'down',
    startPrice: 130,
    baseVolume: 1100,
  }),
  3: generateSeries({
    trend: 'sideways',
    startPrice: 115,
    baseVolume: 800,
  }),
};
