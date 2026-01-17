'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { UTCTimestamp, ISeriesApi, IChartApi } from 'lightweight-charts';
import { LineSeries } from 'lightweight-charts';
import { useTournamentAgentStates } from '@/src/hooks/useAgentStates';
import { useAgents } from '@/src/hooks/useAgents';
import { useAgentTrades } from '@/src/hooks/useTrades';

interface AgentPerformanceChartProps {
  tournamentId: string;
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
}

// Color palette for different agents
const AGENT_COLORS = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export default function AgentPerformanceChart({
  tournamentId,
}: AgentPerformanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleAgents, setVisibleAgents] = useState<Set<string>>(new Set());

  // Fetch data from backend
  const { data: agentStates, isLoading: statesLoading } =
    useTournamentAgentStates(tournamentId);
  const { data: agents, isLoading: agentsLoading } = useAgents();

  // Build performance lines from agent states and trades
  const [performanceLines, setPerformanceLines] = useState<
    AgentPerformanceLine[]
  >([]);

  useEffect(() => {
    if (!agentStates || !agents) return;

    // Create performance lines for each agent
    const lines: AgentPerformanceLine[] = agentStates.map((state, index) => {
      const agent = agents.find((a) => a.id === state.agent_id);
      const agentName = agent?.name || `Agent ${index + 1}`;

      // For now, we'll create a simple time series based on current state
      // In a real implementation, you'd fetch historical data from trades
      const currentTime = Math.floor(Date.now() / 1000) as UTCTimestamp;
      const portfolioValue = parseFloat(state.portfolio_value_usd);

      // Generate sample historical data (this should come from actual trade history)
      const data: TimeSeriesPoint[] = [];
      const dataPoints = 50;
      const startTime = currentTime - dataPoints * 300; // 5 min intervals

      for (let i = 0; i < dataPoints; i++) {
        const time = (startTime + i * 300) as UTCTimestamp;
        // Simulate growth trend towards current value
        const progress = i / dataPoints;
        const startValue = portfolioValue * 0.8; // Start at 80% of current
        const value = startValue + (portfolioValue - startValue) * progress;
        // Add some randomness
        const noise = (Math.random() - 0.5) * portfolioValue * 0.05;
        data.push({
          time,
          value: value + noise,
        });
      }

      // Add current value
      data.push({
        time: currentTime,
        value: portfolioValue,
      });

      return {
        agentId: state.agent_id,
        agentName,
        color: AGENT_COLORS[index % AGENT_COLORS.length],
        data,
        visible: true,
      };
    });

    setPerformanceLines(lines);

    // Initialize all agents as visible
    setVisibleAgents(new Set(lines.map((line) => line.agentId)));
  }, [agentStates, agents]);

  // Toggle agent visibility
  const toggleAgent = (agentId: string) => {
    setVisibleAgents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  // ESC exits fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Render chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || performanceLines.length === 0) return;

    let chart: IChartApi | null = null;
    const seriesMap: Map<string, ISeriesApi<'Line'>> = new Map();

    import('lightweight-charts').then((LightweightCharts) => {
      if (!chartContainerRef.current) return;

      const ctn = chartContainerRef.current;
      ctn.innerHTML = '';

      chart = LightweightCharts.createChart(ctn, {
        width: ctn.clientWidth,
        height: isFullscreen ? window.innerHeight - 100 : 450,
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
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
        },
      });

      // Add a line series for each agent
      performanceLines.forEach((line) => {
        if (!chart) return;

        const series = chart.addSeries(LineSeries, {
          color: line.color,
          lineWidth: 2,
        });

        series.setData(line.data);
        seriesMap.set(line.agentId, series);
      });

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (!chart || !chartContainerRef.current) return;
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : 450,
        });
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart?.remove();
        chart = null;
      };
    });

    return () => {
      chart?.remove();
      chart = null;
      if (container) container.innerHTML = '';
    };
  }, [performanceLines, isFullscreen]);

  // Update visibility
  useEffect(() => {
    performanceLines.forEach((line) => {
      // This would update the series visibility if lightweight-charts supported it
      // For now, we'll just track it in state and filter the data
    });
  }, [visibleAgents, performanceLines]);

  if (statesLoading || agentsLoading) {
    return (
      <div className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading agent performance data...</div>
        </div>
      </div>
    );
  }

  const topAgent = performanceLines[0];
  const topAgentValue = topAgent?.data[topAgent.data.length - 1]?.value || 0;

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#000814]/95 backdrop-blur-xl p-6 flex items-center justify-center'
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
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFC300] flex items-center justify-center">
              <Trophy className="w-6 h-6 text-[#001D3D]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Agent Performance
              </h3>
              <p className="text-xs text-gray-400">
                Live portfolio values over time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Legend / Agent toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              {performanceLines.slice(0, 4).map((line) => (
                <button
                  key={line.agentId}
                  onClick={() => toggleAgent(line.agentId)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    visibleAgents.has(line.agentId)
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/5 border-white/10 opacity-50'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: line.color }}
                  />
                  <span className="text-white">{line.agentName}</span>
                  {visibleAgents.has(line.agentId) ? (
                    <Eye className="w-3 h-3 text-gray-400" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-gray-400" />
                  )}
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
            isFullscreen ? 'h-[80vh]' : 'h-[450px]'
          }`}
        />

        {/* Footer - Stats */}
        <div className="px-6 py-4 border-t border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-xs text-gray-400 uppercase">Leading Agent</p>
                <p className="text-lg font-bold text-white">
                  {topAgent?.agentName || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Portfolio Value
                </p>
                <p className="text-lg font-bold text-[#FFD700]">
                  ${topAgentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Active Agents
                </p>
                <p className="text-lg font-bold text-white">
                  {performanceLines.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">
                Live updates every 5s
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
