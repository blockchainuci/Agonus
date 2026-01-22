'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trophy, Users, Zap, Bell, Mail, Phone, X } from 'lucide-react';
import { Tournament } from './ui/tournaments';
import { effects } from '../design-tokens';

interface TournamentCarouselProps {
  tournaments: Tournament[];
}

// Live countdown hook
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function calculateTimeLeft(targetDate: string) {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    expired: false,
  };
}

// Compact Countdown Display Component (00:00:00 format)
function CompactCountdown({ targetDate, label }: { targetDate: string; label: string }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(targetDate);

  if (expired) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-400 mb-2">{label}</span>
        <div className="flex items-center gap-0.5">
          <span className="text-gray-300 font-mono font-bold text-2xl">00</span>
          <span className="text-gray-300 font-bold text-2xl">:</span>
          <span className="text-gray-300 font-mono font-bold text-2xl">00</span>
          <span className="text-gray-300 font-bold text-2xl">:</span>
          <span className="text-gray-300 font-mono font-bold text-2xl">00</span>
        </div>
      </div>
    );
  }

  // Calculate total hours including days
  const totalHours = days * 24 + hours;
  const displayHours = totalHours > 99 ? 99 : totalHours;

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-gray-400 mb-2">{label}</span>
      <div className="flex items-center gap-0.5">
        {/* Hours (includes days) */}
        <motion.span
          key={`h-${displayHours}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#FFD700] font-mono font-bold text-2xl"
        >
          {String(displayHours).padStart(2, '0')}
        </motion.span>
        <span className="text-[#FFD700] font-bold text-2xl animate-pulse">:</span>

        {/* Minutes */}
        <motion.span
          key={`m-${minutes}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#FFD700] font-mono font-bold text-2xl"
        >
          {String(minutes).padStart(2, '0')}
        </motion.span>
        <span className="text-[#FFD700] font-bold text-2xl animate-pulse">:</span>

        {/* Seconds with animation */}
        <motion.span
          key={`s-${seconds}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="text-[#FFD700] font-mono font-bold text-2xl"
        >
          {String(seconds).padStart(2, '0')}
        </motion.span>
      </div>
      {days > 0 && (
        <span className="text-xs text-gray-500 mt-1">
          ({days} day{days > 1 ? 's' : ''} remaining)
        </span>
      )}
    </div>
  );
}

// Agent Preview Component
function AgentPreview({ agents, maxDisplay = 4 }: { agents?: Tournament['agents']; maxDisplay?: number }) {
  if (!agents || agents.length === 0) return null;

  const displayAgents = agents.slice(0, maxDisplay);
  const remainingCount = agents.length - maxDisplay;

  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-xs text-gray-400">Competing Agents</span>
      <div className="flex items-center -space-x-2">
        {displayAgents.map((agent, index) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#0A2540] border-2 border-[#FFD700]/30 flex items-center justify-center text-lg hover:scale-110 hover:z-10 transition-transform cursor-pointer shadow-lg">
              {agent.emoji}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              {agent.name}
            </div>
          </motion.div>
        ))}
        {remainingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: maxDisplay * 0.1 }}
            className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-xs font-bold text-gray-300"
          >
            +{remainingCount}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Tournament['status'] }) {
  const statusConfig = {
    LIVE: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
      dot: 'bg-green-400',
      pulse: true,
    },
    UPCOMING: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      dot: 'bg-blue-400',
      pulse: false,
    },
    ENDED: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      border: 'border-gray-500/30',
      dot: 'bg-gray-400',
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.border} border`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className={`text-xs font-semibold uppercase tracking-wider ${config.text}`}>
        {status}
      </span>
    </div>
  );
}

