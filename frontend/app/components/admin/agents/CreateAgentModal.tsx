"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bot,
  Scale,
  Shield,
  Zap,
  TrendingUp,
  Activity,
  MessageCircle,
  RotateCcw,
  Gem,
  Settings2,
  DollarSign,
} from "lucide-react";

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
    allowed_tokens: [
      "ETH",
      "WETH",
      "BTC",
      "CBBTC",
      "TBTC",
      "SOL",
      "AVAX",
      "SUI",
      "LINK",
      "BNB",
      "DOGE",
      "XRP",
      "TRX",
    ],
    allowed_tools: [
      "get_market_price",
      "get_market_sentiment",
      "get_technical_indicator",
      "get_portfolio_status",
      "execute_trade",
      "research_token",
      "create_plan_step",
      "list_plan_steps",
      "cancel_plan_step",
      "reschedule_plan_step",
    ],
    max_position_size_pct: 0.2,
    min_confidence_threshold: 0.55,
  },
  conservative: {
    temperature: 0.4,
    model_name: "gpt-4o-mini",
    allowed_tokens: [
      "ETH",
      "WETH",
      "BTC",
      "CBBTC",
      "TBTC",
      "SOL",
      "AVAX",
      "LINK",
    ],
    allowed_tools: [
      "get_market_price",
      "get_market_sentiment",
      "get_technical_indicator",
      "get_portfolio_status",
      "execute_trade",
      "research_token",
      "create_plan_step",
      "list_plan_steps",
      "cancel_plan_step",
      "reschedule_plan_step",
    ],
    max_position_size_pct: 0.1,
    min_confidence_threshold: 0.7,
  },
  aggressive: {
    temperature: 0.85,
    model_name: "gpt-4o-mini",
    allowed_tokens: [
      "ETH",
      "WETH",
      "BTC",
      "CBBTC",
      "TBTC",
      "SOL",
      "AVAX",
      "SUI",
      "LINK",
      "BNB",
      "DOGE",
      "XRP",
      "TRX",
    ],
    allowed_tools: [
      "get_market_price",
      "get_market_sentiment",
      "get_technical_indicator",
      "get_portfolio_status",
      "execute_trade",
      "research_token",
      "create_plan_step",
      "list_plan_steps",
      "cancel_plan_step",
      "reschedule_plan_step",
    ],
    max_position_size_pct: 0.3,
    min_confidence_threshold: 0.45,
  },
  momentum: {
    temperature: 0.75,
    model_name: "gpt-4o-mini",
    allowed_tokens: ["SOL", "AVAX", "SUI", "LINK", "ETH"],
    allowed_tools: [
      "get_market_price",
      "get_market_sentiment",
      "get_technical_indicator",
      "get_portfolio_status",
      "execute_trade",
      "research_token",
      "create_plan_step",
      "list_plan_steps",
      "cancel_plan_step",
      "reschedule_plan_step",
    ],
    max_position_size_pct: 0.22,
    min_confidence_threshold: 0.55,
  },
  trend_following: {
    temperature: 0.7,
    model_name: "gpt-4o-mini",
    allowed_tokens: ["SOL", "AVAX", "SUI", "LINK"],
    allowed_tools: [
      "get_market_price",
      "get_market_sentiment",
      "get_technical_indicator",
      "get_portfolio_status",
      "execute_trade",
      "research_token",
      "create_plan_step",
      "list_plan_steps",
      "cancel_plan_step",
      "reschedule_plan_step",
    ],
    max_position_size_pct: 0.18,
    min_confidence_threshold: 0.6,
  },
  sentiment: {
    temperature: 0.65,
    model_name: "gpt-4o-mini",
    allowed_tokens: [
      "ETH",
      "WETH",
      "BTC",
      "CBBTC",
      "TBTC",
      "SOL",
      "AVAX",
      "SUI",
      "LINK",
      "BNB",
      "DOGE",
      "XRP",
      "TRX",
    ],
    allowed_tools: [
      "get_market_price",
      "get_market_sentiment",
      "get_technical_indicator",
      "get_portfolio_status",
      "execute_trade",
      "research_token",
      "create_plan_step",
      "list_plan_steps",
      "cancel_plan_step",
      "reschedule_plan_step",
    ],
    max_position_size_pct: 0.2,
    min_confidence_threshold: 0.5,
  },
  contrarian: {
    temperature: 0.6,
    model_name: "gpt-4o-mini",
    allowed_tokens: [
      "ETH",
      "WETH",
      "BTC",
      "CBBTC",
      "TBTC",
      "SOL",
      "AVAX",
      "SUI",
      "LINK",
      "BNB",
      "DOGE",
      "XRP",
      "TRX",
    ],
    allowed_tools: [
      "get_market_price",
      "get_market_sentiment",
      "get_technical_indicator",
      "get_portfolio_status",
      "execute_trade",
      "research_token",
      "create_plan_step",
      "list_plan_steps",
      "cancel_plan_step",
      "reschedule_plan_step",
    ],
    max_position_size_pct: 0.15,
    min_confidence_threshold: 0.65,
  },
  value: {
    temperature: 0.5,
    model_name: "gpt-4o-mini",
    allowed_tokens: [
      "ETH",
      "WETH",
      "BTC",
      "CBBTC",
      "TBTC",
      "SOL",
      "AVAX",
      "LINK",
    ],
    allowed_tools: [
      "get_market_price",
      "get_market_sentiment",
      "get_technical_indicator",
      "get_portfolio_status",
      "execute_trade",
      "research_token",
      "create_plan_step",
      "list_plan_steps",
      "cancel_plan_step",
      "reschedule_plan_step",
    ],
    max_position_size_pct: 0.12,
    min_confidence_threshold: 0.65,
  },
};

