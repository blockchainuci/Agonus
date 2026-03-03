"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  DollarSign,
  Trophy,
  Users,
  Minus,
  Plus,
  AlignLeft,
  Target,
} from "lucide-react";
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
  agent_ids: string[];
}

// We calculate a default end date that is one week from the current day to provide a sensible starting point for the user.
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
  // Using useMemo ensures our initial form state is computed only once when the component mounts, improving performance.
  const initialFormData = useMemo(
    () => ({
      name: "",
      start_date: new Date(),
      end_date: getDefaultEndDate(),
      prize_pool: "",
      max_agents: 10,
      description: "",
      agent_ids: [] as string[],
    }),
    [],
  );

  const [formData, setFormData] = useState<TournamentFormData>(initialFormData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof TournamentFormData, string>>
  >({});

  // This validation function checks all required fields before allowing the form to submit.
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
      end_date: getDefaultEndDate(),
      prize_pool: "",
      max_agents: 10,
      description: "",
      agent_ids: [],
    });
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Animated Backdrop to draw focus to the modal and dim the layout behind it */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Animated Modal Container with our deep aesthetic */}
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
            {/* Header Area */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0 bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  <Trophy className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Create Tournament
                  </h2>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mt-0.5">
                    Initialize Competition Environment
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

            {/* Scrollable Form Body using static stacked labels to prevent animation glitches */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <form
                id="create-tournament-form"
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                {/* Section 1: Tournament Identity */}
                <section>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px] text-blue-400">
                      1
                    </span>
                    Tournament Details
                  </h3>

                  <div className="space-y-4">
                    <div>
                      {/* Notice how the label is now a static block element above the input.
                        By removing absolute positioning and transition classes, we ensure
                        it stays perfectly in place during the modal's entry animation.
                      */}
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" />
                        Tournament Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Spring Alpha Series"
                        className={`w-full px-4 py-3 bg-black/20 border ${
                          errors.name ? "border-red-500/50" : "border-white/10"
                        } rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:bg-white/[0.03] transition-all`}
                      />
                      {errors.name && (
                        <p className="text-red-400 text-xs mt-1.5 font-medium">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                        <AlignLeft className="w-3.5 h-3.5" />
                        Description (Optional)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Detail the rules, specific market conditions, or narrative for this competition."
                        rows={3}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:bg-white/[0.03] transition-all resize-none"
                      />
                    </div>
                  </div>
                </section>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Section 2: Scheduling */}
                <section>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px] text-blue-400">
                      2
                    </span>
                    Schedule
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Start Date *
                      </label>
                      <DatePicker
                        selected={formData.start_date}
                        onChange={(date: Date | null) =>
                          date && setFormData({ ...formData, start_date: date })
                        }
                        selectsStart
                        startDate={formData.start_date}
                        endDate={formData.end_date}
                        minDate={new Date()}
                        dateFormat="MMM dd, yyyy"
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:bg-white/[0.03] transition-all cursor-pointer"
                        calendarClassName="dark-calendar"
                        wrapperClassName="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        End Date *
                      </label>
                      <DatePicker
                        selected={formData.end_date}
                        onChange={(date: Date | null) =>
                          date && setFormData({ ...formData, end_date: date })
                        }
                        selectsEnd
                        startDate={formData.start_date}
                        endDate={formData.end_date}
                        minDate={formData.start_date}
                        dateFormat="MMM dd, yyyy"
                        className={`w-full px-4 py-3 bg-black/20 border ${
                          errors.end_date
                            ? "border-red-500/50"
                            : "border-white/10"
                        } rounded-xl text-white focus:outline-none focus:border-blue-500 focus:bg-white/[0.03] transition-all cursor-pointer`}
                        calendarClassName="dark-calendar"
                        wrapperClassName="w-full"
                      />
                      {errors.end_date && (
                        <p className="text-red-400 text-xs mt-1.5 font-medium">
                          {errors.end_date}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Section 3: Prize and Capacity */}
                <section>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px] text-blue-400">
                      3
                    </span>
                    Prize & Capacity
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5" />
                        Prize Pool (USD) *
                      </label>
                      <div className="flex h-12 rounded-xl overflow-hidden border border-white/10 focus-within:border-blue-500 transition-colors">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = parseFloat(formData.prize_pool) || 0;
                            const next = Math.max(0, cur - 1000);
                            setFormData({
                              ...formData,
                              prize_pool: String(next),
                            });
                          }}
                          className="w-12 bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.prize_pool}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              prize_pool: e.target.value,
                            })
                          }
                          placeholder="10000"
                          className="flex-1 min-w-0 bg-black/20 px-3 text-white text-center font-mono text-lg focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cur = parseFloat(formData.prize_pool) || 0;
                            setFormData({
                              ...formData,
                              prize_pool: String(cur + 1000),
                            });
                          }}
                          className="w-12 bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {errors.prize_pool && (
                        <p className="text-red-400 text-xs mt-1.5 font-medium">
                          {errors.prize_pool}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        Max Agent Capacity *
                      </label>
                      <div className="flex h-12 rounded-xl overflow-hidden border border-white/10 focus-within:border-blue-500 transition-colors">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              max_agents: Math.max(2, formData.max_agents - 1),
                            })
                          }
                          className="w-12 bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex-1 flex items-center justify-center bg-black/20 text-white font-mono text-lg">
                          {formData.max_agents}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              max_agents: Math.min(24, formData.max_agents + 1),
                            })
                          }
                          className="w-12 bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {errors.max_agents && (
                        <p className="text-red-400 text-xs mt-1.5 font-medium">
                          {errors.max_agents}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </form>
            </div>

            {/* Footer Area */}
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
                form="create-tournament-form"
                className="px-8 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:-translate-y-0.5"
              >
                Create Tournament
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
