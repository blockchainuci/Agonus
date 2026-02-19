"use client";

import { useState, useMemo } from "react";
import { X, Calendar, DollarSign, Trophy, Users } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tournamentData: TournamentFormData) => void;
}

export interface TournamentFormData {
  name: string;
  start_date: Date;
  end_date: Date;
  prize_pool: string;
  max_agents: number;
  description?: string;
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
}: CreateTournamentModalProps) {
  // Use useMemo to compute initial values only once
  const initialFormData = useMemo(() => ({
    name: "",
    start_date: new Date(),
    end_date: getDefaultEndDate(),
    prize_pool: "",
    max_agents: 10,
    description: "",
  }), []);

  const [formData, setFormData] = useState<TournamentFormData>(initialFormData);

  const [errors, setErrors] = useState<Partial<Record<keyof TournamentFormData, string>>>({});

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
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      prize_pool: "",
      max_agents: 10,
      description: "",
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Prize Pool */}
                    <div className="relative">
                      <input
                        type="number"
                        id="prize-pool"
                        value={formData.prize_pool}
                        onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                        placeholder=" "
                        min="0"
                        step="100"
                        className={`w-full px-4 py-3.5 bg-white/5 border ${
                          errors.prize_pool ? "border-red-500" : "border-white/10"
                        } rounded-lg text-white placeholder-transparent focus:outline-none focus:border-blue-400 transition-colors peer`}
                      />
                      <label
                        htmlFor="prize-pool"
                        className="absolute left-4 -top-2.5 px-1 bg-slate-900 text-sm font-medium text-gray-300 transition-all flex items-center gap-1
                          peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent
                          peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-400 peer-focus:bg-slate-900"
                      >
                        <DollarSign className="w-4 h-4" />
                        Prize Pool (USD) *
                      </label>
                      {errors.prize_pool && (
                        <p className="text-red-400 text-xs mt-2">{errors.prize_pool}</p>
                      )}
                    </div>

                    {/* Max Agents */}
                    <div className="relative">
                      <input
                        type="number"
                        id="max-agents"
                        value={formData.max_agents}
                        onChange={(e) =>
                          setFormData({ ...formData, max_agents: parseInt(e.target.value) })
                        }
                        placeholder=" "
                        min="2"
                        max="100"
                        className={`w-full px-4 py-3.5 bg-white/5 border ${
                          errors.max_agents ? "border-red-500" : "border-white/10"
                        } rounded-lg text-white placeholder-transparent focus:outline-none focus:border-blue-400 transition-colors peer`}
                      />
                      <label
                        htmlFor="max-agents"
                        className="absolute left-4 -top-2.5 px-1 bg-slate-900 text-sm font-medium text-gray-300 transition-all flex items-center gap-1
                          peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent
                          peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-400 peer-focus:bg-slate-900"
                      >
                        <Users className="w-4 h-4" />
                        Agents
                      </label>
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
                      rows={5}
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
