"use client";

import { useState } from "react";
import { X, Bot } from "lucide-react";

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (agentData: AgentFormData) => void;
}

export interface AgentFormData {
  name: string;
  personality: string;
  strategy_type: string;
  avatar_url?: string;
  stats?: {
    config?: Record<string, unknown>;
  };
}

// Default configs matching AGENT_CONFIGS in backend
const STRATEGY_CONFIGS: Record<string, Record<string, unknown>> = {
  balanced: {
    temperature: 0.7,
    model_name: "gpt-4o-mini",
    allowed_tokens: ["ETH", "WETH", "BTC", "CBBTC", "TBTC", "SOL", "AVAX", "SUI", "LINK", "BNB", "DOGE", "XRP", "TRX"],
    allowed_tools: [
      "get_market_price", "get_market_sentiment", "get_technical_indicator",
      "get_portfolio_status", "execute_trade", "research_token",
      "create_plan_step", "list_plan_steps", "cancel_plan_step", "reschedule_plan_step"
    ],
    max_position_size_pct: 0.2,
    min_confidence_threshold: 0.55,
  },
  conservative: {
    temperature: 0.4,
    model_name: "gpt-4o-mini",
    allowed_tokens: ["ETH", "WETH", "BTC", "CBBTC", "TBTC", "SOL", "AVAX", "LINK"],
    allowed_tools: [
      "get_market_price", "get_market_sentiment", "get_technical_indicator",
      "get_portfolio_status", "execute_trade", "research_token",
      "create_plan_step", "list_plan_steps", "cancel_plan_step", "reschedule_plan_step"
    ],
    max_position_size_pct: 0.1,
    min_confidence_threshold: 0.7,
  },
  aggressive: {
    temperature: 0.85,
    model_name: "gpt-4o-mini",
    allowed_tokens: ["ETH", "WETH", "BTC", "CBBTC", "TBTC", "SOL", "AVAX", "SUI", "LINK", "BNB", "DOGE", "XRP", "TRX"],
    allowed_tools: [
      "get_market_price", "get_market_sentiment", "get_technical_indicator",
      "get_portfolio_status", "execute_trade", "research_token",
      "create_plan_step", "list_plan_steps", "cancel_plan_step", "reschedule_plan_step"
    ],
    max_position_size_pct: 0.3,
    min_confidence_threshold: 0.45,
  },
  momentum: {
    temperature: 0.75,
    model_name: "gpt-4o-mini",
    allowed_tokens: ["SOL", "AVAX", "SUI", "LINK", "ETH"],
    allowed_tools: [
      "get_market_price", "get_market_sentiment", "get_technical_indicator",
      "get_portfolio_status", "execute_trade", "research_token",
      "create_plan_step", "list_plan_steps", "cancel_plan_step", "reschedule_plan_step"
    ],
    max_position_size_pct: 0.22,
    min_confidence_threshold: 0.55,
  },
  trend_following: {
    temperature: 0.7,
    model_name: "gpt-4o-mini",
    allowed_tokens: ["SOL", "AVAX", "SUI", "LINK"],
    allowed_tools: [
      "get_market_price", "get_market_sentiment", "get_technical_indicator",
      "get_portfolio_status", "execute_trade", "research_token",
      "create_plan_step", "list_plan_steps", "cancel_plan_step", "reschedule_plan_step"
    ],
    max_position_size_pct: 0.18,
    min_confidence_threshold: 0.6,
  },
  sentiment: {
    temperature: 0.65,
    model_name: "gpt-4o-mini",
    allowed_tokens: ["ETH", "WETH", "BTC", "CBBTC", "TBTC", "SOL", "AVAX", "SUI", "LINK", "BNB", "DOGE", "XRP", "TRX"],
    allowed_tools: [
      "get_market_price", "get_market_sentiment", "get_technical_indicator",
      "get_portfolio_status", "execute_trade", "research_token",
      "create_plan_step", "list_plan_steps", "cancel_plan_step", "reschedule_plan_step"
    ],
    max_position_size_pct: 0.2,
    min_confidence_threshold: 0.5,
  },
  contrarian: {
    temperature: 0.6,
    model_name: "gpt-4o-mini",
    allowed_tokens: ["ETH", "WETH", "BTC", "CBBTC", "TBTC", "SOL", "AVAX", "SUI", "LINK", "BNB", "DOGE", "XRP", "TRX"],
    allowed_tools: [
      "get_market_price", "get_market_sentiment", "get_technical_indicator",
      "get_portfolio_status", "execute_trade", "research_token",
      "create_plan_step", "list_plan_steps", "cancel_plan_step", "reschedule_plan_step"
    ],
    max_position_size_pct: 0.15,
    min_confidence_threshold: 0.65,
  },
  value: {
    temperature: 0.5,
    model_name: "gpt-4o-mini",
    allowed_tokens: ["ETH", "WETH", "BTC", "CBBTC", "TBTC", "SOL", "AVAX", "LINK"],
    allowed_tools: [
      "get_market_price", "get_market_sentiment", "get_technical_indicator",
      "get_portfolio_status", "execute_trade", "research_token",
      "create_plan_step", "list_plan_steps", "cancel_plan_step", "reschedule_plan_step"
    ],
    max_position_size_pct: 0.12,
    min_confidence_threshold: 0.65,
  },
};

