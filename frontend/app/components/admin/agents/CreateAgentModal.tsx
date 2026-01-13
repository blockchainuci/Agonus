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
}

export default function CreateAgentModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateAgentModalProps) {
  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    personality: "",
    strategy_type: "",
  });

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
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      personality: "",
      strategy_type: "",
    });
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
                      <option value="Momentum" className="bg-slate-800">Momentum</option>
                      <option value="Value" className="bg-slate-800">Value</option>
                      <option value="HODLer" className="bg-slate-800">HODLer</option>
                      <option value="Mean Reversion" className="bg-slate-800">Mean Reversion</option>
                      <option value="Arbitrage" className="bg-slate-800">Arbitrage</option>
                      <option value="Trend Following" className="bg-slate-800">Trend Following</option>
                      <option value="Scalping" className="bg-slate-800">Scalping</option>
                      <option value="Breakout" className="bg-slate-800">Breakout</option>
                      <option value="Grid Trading" className="bg-slate-800">Grid Trading</option>
                      <option value="Sentiment" className="bg-slate-800">Sentiment</option>
                      <option value="Divergence" className="bg-slate-800">Divergence</option>
                      <option value="Volatility" className="bg-slate-800">Volatility</option>
                      <option value="Fibonacci" className="bg-slate-800">Fibonacci</option>
                      <option value="DCA" className="bg-slate-800">DCA (Dollar Cost Averaging)</option>
                      <option value="Swing Trading" className="bg-slate-800">Swing Trading</option>
                      <option value="Range Trading" className="bg-slate-800">Range Trading</option>
                      <option value="Pairs Trading" className="bg-slate-800">Pairs Trading</option>
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
