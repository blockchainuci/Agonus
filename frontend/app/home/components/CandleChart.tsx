'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';

import type {
  CandlestickData,
  HistogramData,
  LineData,
  Time,
} from 'lightweight-charts';

import {
  mockOhlcv,
  type OhlcCandle,
} from '@/app/home/data/mockOhlcv';
import { useTournamentStore } from '@/src/store/useTournamentStore';

/* ----------------------------------------
   TYPES
----------------------------------------- */

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type IndicatorKey = 'volume' | 'sma' | 'ema' | 'vwap';

interface CandleChartProps {
  tournamentId: number;
}

/* ----------------------------------------
   RESAMPLE BASE 1m DATA
----------------------------------------- */

function computeOhlcv(data: OhlcCandle[], timeframe: Timeframe): OhlcCandle[] {
  if (!data.length) return [];

  const interval: Record<Timeframe, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  };

  const sec = interval[timeframe];
  if (sec === 60) return data;

  const buckets = new Map<number, OhlcCandle[]>();

  for (const c of data) {
    const bucket = Math.floor(Number(c.time) / sec) * sec;
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(c);
  }

  return Array.from(buckets.entries())
    .map(([ts, arr]) => ({
      time: ts as Time,
      open: arr[0].open,
      high: Math.max(...arr.map((x) => x.high)),
      low: Math.min(...arr.map((x) => x.low)),
      close: arr[arr.length - 1].close,
      volume: arr.reduce((s, x) => s + x.volume, 0),
    }))
    .sort((a, b) => Number(a.time) - Number(b.time));
}

/* ----------------------------------------
   INDICATORS
----------------------------------------- */

function calculateSMA(data: OhlcCandle[], period = 20): LineData<Time>[] {
  return data.map((c, i) => {
    if (i < period) return { time: c.time, value: c.close };
    const slice = data.slice(i - period, i);
    const avg = slice.reduce((s, x) => s + x.close, 0) / period;
    return { time: c.time, value: avg };
  });
}

function calculateEMA(data: OhlcCandle[], period = 20): LineData<Time>[] {
  let prev = data[0].close;
  const k = 2 / (period + 1);

  return data.map((c) => {
    const next = c.close * k + prev * (1 - k);
    prev = next;
    return { time: c.time, value: next };
  });
}

function calculateVWAP(data: OhlcCandle[]): LineData<Time>[] {
  let cumulativePV = 0;
  let cumulativeVol = 0;

  return data.map((c) => {
    const typical = (c.high + c.low + c.close) / 3;
    cumulativePV += typical * c.volume;
    cumulativeVol += c.volume || 1;
    return { time: c.time, value: cumulativePV / cumulativeVol };
  });
}

/* ----------------------------------------
   MAIN COMPONENT
----------------------------------------- */

export default function CandleChart({ tournamentId }: CandleChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

<<<<<<< Updated upstream
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [fullscreen, setFullscreen] = useState(false);
  const [toggles, setToggles] = useState<Record<IndicatorKey, boolean>>({
    volume: true,
    sma: true,
    ema: true,
    vwap: true,
  });
=======
  // raw mock data typed
  const rawData = getOhlcvByTournament(parseInt(tournamentId, 10)) as OhlcCandle[];
  const groupSize = timeframeMap[timeframe] ?? 1;
  const ohlcv = aggregateOhlc(rawData, groupSize);
>>>>>>> Stashed changes

  const storeTournamentId = useTournamentStore(s => s.selectedTournamentId);
  const finalTournamentId = tournamentId ?? storeTournamentId;


  const baseData = mockOhlcv[finalTournamentId] ?? mockOhlcv[1];

  const ohlcv = useMemo(() => computeOhlcv(baseData, timeframe), [
    baseData,
    timeframe,
  ]);

  /* ----------------------------------------
     INIT CHART
  ----------------------------------------- */
  useEffect(() => {
    const container = chartRef.current;
    if (!container || !ohlcv.length) return;

    container.innerHTML = '';

    (async () => {
      const LWC = await import('lightweight-charts');

      const chart = LWC.createChart(container, {
        width: container.clientWidth,
        height: fullscreen ? window.innerHeight - 100 : 420,
        layout: {
          background: { color: 'transparent' },
          textColor: '#ccc',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.05)' },
          horzLines: { color: 'rgba(255,255,255,0.05)' },
        },
        timeScale: { timeVisible: true },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        borderVisible: false,
      });

      candleSeries.setData(ohlcv as CandlestickData<Time>[]);

      /* ---------------- Volume ---------------- */
      if (toggles.volume) {
        const vol = chart.addHistogramSeries({
          priceScaleId: 'volume',
          priceFormat: { type: 'volume' },
        });

        chart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });

        vol.setData(
          ohlcv.map((c) => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? '#22c55e' : '#ef4444',
          }))
        );
      }

      /* ---------------- Indicators ---------------- */
      if (toggles.sma) {
        chart.addLineSeries({ color: '#60a5fa', lineWidth: 2 }).setData(
          calculateSMA(ohlcv)
        );
      }

      if (toggles.ema) {
        chart.addLineSeries({ color: '#fbbf24', lineWidth: 2 }).setData(
          calculateEMA(ohlcv)
        );
      }

      if (toggles.vwap) {
        chart.addLineSeries({ color: '#a855f7', lineWidth: 2 }).setData(
          calculateVWAP(ohlcv)
        );
      }
    })();
  }, [ohlcv, toggles, fullscreen]);

  /* ----------------------------------------
     PRICE META
  ----------------------------------------- */

  const last = ohlcv.at(-1);
  const first = ohlcv[0];
  const price = last?.close ?? 0;
  const pct = first ? ((price - first.close) / first.close) * 100 : 0;

  /* ----------------------------------------
     UI
  ----------------------------------------- */

  return (
    <div className={fullscreen ? 'fixed inset-0 z-50 bg-black/90 p-4' : ''}>
      <motion.div
        className="relative bg-[#001D3D]/70 border border-white/10 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >

        {/* 🔥 INTERNAL BACKDROP FIX */}
        <div className="absolute inset-0 bg-[#001528]/80 rounded-xl pointer-events-none" />

        {/* All content above the backdrop */}
        <div className="relative z-10">

          {/* HEADER */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Tournament #{tournamentId}
              </h2>
              <p className="text-xl font-bold text-[#FFD700]">
                ${price.toFixed(2)}
              </p>
              <span className={pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                {pct.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map(
                (tf) => (
                  <button
                    key={tf}
                    className={`px-3 py-1 rounded-md text-xs ${
                      timeframe === tf
                        ? 'bg-[#FFD700] text-black'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </button>
                )
              )}

              <button
                onClick={() => setFullscreen((v) => !v)}
                className="p-2 rounded-md bg-white/5 hover:bg-white/10"
              >
                {fullscreen ? (
                  <Minimize2 className="w-4 h-4 text-gray-300" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* INDICATOR TOGGLES */}
          <div className="p-3 border-b border-white/10 flex gap-6 text-sm text-white">
            {(['volume', 'sma', 'ema', 'vwap'] as IndicatorKey[]).map((key) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={toggles[key]}
                  onChange={() =>
                    setToggles((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                />
                {key.toUpperCase()}
              </label>
            ))}
          </div>

          {/* CHART */}
          <div
            ref={chartRef}
            className={fullscreen ? 'h-[85vh]' : 'h-[420px]'}
          />
        </div>
      </motion.div>
    </div>
  );
}
