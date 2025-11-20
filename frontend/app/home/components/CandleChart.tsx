'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Maximize2, 
  Plus,
  DollarSign,
  Activity
} from 'lucide-react';
import { mockOhlcv } from '../data/mockOhlcv';
import { CandlestickSeries } from 'lightweight-charts';

export default function CandleChart() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [timeframe, setTimeframe] = useState('5m');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current || !mockOhlcv || mockOhlcv.length === 0) return;

    // dynamically import lightweight-charts only on client
    import('lightweight-charts').then((LightweightCharts) => {
      if (!chartContainerRef.current) return;

      const chart = LightweightCharts.createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: isFullscreen ? 600 : 400,
        layout: {
          background: { color: 'transparent' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        crosshair: {
          mode: 1,
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
      });

      let candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      // Format data for the chart
      const formattedData = mockOhlcv.map((d: any) => {
        // Try candlestick format first
        if (d.ohlc) {
          return {
            time: d.time,
            open: d.ohlc.open,
            high: d.ohlc.high,
            low: d.ohlc.low,
            close: d.ohlc.close,
          };
        }
        // Fallback to simple line format
        return {
          time: d.time,
          value: d.ohlc?.close || d.value || 2440,
        };
      });

      candlestickSeries.setData(formattedData);
      chart.timeScale().fitContent();

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: isFullscreen ? 600 : 400,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    });
  }, [isFullscreen]);

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
  const currentPrice = mockOhlcv?.[mockOhlcv.length - 1]?.ohlc?.close || 2508.50;
  const change24h = 5.2;
  const volume24h = 1200000;

  return (
    <motion.div
      className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFC300] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#001D3D]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Portfolio Value</h3>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-2xl font-bold text-[#FFD700]">
                  ${currentPrice.toFixed(2)}
                </p>
                <span className={`flex items-center gap-1 text-sm font-semibold ${
                  change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {change24h >= 0 ? '↗' : '↘'}
                  {Math.abs(change24h)}%
                </span>
              </div>
            </div>
          </div>

          {/* Timeframe Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
              {timeframes.map((tf) => (
                <motion.button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    timeframe === tf
                      ? 'bg-[#FFD700] text-[#001D3D]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tf}
                </motion.button>
              ))}
            </div>

            <motion.button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Maximize2 className="w-4 h-4 text-gray-400" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="relative bg-black/20" />

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Current</p>
                <p className="text-lg font-bold text-white">${currentPrice.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase">24h Change</p>
                <p className={`text-lg font-bold ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change24h >= 0 ? '+' : ''}{change24h}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase">24h Volume</p>
                <p className="text-lg font-bold text-white">${(volume24h / 1000000).toFixed(2)}M</p>
              </div>
            </div>
          </div>

          <motion.button
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-all flex items-center gap-2 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Add Indicator
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