// UI Mapping for the strategies to make them look great in the grid
const STRATEGY_UI = [
  {
    id: "balanced",
    label: "Balanced",
    icon: Scale,
    desc: "Default, well-rounded approach.",
  },
  {
    id: "conservative",
    label: "Conservative",
    icon: Shield,
    desc: "Lower risk, smaller sizes.",
  },
  {
    id: "aggressive",
    label: "Aggressive",
    icon: Zap,
    desc: "High conviction, larger trades.",
  },
  {
    id: "momentum",
    label: "Momentum",
    icon: TrendingUp,
    desc: "Rides current market velocity.",
  },
  {
    id: "trend_following",
    label: "Trend Follow",
    icon: Activity,
    desc: "Strict technical adherence.",
  },
  {
    id: "sentiment",
    label: "Sentiment",
    icon: MessageCircle,
    desc: "News and social driven.",
  },
  {
    id: "contrarian",
    label: "Contrarian",
    icon: RotateCcw,
    desc: "Fades the general consensus.",
  },
  {
    id: "value",
    label: "Value",
    icon: Gem,
    desc: "HODLer mindset, deep analysis.",
  },
];

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
    strategy_type: "balanced", // Pre-select a default to save users a click
    avatar_url: "",
  });

  const [configOverrides, setConfigOverrides] =
    useState<ConfigOverrides>(DEFAULT_OVERRIDES);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AgentFormData, string>>
  >({});

  // Real-time avatar preview helper
  const getAvatarUrl = (name: string) =>
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || "Agent")}`;

  const previewAvatar = formData.avatar_url || getAvatarUrl(formData.name);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AgentFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "Agent name is required";
    if (!formData.personality.trim())
      newErrors.personality = "Personality description is required";
    if (!formData.strategy_type.trim())
      newErrors.strategy_type = "Strategy type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const baseConfig =
        STRATEGY_CONFIGS[
          formData.strategy_type as keyof typeof STRATEGY_CONFIGS
        ] || STRATEGY_CONFIGS.balanced;
      const isOverrideSet = (value: number, defaultVal: number) =>
        value !== defaultVal;
      const mergedConfig: Record<string, unknown> = { ...baseConfig };

      if (
        isOverrideSet(
          configOverrides.starting_cash,
          DEFAULT_OVERRIDES.starting_cash,
        )
      ) {
        mergedConfig.starting_cash = configOverrides.starting_cash;
      }
      if (configOverrides.temperature >= 0) {
        mergedConfig.temperature = configOverrides.temperature;
      }
      if (configOverrides.max_position_size_pct >= 0) {
        mergedConfig.max_position_size_pct =
          configOverrides.max_position_size_pct;
      }
      if (configOverrides.min_confidence_threshold >= 0) {
        mergedConfig.min_confidence_threshold =
          configOverrides.min_confidence_threshold;
      }

      const agentWithConfig = {
        ...formData,
        avatar_url: formData.avatar_url || undefined,
        stats: { config: mergedConfig },
      };

      onSubmit(agentWithConfig);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      personality: "",
      strategy_type: "balanced",
      avatar_url: "",
    });
    setConfigOverrides(DEFAULT_OVERRIDES);
    setShowAdvanced(false);
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Animated Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl"
            style={{
              background: "#0c1422",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0 bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <Bot className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Deploy AI Agent
                  </h2>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mt-0.5">
                    Initialize New Trader
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <form
                id="create-agent-form"
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                {/* ─── SECTION 1: IDENTITY ─── */}
                <section>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px] text-purple-400">
                      1
                    </span>
                    Agent Identity
                  </h3>

                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Live Avatar Preview */}
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <div className="w-28 h-28 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden p-2">
                        <motion.img
                          key={previewAvatar}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          src={previewAvatar}
                          alt="Avatar Preview"
                          className="w-full h-full object-contain drop-shadow-lg"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                        Live Preview
                      </p>
                    </div>

                    <div className="flex-1 space-y-4">
                      {/* Agent Name */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Agent Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="e.g., AlphaBot, GammaWhale"
                          className={`w-full px-4 py-3 bg-black/20 border ${errors.name ? "border-red-500/50" : "border-white/10"} rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:bg-white/[0.03] transition-all`}
                        />
                        {errors.name && (
                          <p className="text-red-400 text-xs mt-1.5 font-medium">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Custom Avatar URL (Optional) */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Custom Avatar URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={formData.avatar_url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              avatar_url: e.target.value,
                            })
                          }
                          placeholder="https://example.com/avatar.png"
                          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:bg-white/[0.03] transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Personality Description */}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Personality Profile & Instructions *
                    </label>
                    <textarea
                      value={formData.personality}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personality: e.target.value,
                        })
                      }
                      placeholder="Describe how this agent should behave. What are its risk tolerances? Does it prefer specific sectors? How does it communicate?"
                      rows={4}
                      className={`w-full px-4 py-3 bg-black/20 border ${errors.personality ? "border-red-500/50" : "border-white/10"} rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:bg-white/[0.03] transition-all resize-none`}
                    />
                    {errors.personality && (
                      <p className="text-red-400 text-xs mt-1.5 font-medium">
                        {errors.personality}
                      </p>
                    )}
                  </div>
                </section>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* ─── SECTION 2: PROTOCOL ─── */}
                <section>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px] text-purple-400">
                      2
                    </span>
                    Trading Protocol
                  </h3>

                  {/* Visual Strategy Grid instead of a dropdown */}
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Core Strategy Framework *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {STRATEGY_UI.map((strategy) => {
                        const Icon = strategy.icon;
                        const isSelected =
                          formData.strategy_type === strategy.id;
                        return (
                          <button
                            key={strategy.id}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                strategy_type: strategy.id,
                              })
                            }
                            className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                              isSelected
                                ? "bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                : "bg-black/20 border-white/5 hover:bg-white/[0.04] hover:border-white/20"
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 mb-2 ${isSelected ? "text-purple-400" : "text-zinc-500"}`}
                            />
                            <span
                              className={`text-xs font-bold ${isSelected ? "text-white" : "text-zinc-400"}`}
                            >
                              {strategy.label}
                            </span>
                            <span className="text-[9px] text-zinc-500 mt-1 leading-tight hidden sm:block">
                              {strategy.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.strategy_type && (
                      <p className="text-red-400 text-xs mt-2 font-medium">
                        {errors.strategy_type}
                      </p>
                    )}
                  </div>

                  {/* Starting Capital */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Tournament Starting Capital
                    </label>
                    <div className="relative max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <DollarSign className="w-4 h-4 text-zinc-500" />
                      </div>
                      <input
                        type="number"
                        min="100"
                        max="10000"
                        step="50"
                        value={configOverrides.starting_cash}
                        onChange={(e) =>
                          setConfigOverrides({
                            ...configOverrides,
                            starting_cash: parseInt(e.target.value) || 500,
                          })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500 focus:bg-white/[0.03] transition-all"
                      />
                    </div>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1.5">
                      Virtual USDC allocation upon joining a tournament.
                    </p>
                  </div>
                </section>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* ─── SECTION 3: ADVANCED ─── */}
                <section>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Settings2
                        className={`w-5 h-5 transition-colors ${showAdvanced ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300"}`}
                      />
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-white">
                          Advanced Configuration
                        </h4>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                          Override core strategy limits
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${showAdvanced ? "border-purple-500/30 bg-purple-500/10 text-purple-400" : "border-white/10 text-zinc-500"}`}
                    >
                      <span
                        className={`text-lg leading-none transform transition-transform ${showAdvanced ? "rotate-45" : ""}`}
                      >
                        +
                      </span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-6 p-5 rounded-xl border border-white/5 bg-black/20">
                          {/* Slider Component helper for uniform styling */}
                          {[
                            {
                              label: "LLM Temperature",
                              desc: "Controls creativity vs. consistency.",
                              val: configOverrides.temperature,
                              min: -1,
                              max: 1,
                              step: 0.05,
                              format: (v: number) =>
                                v < 0 ? "Default" : v.toFixed(2),
                              onChange: (v: number) =>
                                setConfigOverrides({
                                  ...configOverrides,
                                  temperature: v,
                                }),
                            },
                            {
                              label: "Max Position Size",
                              desc: "Maximum portfolio % allowed in a single trade.",
                              val: configOverrides.max_position_size_pct,
                              min: -1,
                              max: 0.5,
                              step: 0.01,
                              format: (v: number) =>
                                v < 0 ? "Default" : `${(v * 100).toFixed(0)}%`,
                              onChange: (v: number) =>
                                setConfigOverrides({
                                  ...configOverrides,
                                  max_position_size_pct: v,
                                }),
                            },
                            {
                              label: "Min Confidence Threshold",
                              desc: "Required AI conviction level to execute.",
                              val: configOverrides.min_confidence_threshold,
                              min: -1,
                              max: 0.95,
                              step: 0.05,
                              format: (v: number) =>
                                v < 0 ? "Default" : `${(v * 100).toFixed(0)}%`,
                              onChange: (v: number) =>
                                setConfigOverrides({
                                  ...configOverrides,
                                  min_confidence_threshold: v,
                                }),
                            },
                          ].map((slider, idx) => (
                            <div key={idx}>
                              <div className="flex items-end justify-between mb-3">
                                <div>
                                  <label className="block text-xs font-bold text-white mb-0.5">
                                    {slider.label}
                                  </label>
                                  <p className="text-[10px] text-zinc-500">
                                    {slider.desc}
                                  </p>
                                </div>
                                <span
                                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${slider.val < 0 ? "bg-white/5 text-zinc-400" : "bg-purple-500/20 text-purple-300"}`}
                                >
                                  {slider.format(slider.val)}
                                </span>
                              </div>
                              <input
                                type="range"
                                min={slider.min}
                                max={slider.max}
                                step={slider.step}
                                value={slider.val}
                                onChange={(e) =>
                                  slider.onChange(parseFloat(e.target.value))
                                }
                                className="w-full accent-purple-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/40 shrink-0 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-agent-form"
                className="px-8 py-2.5 bg-purple-500 hover:bg-purple-400 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:-translate-y-0.5"
              >
                Deploy Agent
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
