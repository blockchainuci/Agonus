"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, Calendar, DollarSign, Trophy, Users, Check, ChevronDown, User, Minus, Plus } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Agent {
  id: string;
  name: string;
  personality: string;
  strategy_type: string;
}

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tournamentData: TournamentFormData) => void;
  agents: Agent[];
}

export interface TournamentFormData {
  name: string;
  start_date: Date;
  end_date: Date;
  prize_pool: string;
  max_agents: number;
  description?: string;
  agent_ids: string[];
}

// Helper to get default end date (7 days from now)
function getDefaultEndDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

export default function CreateTournamentModal({
  isOpen,
  onClose,
  onSubmit,
  agents,
}: CreateTournamentModalProps) {
  // Use useMemo to compute initial values only once
  const initialFormData = useMemo(() => ({
    name: "",
    start_date: new Date(),
    end_date: getDefaultEndDate(),
    prize_pool: "",
    max_agents: 10,
    description: "",
    agent_ids: [] as string[],
  }), []);

  const [formData, setFormData] = useState<TournamentFormData>(initialFormData);

  const [errors, setErrors] = useState<Partial<Record<keyof TournamentFormData, string>>>({});
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAgentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TournamentFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tournament name is required";
    }

    if (!formData.prize_pool || parseFloat(formData.prize_pool) <= 0) {
      newErrors.prize_pool = "Prize pool must be greater than 0";
    }

    if (formData.start_date >= formData.end_date) {
      newErrors.end_date = "End date must be after start date";
    }

    if (formData.max_agents < 2) {
      newErrors.max_agents = "Must allow at least 2 agents";
    }

    if (formData.agent_ids.length === 0) {
      newErrors.agent_ids = "Select at least 1 agent";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleAgentSelection = (agentId: string) => {
    setFormData(prev => ({
      ...prev,
      agent_ids: prev.agent_ids.includes(agentId)
        ? prev.agent_ids.filter(id => id !== agentId)
        : [...prev.agent_ids, agentId]
    }));
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
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      prize_pool: "",
      max_agents: 10,
      description: "",
      agent_ids: [],
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
              className="bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-2xl max-w-3xl w-full my-8 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Create New Tournament</h2>
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
                  {/* Tournament Name */}
                  <div className="relative">
                    <input
                      type="text"
                      id="tournament-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder=" "
                      className={`w-full px-4 py-3.5 bg-white/5 border ${
                        errors.name ? "border-red-500" : "border-white/10"
                      } rounded-lg text-white placeholder-transparent focus:outline-none focus:border-blue-400 transition-colors peer`}
                    />
                    <label
                      htmlFor="tournament-name"
                      className="absolute left-4 -top-2.5 px-1 bg-slate-900 text-sm font-medium text-gray-300 transition-all
                        peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent
                        peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-400 peer-focus:bg-slate-900"
                    >
                      Tournament Name *
                    </label>
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-2">{errors.name}</p>
                    )}
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Start Date */}
                    <div className="relative">
                      <DatePicker
                        selected={formData.start_date}
                        onChange={(date: Date | null) => date && setFormData({ ...formData, start_date: date })}
                        selectsStart
                        startDate={formData.start_date}
                        endDate={formData.end_date}
                        minDate={new Date()}
                        dateFormat="MMM dd, yyyy"
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400 transition-colors cursor-pointer"
                        calendarClassName="dark-calendar"
                        wrapperClassName="w-full"
                      />
                      <label className="absolute left-4 -top-2.5 px-1 bg-slate-900 text-sm font-medium text-gray-300 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Start Date
                      </label>
                    </div>

                    {/* End Date */}
                    <div className="relative">
                      <DatePicker
                        selected={formData.end_date}
                        onChange={(date: Date | null) => date && setFormData({ ...formData, end_date: date })}
                        selectsEnd
                        startDate={formData.start_date}
                        endDate={formData.end_date}
                        minDate={formData.start_date}
                        dateFormat="MMM dd, yyyy"
                        className={`w-full px-4 py-3.5 bg-white/5 border ${
                          errors.end_date ? "border-red-500" : "border-white/10"
                        } rounded-lg text-white focus:outline-none focus:border-blue-400 transition-colors cursor-pointer`}
                        calendarClassName="dark-calendar"
                        wrapperClassName="w-full"
                      />
                      <label className="absolute left-4 -top-2.5 px-1 bg-slate-900 text-sm font-medium text-gray-300 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        End Date
                      </label>
                      {errors.end_date && (
                        <p className="text-red-400 text-xs mt-2">{errors.end_date}</p>
                      )}
                    </div>
                  </div>

                  {/* Prize Pool & Max Agents */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Prize Pool */}
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-gray-300 mb-2">
                        <DollarSign className="w-4 h-4" />
                        Prize Pool (USD) *
                      </label>
                      <div className="flex h-12">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = parseFloat(formData.prize_pool) || 0;
                            const next = Math.max(0, cur - 100);
                            setFormData({ ...formData, prize_pool: String(next) });
                          }}
                          className="w-10 shrink-0 rounded-l-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition"
                          aria-label="Decrease prize pool"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          id="prize-pool"
                          value={formData.prize_pool}
                          onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                          placeholder="0"
                          className={`flex-1 min-w-0 bg-white/5 border-y ${
                            errors.prize_pool ? "border-red-500" : "border-white/10"
                          } px-3 text-white text-center focus:outline-none focus:border-blue-400 transition-colors`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cur = parseFloat(formData.prize_pool) || 0;
                            setFormData({ ...formData, prize_pool: String(cur + 100) });
                          }}
                          className="w-10 shrink-0 rounded-r-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 flex items-center justify-center transition"
                          aria-label="Increase prize pool"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {errors.prize_pool && (
                        <p className="text-red-400 text-xs mt-2">{errors.prize_pool}</p>
                      )}
                    </div>

                    {/* Max Agents */}
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-gray-300 mb-2">
                        <Users className="w-4 h-4" />
                        Max Agents *
                      </label>
                      <div className="flex h-12">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, max_agents: Math.max(2, formData.max_agents - 1) })
                          }
                          className="w-10 shrink-0 rounded-l-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition"
                          aria-label="Decrease max agents"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className={`flex-1 flex items-center justify-center bg-white/5 border-y ${
                          errors.max_agents ? "border-red-500" : "border-white/10"
                        } text-white font-medium`}>
                          {formData.max_agents}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, max_agents: Math.min(12, formData.max_agents + 1) })
                          }
                          className="w-10 shrink-0 rounded-r-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 flex items-center justify-center transition"
                          aria-label="Increase max agents"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {errors.max_agents && (
                        <p className="text-red-400 text-xs mt-2">{errors.max_agents}</p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="relative">
                    <textarea
                      id="tournament-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder=" "
                      rows={3}
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-transparent focus:outline-none focus:border-blue-400 transition-colors resize-none peer"
                    />
                    <label
                      htmlFor="tournament-description"
                      className="absolute left-4 -top-2.5 px-1 bg-slate-900 text-sm font-medium text-gray-300 transition-all
                        peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent
                        peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-400 peer-focus:bg-slate-900"
                    >
                      Description (Optional)
                    </label>
                  </div>

                  {/* Agent Selection */}
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Select Participating Agents *
                    </label>
                    
                    {/* Dropdown Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                      className={`w-full px-4 py-3.5 bg-white/5 border ${
                        errors.agent_ids ? "border-red-500" : "border-white/10"
                      } rounded-lg text-left flex items-center justify-between transition-all hover:bg-white/10`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" />
                        {formData.agent_ids.length === 0 ? (
                          <span className="text-gray-500">Select agents...</span>
                        ) : (
                          <span className="text-white">
                            {formData.agent_ids.length} agent{formData.agent_ids.length !== 1 ? "s" : ""} selected
                          </span>
                        )}
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                          isAgentDropdownOpen ? "rotate-180" : ""
                        }`} 
                      />
                    </button>

                    {/* Dropdown Panel */}
                    <div 
                      className={`absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden transition-all duration-200 origin-top ${
                        isAgentDropdownOpen 
                          ? "opacity-100 scale-y-100" 
                          : "opacity-0 scale-y-95 pointer-events-none"
                      }`}
                    >
                      {/* Selected Count Header */}
                      {formData.agent_ids.length > 0 && (
                        <div className="px-4 py-2 bg-blue-500/10 border-b border-white/10 flex items-center justify-between">
                          <span className="text-sm text-blue-400 font-medium">
                            {formData.agent_ids.length} selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, agent_ids: [] }))}
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                      
                      {/* Agent List */}
                      <div className="max-h-64 overflow-y-auto">
                        {agents.length === 0 ? (
                          <div className="px-4 py-6 text-center">
                            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No agents available</p>
                            <p className="text-gray-600 text-xs mt-1">Create agents first</p>
                          </div>
                        ) : (
                          agents.map((agent) => {
                            const isSelected = formData.agent_ids.includes(agent.id);
                            return (
                              <button
                                key={agent.id}
                                type="button"
                                onClick={() => toggleAgentSelection(agent.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left ${
                                  isSelected
                                    ? "bg-blue-500/15 text-white"
                                    : "text-gray-300 hover:bg-white/5"
                                }`}
                              >
                                <div 
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                    isSelected 
                                      ? "bg-blue-500 border-blue-500 scale-100" 
                                      : "border-gray-500 scale-90"
                                  }`}
                                >
                                  <Check 
                                    className={`w-3 h-3 text-white transition-all duration-200 ${
                                      isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"
                                    }`} 
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{agent.name}</p>
                                  <p className="text-xs text-gray-400 capitalize">{agent.strategy_type}</p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                    
                    {errors.agent_ids && (
                      <p className="text-red-400 text-xs mt-2">{errors.agent_ids}</p>
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
                    className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Create Tournament
                  </button>
                </div>
              </form>
            </div>
          </div>
    </>
  );
}