interface ConfigOverrides {
  starting_cash: number;
  temperature: number;
  max_position_size_pct: number;
  min_confidence_threshold: number;
}

const DEFAULT_OVERRIDES: ConfigOverrides = {
  starting_cash: 500,
  temperature: -1, // -1 means use strategy default
  max_position_size_pct: -1,
  min_confidence_threshold: -1,
};

export default function CreateAgentModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateAgentModalProps) {
  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    personality: "",
    strategy_type: "",
    avatar_url: "",
  });

  const [configOverrides, setConfigOverrides] = useState<ConfigOverrides>(DEFAULT_OVERRIDES);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<keyof AgentFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AgentFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Agent name is required";
    }

    if (!formData.personality.trim()) {
      newErrors.personality = "Personality description is required";
    }

    if (!formData.strategy_type.trim()) {
      newErrors.strategy_type = "Strategy type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const baseConfig = STRATEGY_CONFIGS[formData.strategy_type as keyof typeof STRATEGY_CONFIGS] || STRATEGY_CONFIGS.balanced;

      const isOverrideSet = (value: number, defaultVal: number) => value !== defaultVal;

      const mergedConfig: Record<string, unknown> = { ...baseConfig };
      if (isOverrideSet(configOverrides.starting_cash, DEFAULT_OVERRIDES.starting_cash)) {
        mergedConfig.starting_cash = configOverrides.starting_cash;
      }
      if (configOverrides.temperature >= 0) {
        mergedConfig.temperature = configOverrides.temperature;
      }
      if (configOverrides.max_position_size_pct >= 0) {
        mergedConfig.max_position_size_pct = configOverrides.max_position_size_pct;
      }
      if (configOverrides.min_confidence_threshold >= 0) {
        mergedConfig.min_confidence_threshold = configOverrides.min_confidence_threshold;
      }

      const agentWithConfig = {
        ...formData,
        avatar_url: formData.avatar_url || undefined,
        stats: {
          config: mergedConfig,
        },
      };
      onSubmit(agentWithConfig);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      personality: "",
      strategy_type: "",
      avatar_url: "",
    });
    setConfigOverrides(DEFAULT_OVERRIDES);
    setShowAdvanced(false);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <div
              className="bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-2xl max-w-2xl w-full my-8 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8">
                <div className="space-y-6">
                  {/* Agent Name */}
                  <div className="relative">
                    <input
                      type="text"
                      id="agent-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder=" "
                      className={`w-full px-4 py-3.5 bg-white/5 border ${
                        errors.name ? "border-red-500" : "border-white/10"
                      } rounded-lg text-white placeholder-transparent focus:outline-none focus:border-purple-400 transition-colors peer`}
                    />
                    <label
                      htmlFor="agent-name"
                      className="absolute left-4 -top-2.5 px-1 bg-slate-900 text-sm font-medium text-gray-300 transition-all
                        peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent
                        peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-purple-400 peer-focus:bg-slate-900"
                    >
                      Agent Name *
                    </label>
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-2">{errors.name}</p>
                    )}
                  </div>

                  {/* Strategy Type */}
                  <div>
                    <select
                      value={formData.strategy_type}
                      onChange={(e) => setFormData({ ...formData, strategy_type: e.target.value })}
                      className={`w-full px-4 py-3.5 bg-white/5 border ${
                        errors.strategy_type ? "border-red-500" : "border-white/10"
                      } rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors`}
                    >
                      <option value="" className="bg-slate-800">Select strategy type...</option>
                      <option value="balanced" className="bg-slate-800">Balanced (Default)</option>
                      <option value="conservative" className="bg-slate-800">Conservative (Value)</option>
                      <option value="aggressive" className="bg-slate-800">Aggressive</option>
                      <option value="momentum" className="bg-slate-800">Momentum</option>
                      <option value="trend_following" className="bg-slate-800">Trend Following</option>
                      <option value="sentiment" className="bg-slate-800">Sentiment</option>
                      <option value="contrarian" className="bg-slate-800">Contrarian</option>
                      <option value="value" className="bg-slate-800">Value (HODLer)</option>
                    </select>
                    {errors.strategy_type && (
                      <p className="text-red-400 text-xs mt-2">{errors.strategy_type}</p>
                    )}
                  </div>

                  {/* Personality Description */}
                  <div className="relative">
                    <textarea
                      id="agent-personality"
                      value={formData.personality}
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                      placeholder=" "
                      rows={5}
                      className={`w-full px-4 py-3.5 bg-white/5 border ${
                        errors.personality ? "border-red-500" : "border-white/10"
                      } rounded-lg text-white placeholder-transparent focus:outline-none focus:border-purple-400 transition-colors resize-none peer`}
                    />
                    <label
                      htmlFor="agent-personality"
                      className="absolute left-4 -top-2.5 px-1 bg-slate-900 text-sm font-medium text-gray-300 transition-all
                        peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent
                        peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-purple-400 peer-focus:bg-slate-900"
                    >
                      Personality Description *
                    </label>
                    {errors.personality && (
                      <p className="text-red-400 text-xs mt-2">{errors.personality}</p>
                    )}
                  </div>

                  {/* Avatar URL */}
                  <div className="relative">
                    <input
                      type="text"
                      id="agent-avatar"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      placeholder=" "
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-transparent focus:outline-none focus:border-purple-400 transition-colors peer"
                    />
                    <label
                      htmlFor="agent-avatar"
                      className="absolute left-4 -top-2.5 px-1 bg-slate-900 text-sm font-medium text-gray-400 transition-all
                        peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent
                        peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-purple-400 peer-focus:bg-slate-900"
                    >
                      Avatar URL (optional)
                    </label>
                    <p className="text-gray-500 text-xs mt-2">Link to profile picture (e.g., https://example.com/avatar.png)</p>
                  </div>

                  {/* Starting Cash */}
                  <div className="relative">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Starting Cash (USDC)
                        </label>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">$</span>
                          <input
                            type="number"
                            min="100"
                            max="10000"
                            step="50"
                            value={configOverrides.starting_cash}
                            onChange={(e) => setConfigOverrides({ ...configOverrides, starting_cash: parseInt(e.target.value) || 500 })}
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">Amount of USDC the agent starts with in tournaments (default: $500)</p>
                  </div>

                  {/* Advanced Configuration Toggle */}
                  <div className="pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-medium">Advanced Configuration</span>
                      <span className="text-xs text-gray-500">(override strategy defaults)</span>
                    </button>

                    {showAdvanced && (
                      <div className="mt-4 space-y-5 pl-6 border-l-2 border-purple-500/30">
                        {/* Temperature Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-300">Temperature</label>
                            <span className="text-sm text-purple-400">
                              {configOverrides.temperature < 0 ? 'Strategy Default' : configOverrides.temperature.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.05"
                            value={configOverrides.temperature}
                            onChange={(e) => setConfigOverrides({ ...configOverrides, temperature: parseFloat(e.target.value) })}
                            className="w-full accent-purple-500"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>-1 (default)</span>
                            <span>0 (deterministic)</span>
                            <span>1 (creative)</span>
                          </div>
                        </div>

                        {/* Max Position Size Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-300">Max Position Size</label>
                            <span className="text-sm text-purple-400">
                              {configOverrides.max_position_size_pct < 0 ? 'Strategy Default' : `${(configOverrides.max_position_size_pct * 100).toFixed(0)}%`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-1"
                            max="0.5"
                            step="0.01"
                            value={configOverrides.max_position_size_pct}
                            onChange={(e) => setConfigOverrides({ ...configOverrides, max_position_size_pct: parseFloat(e.target.value) })}
                            className="w-full accent-purple-500"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>-1 (default)</span>
                            <span>25%</span>
                            <span>50%</span>
                          </div>
                        </div>

                        {/* Min Confidence Threshold Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-300">Min Confidence Threshold</label>
                            <span className="text-sm text-purple-400">
                              {configOverrides.min_confidence_threshold < 0 ? 'Strategy Default' : `${(configOverrides.min_confidence_threshold * 100).toFixed(0)}%`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-1"
                            max="0.95"
                            step="0.05"
                            value={configOverrides.min_confidence_threshold}
                            onChange={(e) => setConfigOverrides({ ...configOverrides, min_confidence_threshold: parseFloat(e.target.value) })}
                            className="w-full accent-purple-500"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>-1 (default)</span>
                            <span>50%</span>
                            <span>95%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-8 py-3 text-gray-300 hover:bg-white/5 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-purple-500/20"
                  >
                    Create Agent
                  </button>
                </div>
              </form>
            </div>
          </div>
    </>
  );
}
