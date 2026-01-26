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
  Filter,
  X,
  Brain,
  DollarSign,
  Target,
  TrendingDown,
  Activity,
  Coins,
  Info,
  Percent,
} from 'lucide-react';
import type { UTCTimestamp, ISeriesApi, IChartApi } from 'lightweight-charts';
import { useTournamentAgentStates } from '@/src/hooks/useAgentStates';
import { useAgents } from '@/src/hooks/useAgents';
import { AgentState } from '@/src/types';

// Tooltip component for explaining terms
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <Info
        className="w-3.5 h-3.5 text-gray-500 hover:text-blue-400 cursor-help transition-colors inline-block ml-1"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-gray-700 w-48 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [chartMode, setChartMode] = useState<'absolute' | 'relative'>('absolute');
  const chartRef = useRef<IChartApi | null>(null);
  const seriesMapRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

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

      // Use seeded random based on agent_id for consistent data across renders
      const seed = state.agent_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const seededRandom = (i: number) => {
        const x = Math.sin(seed + i) * 10000;
        return x - Math.floor(x);
      };

      for (let i = 0; i < dataPoints; i++) {
        const time = (startTime + i * 300) as UTCTimestamp;
        // Simulate growth trend towards current value
        const progress = i / dataPoints;
        const startValue = portfolioValue * 0.8; // Start at 80% of current
        const value = startValue + (portfolioValue - startValue) * progress;
        // Use seeded randomness for consistent results
        const noise = (seededRandom(i) - 0.5) * portfolioValue * 0.05;
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

    let cleanup: (() => void) | undefined;

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
          minimumWidth: 64,
        },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
        },
      });

      chartRef.current = chart;
      seriesMapRef.current.clear();

      // Add a line series for each agent
      performanceLines.forEach((line) => {
        if (!chart) return;

        const series = chart.addSeries(LightweightCharts.LineSeries, {
          color: line.color,
          lineWidth: 2,
          visible: visibleAgents.has(line.agentId),
        });

        // Transform data based on chart mode
        let chartData = line.data;
        if (chartMode === 'relative' && line.data.length > 0) {
          const startValue = line.data[0].value;
          chartData = line.data.map((point) => ({
            time: point.time,
            value: startValue !== 0 ? ((point.value - startValue) / startValue) * 100 : 0,
          }));
        }

        series.setData(chartData);
        seriesMapRef.current.set(line.agentId, series);
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

      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        chart?.remove();
        chartRef.current = null;
      };
    });

    return () => {
      if (cleanup) cleanup();
      if (container) container.innerHTML = '';
    };
  }, [performanceLines, isFullscreen, visibleAgents, chartMode]);

  // Update visibility when visibleAgents changes
  useEffect(() => {
    if (!seriesMapRef.current || seriesMapRef.current.size === 0) return;

    performanceLines.forEach((line) => {
      const series = seriesMapRef.current.get(line.agentId);
      if (series) {
        series.applyOptions({
          visible: visibleAgents.has(line.agentId),
        });
      }
    });
  }, [visibleAgents, performanceLines]);

  if (statesLoading || agentsLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
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
        className="glass-card rounded-2xl w-full max-w-7xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFC300] flex items-center justify-center glow-gold">
              <Trophy className="w-6 h-6 text-[#001D3D]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-heading">
                Agent Performance
              </h3>
              <p className="text-xs text-gray-400">
                Live portfolio values over time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Absolute/Relative Toggle */}
            <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5">
              <button
                onClick={() => setChartMode('absolute')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  chartMode === 'absolute'
                    ? 'bg-[#FFD700] text-[#001D3D]'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Show absolute USD values"
              >
                <DollarSign className="w-3.5 h-3.5 inline-block mr-1" />
                USD
              </button>
              <button
                onClick={() => setChartMode('relative')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  chartMode === 'relative'
                    ? 'bg-[#FFD700] text-[#001D3D]'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Show percentage change from start"
              >
                <Percent className="w-3.5 h-3.5 inline-block mr-1" />
                Change
              </button>
            </div>

            {/* Agent Filter Dropdown */}
            <div className="relative">
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                  visibleAgents.size < performanceLines.length
                    ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400'
                }`}
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              >
                <Filter className="w-4 h-4" />
                {visibleAgents.size < performanceLines.length && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full text-[8px] text-white flex items-center justify-center">
                    !
                  </span>
                )}
              </button>

              {/* Filter dropdown menu */}
              {showFilterMenu && (
                <div className="absolute right-0 top-12 w-72 bg-[#001D3D] border border-white/20 rounded-xl shadow-2xl p-4 z-[100] max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Agent Visibility</h4>
                    <button
                      onClick={() => setShowFilterMenu(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Select All / Deselect All */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setVisibleAgents(new Set(performanceLines.map(l => l.agentId)))}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setVisibleAgents(new Set())}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                    >
                      Deselect All
                    </button>
                  </div>

                  {/* Agent list */}
                  <div className="space-y-2">
                    {performanceLines.map((line) => {
                      const agentState = agentStates?.find(s => s.agent_id === line.agentId);
                      return (
                        <div
                          key={line.agentId}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                            visibleAgents.has(line.agentId)
                              ? 'bg-white/10 border-white/20'
                              : 'bg-white/5 border-white/10 opacity-60'
                          }`}
                        >
                          <button
                            onClick={() => toggleAgent(line.agentId)}
                            className="flex items-center gap-3 flex-1"
                          >
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: line.color }}
                            />
                            <span className="text-white flex-grow text-left">{line.agentName}</span>
                            <div className="flex-shrink-0">
                              {visibleAgents.has(line.agentId) ? (
                                <Eye className="w-4 h-4 text-green-400" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              if (agentState) {
                                setSelectedAgent(agentState);
                                setShowFilterMenu(false);
                              }
                            }}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                            title="View agent details"
                          >
                            <Info className="w-4 h-4 text-blue-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                  {chartMode === 'absolute' ? 'Portfolio Value' : 'Performance'}
                </p>
                <p className="text-lg font-bold text-[#FFD700]">
                  {chartMode === 'absolute'
                    ? `$${topAgentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : (() => {
                        const startVal = topAgent?.data[0]?.value || 0;
                        const pctChange = startVal !== 0 ? ((topAgentValue - startVal) / startVal) * 100 : 0;
                        return `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%`;
                      })()
                  }
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

      {/* Agent Detail Modal */}
      {selectedAgent && (() => {
        const agent = agents?.find((a) => a.id === selectedAgent.agent_id);
        const initialValue = 10000; // Placeholder - should come from backend
        const portfolioValue = parseFloat(selectedAgent.portfolio_value_usd);
        const pnl = portfolioValue - initialValue;
        const roi = (pnl / initialValue) * 100;
        const isPositive = pnl >= 0;

        return (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setSelectedAgent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedAgent(null)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* Agent Header */}
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-white/10">
                {agent?.avatar_url ? (
                  <img
                    src={agent.avatar_url}
                    alt={agent.name}
                    className="w-20 h-20 rounded-full border-2 border-purple-500/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border-2 border-purple-500/30">
                    <Brain className="w-10 h-10 text-purple-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{agent?.name || 'Unknown Agent'}</h2>
                    <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-lg">
                      <Trophy className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-bold text-purple-300">Rank #{selectedAgent.rank}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 mb-2">{agent?.strategy_type || 'Strategy N/A'}</p>
                  <p className="text-sm text-gray-500">{agent?.personality || 'No personality defined'}</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Portfolio Value</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ${portfolioValue.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-gray-400">
                      ROI
                      <InfoTooltip text="Return on Investment - percentage gain/loss from initial capital" />
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{roi.toFixed(2)}%
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-sm text-gray-400">
                      Profit & Loss
                      <InfoTooltip text="Profit and Loss - absolute dollar gain/loss from initial capital" />
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}${Math.abs(pnl).toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm text-gray-400">Total Trades</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{selectedAgent.trades_count}</p>
                </div>
              </div>

              {/* Portfolio Holdings */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  Portfolio Holdings
                </h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  {Object.keys(selectedAgent.portfolio).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(selectedAgent.portfolio).map(([asset, quantity]) => (
                        <div key={asset} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <span className="text-gray-300 font-medium">{asset}</span>
                          <span className="text-white font-semibold">{quantity.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-2">No assets in portfolio</p>
                  )}
                </div>
              </div>

              {/* Last Decision */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Latest Decision
                </h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-gray-300">{selectedAgent.last_decision || 'No decision recorded yet'}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Updated: {new Date(selectedAgent.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