// Notify Modal Component
function NotifyModal({
  isOpen,
  onClose,
  tournamentName
}: {
  isOpen: boolean;
  onClose: () => void;
  tournamentName: string;
}) {
  const [notifyMethod, setNotifyMethod] = useState<'email' | 'phone' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would send the notification preference to your backend
    console.log(`Notify via ${notifyMethod}: ${inputValue} for ${tournamentName}`);
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setNotifyMethod(null);
      setInputValue('');
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-[#1E3A8A]/90 to-[#0A2540]/95 border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FFD700]/20 rounded-full">
                <Bell className="w-5 h-5 text-[#FFD700]" />
              </div>
              <h3 className="text-xl font-bold text-white">Get Notified</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold">You&apos;re all set!</p>
              <p className="text-gray-400 text-sm mt-1">We&apos;ll notify you when the tournament starts.</p>
            </motion.div>
          ) : (
            <>
              <p className="text-gray-300 mb-6">
                Choose how you&apos;d like to be notified when <span className="text-[#FFD700] font-semibold">{tournamentName}</span> starts:
              </p>

              {/* Method Selection */}
              {!notifyMethod ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setNotifyMethod('email')}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFD700]/30 rounded-xl transition-all group"
                  >
                    <div className="p-3 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30 transition-colors">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold">Email</p>
                      <p className="text-gray-400 text-sm">Receive an email reminder</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setNotifyMethod('phone')}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFD700]/30 rounded-xl transition-all group"
                  >
                    <div className="p-3 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors">
                      <Phone className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold">Phone (SMS)</p>
                      <p className="text-gray-400 text-sm">Get a text message reminder</p>
                    </div>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {notifyMethod === 'email' ? 'Email Address' : 'Phone Number'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        {notifyMethod === 'email' ? (
                          <Mail className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Phone className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <input
                        type={notifyMethod === 'email' ? 'email' : 'tel'}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={notifyMethod === 'email' ? 'you@example.com' : '+1 (555) 000-0000'}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setNotifyMethod(null)}
                      className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A2540] font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all"
                    >
                      Notify Me
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TournamentCard({ tournament, isActive }: { tournament: Tournament; isActive: boolean }) {
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  return (
    <>
      <motion.div
        className={`relative flex-shrink-0 w-full max-w-md mx-auto ${effects.rounded.xl} overflow-hidden
          ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'}
          transition-all duration-300`}
      >
        {/* Card Background */}
        <div className={`${effects.glass.medium} border border-white/10 p-6 h-full`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <StatusBadge status={tournament.status} />
            <div className="flex items-center gap-1 text-[#FFD700]">
              <Trophy className="w-5 h-5" />
              <span className="font-bold">${tournament.prize_pool_usd.toLocaleString()}</span>
            </div>
          </div>

          {/* Tournament Name */}
          <h3 className="text-2xl font-bold text-white mb-2">{tournament.name}</h3>

          {/* Description */}
          {tournament.description && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>
          )}

          {/* Live Countdown Timer - Compact Format */}
          <div className="my-4 py-4 px-4 bg-white/5 rounded-xl border border-white/10">
            {tournament.status === 'LIVE' ? (
              <CompactCountdown targetDate={tournament.end_time} label="Ends In" />
            ) : tournament.status === 'UPCOMING' ? (
              <CompactCountdown targetDate={tournament.start_time} label="Starts In" />
            ) : (
              <CompactCountdown targetDate={tournament.end_time} label="Ends In" />
            )}
          </div>

          {/* Agent Preview + Stats */}
          <div className="flex items-end justify-between mb-6">
            <AgentPreview agents={tournament.agents} maxDisplay={4} />
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm">
                {tournament.participants}/{tournament.max_participants}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {tournament.status === 'LIVE' && (
              <button className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Zap className="w-4 h-4" />
                Watch Live
              </button>
            )}
            {tournament.status === 'UPCOMING' && (
              <button
                onClick={() => setShowNotifyModal(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A2540] font-semibold rounded-xl hover:shadow-[0_0_25px_rgba(255,215,0,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Notify Me
              </button>
            )}
            {tournament.status === 'ENDED' && (
              <button className="w-full py-3 px-4 bg-white/10 text-gray-300 font-semibold rounded-xl hover:bg-white/20 transition-all">
                View Results
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <NotifyModal
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        tournamentName={tournament.name}
      />
    </>
  );
}

export default function TournamentCarousel({ tournaments }: TournamentCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? tournaments.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === tournaments.length - 1 ? 0 : prev + 1));
  };

  // Sort tournaments: LIVE first, then UPCOMING, then ENDED
  const sortedTournaments = [...tournaments].sort((a, b) => {
    const statusOrder = { LIVE: 0, UPCOMING: 1, ENDED: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm border border-white/10 transition-all"
        aria-label="Previous tournament"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm border border-white/10 transition-all"
        aria-label="Next tournament"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Carousel Container */}
      <div ref={containerRef} className="overflow-hidden px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <TournamentCard
              tournament={sortedTournaments[currentIndex]}
              isActive={true}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-8">
        {sortedTournaments.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-[#FFD700] w-6'
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to tournament ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
