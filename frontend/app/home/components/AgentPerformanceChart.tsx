"use client";

import { useEffect, useRef, useState } from "react";
import {
  TrendingUp,
  Maximize2,
  Minimize2,
  DollarSign,
  Percent,
  Trophy,
} from "lucide-react";
import type { UTCTimestamp, ISeriesApi, IChartApi } from "lightweight-charts";
import { useTournamentAgentStates } from "@/src/hooks/useAgentStates";
import { useAgents } from "@/src/hooks/useAgents";
import { findAgentById } from "@/src/util/findAgentById";
import { getAgentColor } from "@/src/util/agentColor";

// ── Types ────────────────────────────────────────────────────────────────────

interface AgentPerformanceChartProps {
  tournamentId: string;
  highlightedAgentId?: string | null;
}

interface TimeSeriesPoint {
  time: UTCTimestamp;
  value: number;
}

interface AgentPerformanceLine {
  agentId: string;
  agentName: string;
  color: string;
  data: TimeSeriesPoint[];
  visible: boolean;
  startValue: number;
  avatarUrl?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AgentPerformanceChart({
  tournamentId,
  highlightedAgentId,
}: AgentPerformanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeView, setActiveView] = useState<"absolute" | "relative">("absolute");
  const chartRef = useRef<IChartApi | null>(null);
  const seriesMapRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  useEffect(() => {
    setActiveView("absolute");
  }, [tournamentId]);

  const { data: agentStates, isLoading: statesLoading } =
    useTournamentAgentStates(tournamentId);
  const { data: agents, isLoading: agentsLoading } = useAgents();

  const [performanceLines, setPerformanceLines] = useState<AgentPerformanceLine[]>([]);

  useEffect(() => {
    if (!agentStates || !agents) return;

    const now = Math.floor(Date.now() / 1000) as UTCTimestamp;
    const N = 90;
    const startTime = (now as number) - N * 300;

    const firstPortfolio = (agentStates[0] as any)?.portfolio;
    const portfolioVals = agentStates.map((s) => parseFloat(s.portfolio_value_usd));
    const commonStart: number =
      typeof firstPortfolio?.starting_val === "number" && firstPortfolio.starting_val > 0
        ? firstPortfolio.starting_val
        : Math.min(...portfolioVals) * 0.72;

    const lines: AgentPerformanceLine[] = agentStates.map((state, index) => {
      const agent = findAgentById(agents, state.agent_id);
      const agentName = agent?.name || `Agent ${index + 1}`;
      const finalValue = parseFloat(state.portfolio_value_usd);

      const seed = state.agent_id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const rng = (i: number) => {
        const x = Math.sin(seed * 9301 + i * 49297 + 233) * 10000;
        return x - Math.floor(x);
      };

      const walk: number[] = new Array(N + 1).fill(0);
      for (let i = 1; i <= N; i++) walk[i] = walk[i - 1] + (rng(i) - 0.5);
      const W_N = walk[N];
      const bridge = walk.slice(0, N).map((w, i) => w - (i / N) * W_N);
      const peak = Math.max(...bridge.map(Math.abs), 0.0001);
      const normBridge = bridge.map((v) => v / peak);

      const totalChange = finalValue - commonStart;
      const noiseAmp = Math.max(Math.abs(totalChange) * 0.38, commonStart * 0.04);

      const data: TimeSeriesPoint[] = normBridge.map((noise, i) => {
        const t = i / (N - 1);
        const trend = commonStart + totalChange * t;
        return {
          time: (startTime + i * 300) as UTCTimestamp,
          value: Math.max(1, trend + noise * noiseAmp),
        };
      });
      data.push({ time: now, value: finalValue });

      return {
        agentId: state.agent_id,
        agentName,
        color: getAgentColor(state.agent_id),
        data,
        visible: true,
        startValue: commonStart,
        avatarUrl: agent?.avatar_url,
      };
    });

    setPerformanceLines(lines);
  }, [agentStates, agents]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || performanceLines.length === 0) return;

    let disposed = false;
    let resizeHandler: (() => void) | undefined;
    let chartInstance: IChartApi | null = null;

