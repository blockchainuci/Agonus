'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Maximize2,
  Minimize2,
  Plus,
} from 'lucide-react';
import { getOhlcvByTournament } from '../data/mockOhlcv';
import type { UTCTimestamp, ISeriesApi, IChartApi } from 'lightweight-charts';
import { CandlestickSeries } from 'lightweight-charts';

/* ----------------------------- Types ----------------------------- */

// A single OHLC candle in Lightweight Charts format
export interface OhlcCandle {
  time: UTCTimestamp; // seconds since epoch
  open: number;
  high: number;
  low: number;
  close: number;
  // volume is optional in case you add it later
  volume?: number;
}

interface CandleChartProps {
  tournamentId: string;
}

/* --------------------- Local aggregation utils ------------------ */

function aggregateOhlc(data: OhlcCandle[], groupSize: number): OhlcCandle[] {
  if (groupSize <= 1) return data;

  const result: OhlcCandle[] = [];

  for (let i = 0; i < data.length; i += groupSize) {
    const group = data.slice(i, i + groupSize);
    if (group.length === 0) continue;

    const open = group[0].open;
    const close = group[group.length - 1].close;
    const high = Math.max(...group.map((c) => c.high));
    const low = Math.min(...group.map((c) => c.low));

    result.push({
      time: group[0].time,
      open,
      high,
      low,
      close,
      // If volume exists, sum it:
      volume: group.reduce((acc, c) => acc + (c.volume ?? 0), 0) || undefined,
    });
  }

  return result;
}

const timeframeMap: Record<string, number> = {
  '1m': 1,   // mock fallback (still 5m resolution)
  '5m': 1,
  '15m': 3,
  '1h': 12,
  '4h': 48,
  '1d': 288,
};

/* --------------------------- Component --------------------------- */

export default function CandleChart({ tournamentId }: CandleChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1h');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // raw mock data typed
  const rawData = getOhlcvByTournament(tournamentId) as OhlcCandle[];
  const groupSize = timeframeMap[timeframe] ?? 1;
  const ohlcv = aggregateOhlc(rawData, groupSize);

  // ESC exits fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || ohlcv.length === 0) return;

    let chart: IChartApi | null = null;
    let series: ISeriesApi<'Candlestick'> | null = null;

    // lightweight-charts dynamically imported only on client
    import('lightweight-charts').then((LightweightCharts) => {
      if (!chartContainerRef.current) return;

      const ctn = chartContainerRef.current;

      // clear old canvases (prevents double charts)
      ctn.innerHTML = '';

      chart = LightweightCharts.createChart(ctn, {
        width: ctn.clientWidth,
        height: isFullscreen ? window.innerHeight - 100 : 400,
        layout: {
          background: { color: 'transparent' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.05)' },
          horzLines: { color: 'rgba(255,255,255,0.05)' },
        },
        timeScale: {
          timeVisible: true,
          borderColor: 'rgba(255,255,255,0.1)' as string,
        },
        rightPriceScale: {
          borderColor: 'rgba(255,255,255,0.1)' as string,
        },
      });

      series = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        borderVisible: false,
      });

      series.setData(ohlcv);
      chart.timeScale().fitContent();

      const handleResize = () => {
        if (!chart || !chartContainerRef.current) return;
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : 400,
        });
      };

      window.addEventListener('resize', handleResize);

      // cleanup for this import callback
      return () => {
        window.removeEventListener('resize', handleResize);
        chart?.remove();
        chart = null;
        series = null;
      };
    });

    // cleanup for the effect itself (if it re-runs before import resolves)
    return () => {
      chart?.remove();
      chart = null;
      series = null;
      if (container) container.innerHTML = '';
    };
  }, [isFullscreen, timeframe, tournamentId, ohlcv]);

  const timeframeButtons: Array<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'> = [
    '1m', '5m', '15m', '1h', '4h', '1d',
  ];

  const currentPrice = ohlcv[ohlcv.length - 1]?.close ?? 0;
  const firstPrice = ohlcv[0]?.close ?? currentPrice;
  const change24h =
    firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

  const volume24h = 1_200_000;

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#000814]/90 backdrop-blur-xl p-6 flex items-center justify-center'
          : 'relative'
      }
    >
      <motion.div
        className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 
          backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl 
          w-full max-w-7xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFC300] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#001D3D]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Portfolio Value</h3>
              <p className="text-xs text-gray-400">Tournament #{tournamentId}</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-2xl font-bold text-[#FFD700]">
                  ${currentPrice.toFixed(2)}
                </p>
                <span
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    change24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {change24h >= 0 ? '↗' : '↘'}
                  {Math.abs(change24h).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Timeframe + Fullscreen */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
              {timeframeButtons.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    timeframe === tf
                      ? 'bg-[#FFD700] text-[#001D3D]'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsFullscreen((v) => !v)}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 
                flex items-center justify-center border border-white/10 transition"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-gray-300" />
              ) : (
                <Maximize2 className="w-4 h-4 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Chart */}
        <div
          ref={chartContainerRef}
          className={`relative bg-black/20 w-full ${
            isFullscreen ? 'h-[80vh]' : 'h-[400px]'
          }`}
        />

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-xs text-gray-400 uppercase">Current</p>
                <p className="text-lg font-bold text-white">
                  ${currentPrice.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">24h Change</p>
                <p
                  className={`text-lg font-bold ${
                    change24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {change24h >= 0 ? '+' : ''}
                  {change24h.toFixed(2)}%
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">24h Volume</p>
                <p className="text-lg font-bold text-white">
                  ${(volume24h / 1_000_000).toFixed(2)}M
                </p>
              </div>
            </div>

            <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm border border-white/10">
              <Plus className="w-4 h-4 inline-block mr-1" />
              Add Indicator
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
