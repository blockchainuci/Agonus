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
  Clock,
  Filter,
  X,
  Check,
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

// Timeframe options
type TimeframeKey = '1H' | '4H' | '24H' | '7D';
const TIMEFRAMES: { key: TimeframeKey; label: string; minutes: number }[] = [
  { key: '1H', label: '1H', minutes: 60 },
  { key: '4H', label: '4H', minutes: 240 },
  { key: '24H', label: '24H', minutes: 1440 },
  { key: '7D', label: '7D', minutes: 10080 },
];

export default function AgentPerformanceChart({
  tournamentId,
}: AgentPerformanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesMapRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleAgents, setVisibleAgents] = useState<Set<string>>(new Set());
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeKey>('24H');
  const [showAgentFilter, setShowAgentFilter] = useState(false);

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

    // Get timeframe config
    const timeframeConfig = TIMEFRAMES.find((t) => t.key === selectedTimeframe) || TIMEFRAMES[2];
    const totalMinutes = timeframeConfig.minutes;
    const dataPoints = 50;
    const intervalSeconds = (totalMinutes * 60) / dataPoints;

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
      const startTime = currentTime - totalMinutes * 60;

      for (let i = 0; i < dataPoints; i++) {
        const time = (startTime + i * intervalSeconds) as UTCTimestamp;
        // Simulate growth trend towards current value
        const progress = i / dataPoints;
        const startValue = portfolioValue * 0.8; // Start at 80% of current
        const value = startValue + (portfolioValue - startValue) * progress;
        // Add some randomness - use index as seed for consistency
        const noise = (Math.sin(i * 0.5 + index) * 0.5) * portfolioValue * 0.05;
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
  }, [agentStates, agents, selectedTimeframe]);

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

  // Select all agents
  const selectAllAgents = () => {
    setVisibleAgents(new Set(performanceLines.map((line) => line.agentId)));
  };

  // Deselect all agents
  const deselectAllAgents = () => {
    setVisibleAgents(new Set());
  };

  // Check if all agents are visible
  const allAgentsVisible = performanceLines.length > 0 && visibleAgents.size === performanceLines.length;
  const someAgentsHidden = visibleAgents.size < performanceLines.length && visibleAgents.size > 0;

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

    import('lightweight-charts').then((LightweightCharts) => {
      if (!chartContainerRef.current) return;

      const ctn = chartContainerRef.current;
      ctn.innerHTML = '';

      const chart = LightweightCharts.createChart(ctn, {
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

      chartRef.current = chart;
      seriesMapRef.current.clear();

      // Add a line series for each agent (only visible ones)
      performanceLines.forEach((line) => {
        if (!chart) return;

        const series = chart.addSeries(LineSeries, {
          color: line.color,
          lineWidth: 2,
          visible: visibleAgents.has(line.agentId),
        });

        series.setData(line.data);
        seriesMapRef.current.set(line.agentId, series);
      });

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (!chartRef.current || !chartContainerRef.current) return;
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : 450,
        });
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    });

    return () => {
      chartRef.current?.remove();
      chartRef.current = null;
      seriesMapRef.current.clear();
      if (container) container.innerHTML = '';
    };
  }, [performanceLines, isFullscreen]);

  // Update series visibility when toggled
  useEffect(() => {
    seriesMapRef.current.forEach((series, agentId) => {
      series.applyOptions({
        visible: visibleAgents.has(agentId),
      });
    });
  }, [visibleAgents]);

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

          <div className="flex items-center gap-2">
            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
              <Clock className="w-4 h-4 text-gray-400 ml-2" />
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setSelectedTimeframe(tf.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedTimeframe === tf.key
                      ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Agent Filter Button */}
            <div className="relative">
              <motion.button
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                  someAgentsHidden
                    ? 'bg-[#FFD700]/20 border-[#FFD700]/30 text-[#FFD700]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAgentFilter(!showAgentFilter)}
              >
                <Filter className="w-4 h-4" />
                {someAgentsHidden && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFD700] rounded-full text-[8px] text-[#001D3D] flex items-center justify-center font-bold">
                    {performanceLines.length - visibleAgents.size}
                  </span>
                )}
              </motion.button>

              {/* Agent Filter Dropdown */}
              {showAgentFilter && (
                <div className="absolute right-0 top-12 w-72 bg-[#001D3D] border border-white/20 rounded-xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-white">Show Agents</h4>
                    <button
                      onClick={() => setShowAgentFilter(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Select All / Deselect All */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={selectAllAgents}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        allAgentsVisible
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Show All
                    </button>
                    <button
                      onClick={deselectAllAgents}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        visibleAgents.size === 0
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Hide All
                    </button>
                  </div>

                  {/* Agent list with checkboxes */}
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-golden">
                    {performanceLines.map((line) => (
                      <button
                        key={line.agentId}
                        onClick={() => toggleAgent(line.agentId)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          visibleAgents.has(line.agentId)
                            ? 'bg-white/10 border border-white/20'
                            : 'bg-white/5 border border-white/10 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {/* Color indicator */}
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: line.color }}
                        />

                        {/* Agent name */}
                        <span className="text-white flex-grow text-left truncate">
                          {line.agentName}
                        </span>

                        {/* Visibility icon */}
                        {visibleAgents.has(line.agentId) ? (
                          <Eye className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Visible count */}
                  <div className="mt-3 pt-3 border-t border-white/10 text-center">
                    <span className="text-xs text-gray-400">
                      Showing {visibleAgents.size} of {performanceLines.length} agents
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen button */}
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

        {/* Legend - Visible Agents */}
        {visibleAgents.size > 0 && (
          <div className="px-6 py-3 border-t border-white/10 bg-white/5">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-gray-400 uppercase">Legend:</span>
              {performanceLines
                .filter((line) => visibleAgents.has(line.agentId))
                .map((line) => (
                  <div key={line.agentId} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: line.color }}
                    />
                    <span className="text-xs text-white">{line.agentName}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

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
                  Visible Agents
                </p>
                <p className="text-lg font-bold text-white">
                  {visibleAgents.size} / {performanceLines.length}
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