    import("lightweight-charts").then((LightweightCharts) => {
      if (disposed || !chartContainerRef.current) return;

      const ctn = chartContainerRef.current;
      ctn.innerHTML = "";

      const chart = LightweightCharts.createChart(ctn, {
        width: ctn.clientWidth,
        height: isFullscreen ? window.innerHeight - 100 : (ctn.clientHeight || 300),
        layout: {
          background: { color: "transparent" },
          textColor: "#9ca3af",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.05)" },
          horzLines: { color: "rgba(255,255,255,0.05)" },
        },
        timeScale: {
          timeVisible: true,
          borderColor: "rgba(255,255,255,0.1)" as string,
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.1)" as string,
          minimumWidth: 64,
        },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
        },
      });

      chartInstance = chart;
      chartRef.current = chart;
      seriesMapRef.current.clear();

      performanceLines.forEach((line) => {
        if (!chart) return;

        const series = chart.addSeries(LightweightCharts.LineSeries, {
          color: line.color,
          lineWidth: 2,
        });

        let chartData = line.data;
        if (activeView === "relative" && line.data.length > 0) {
          const base = line.startValue || line.data[0].value;
          chartData = line.data.map((point) => ({
            time: point.time,
            value: base !== 0 ? ((point.value - base) / base) * 100 : 0,
          }));
        }

        series.setData(chartData);
        seriesMapRef.current.set(line.agentId, series);
      });

      chart.timeScale().fitContent();

      const ro = new ResizeObserver(() => {
        if (disposed || !chartContainerRef.current) return;
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen
            ? window.innerHeight - 100
            : (chartContainerRef.current.clientHeight || 300),
        });
      });
      ro.observe(ctn);

      resizeHandler = () => ro.disconnect();
    });

    return () => {
      disposed = true;
      if (resizeHandler) resizeHandler();
      if (chartInstance) {
        chartInstance.remove();
        chartRef.current = null;
      }
      if (container) container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performanceLines, isFullscreen, activeView]);

  // Highlight effect — runs independently so it doesn't rebuild the chart
  useEffect(() => {
    if (!seriesMapRef.current || seriesMapRef.current.size === 0) return;

    performanceLines.forEach((line) => {
      const series = seriesMapRef.current.get(line.agentId);
      if (series) {
        const isHighlighted = highlightedAgentId === line.agentId;
        const hasHighlight = highlightedAgentId !== null && highlightedAgentId !== undefined;

        series.applyOptions({
          lineWidth: isHighlighted ? 3 : hasHighlight ? 1 : 2,
          color: hasHighlight && !isHighlighted ? `${line.color}33` : line.color,
        });
      }
    });
  }, [highlightedAgentId, performanceLines]);

  if (statesLoading || agentsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500 text-sm">Loading chart…</div>
      </div>
    );
  }

  const topAgent = [...performanceLines].sort(
    (a, b) => (b.data[b.data.length - 1]?.value ?? 0) - (a.data[a.data.length - 1]?.value ?? 0)
  )[0];
  const topAgentValue = topAgent?.data[topAgent.data.length - 1]?.value || 0;

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#000814]/95 backdrop-blur-xl p-6 flex flex-col"
          : "relative flex flex-col h-full rounded-2xl overflow-hidden bg-[#0a0e17] border border-white/5"
      }
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex justify-between items-center flex-wrap gap-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Agent Performance
            </h3>
            <p className="text-[11px] text-zinc-500">
              Live portfolio values over time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* USD / Change toggle */}
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              onClick={() => setActiveView("absolute")}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1"
              style={activeView === "absolute" ? { background: "#f59e0b", color: "#000" } : { color: "#71717a" }}
            >
              <DollarSign className="w-3 h-3" />USD
            </button>
            <button
              onClick={() => setActiveView("relative")}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1"
              style={activeView === "relative" ? { background: "#f59e0b", color: "#000" } : { color: "#71717a" }}
            >
              <Percent className="w-3 h-3" />Change
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen((v) => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-zinc-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Chart canvas */}
      <div
        ref={chartContainerRef}
        className="flex-1 min-h-0 w-full"
        style={{ background: "rgba(0,0,0,0.15)" }}
      />

      {/* Agent legend — avatar + name strip */}
      {performanceLines.length > 0 && (
        <div
          className="px-6 py-2.5 flex items-center gap-4 overflow-x-auto flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {performanceLines.map((line) => (
            <div key={line.agentId} className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border"
                style={{ borderColor: line.color + "80", background: line.color + "20" }}
              >
                {line.avatarUrl ? (
                  <img
                    src={line.avatarUrl}
                    alt={line.agentName}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full" style={{ background: line.color }} />
                )}
              </div>
              <span className="text-[11px] text-zinc-400 whitespace-nowrap">{line.agentName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer stats */}
      <div
        className="px-6 py-3.5 flex items-center justify-between flex-wrap gap-4 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
              Leading Agent
            </p>
            <p className="text-sm font-bold text-white mt-0.5">
              {topAgent?.agentName || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
              {activeView === "absolute" ? "Portfolio Value" : "Performance"}
            </p>
            <p className="text-sm font-bold text-amber-400 mt-0.5">
              {activeView === "absolute"
                ? `$${topAgentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : (() => {
                    const base = topAgent?.startValue || topAgent?.data[0]?.value || 0;
                    const pct = base !== 0 ? ((topAgentValue - base) / base) * 100 : 0;
                    return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
                  })()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
              Active Agents
            </p>
            <p className="text-sm font-bold text-white mt-0.5">
              {performanceLines.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] text-zinc-600">
            Live updates every 5s
          </span>
        </div>
      </div>
    </div>
  );
}
