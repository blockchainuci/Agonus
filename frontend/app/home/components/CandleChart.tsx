"use client";

import { useEffect, useRef } from "react";

import {
  createChart,
  CandlestickSeries,
  type CandlestickData, UTCTimestamp,
} from "lightweight-charts";
import { mockOhlcv } from "../data/mockOhlcv";

export default function CandleChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 320,
      layout: {
        background: { color: "transparent" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const data: CandlestickData[] = mockOhlcv.map((p) => ({
    time: p.time as UTCTimestamp,
    open: p.ohlc.open,
    high: p.ohlc.high,
    low: p.ohlc.low,
    close: p.ohlc.close,
    }));

    series.setData(data);

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Portfolio Value
      </h3>
      <div ref={containerRef} className="w-full h-72" />
    </div>
  );
}
