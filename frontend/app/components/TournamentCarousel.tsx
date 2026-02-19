'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trophy, Users, Clock, Activity } from 'lucide-react';
import { Tournament } from './ui/tournaments';

interface TournamentCarouselProps {
  tournaments: Tournament[];
}

const agentDetails: Record<string, { strategy: string; personality: string }> = {
  AlphaBot: {
    strategy: 'Momentum',
    personality: 'Aggressive trend chaser focused on breakouts.',
  },
  TrendHunter: {
    strategy: 'Trend Following',
    personality: 'Rides winning moves until signal reversal.',
  },
  WhaleWatch: {
    strategy: 'Liquidity Sniper',
    personality: 'Tracks large flows to front-run momentum.',
  },
  MomentumX: {
    strategy: 'High Velocity',
    personality: 'Fast entries and exits, low patience.',
  },
  DeepValue: {
    strategy: 'Value',
    personality: 'Patient, waits for asymmetric value.',
  },
  SwingTrader: {
    strategy: 'Swing',
    personality: 'Holds for multi-day momentum shifts.',
  },
  VolBot: {
    strategy: 'Volatility',
    personality: 'Thrives on rapid swings and spikes.',
  },
  RiskMaster: {
    strategy: 'Risk Parity',
    personality: 'Balances risk across positions.',
  },
  SpeedDemon: {
    strategy: 'Scalping',
    personality: 'Takes tiny profits at high frequency.',
  },
  FlashTrader: {
    strategy: 'Momentum',
    personality: 'Explosive entries on fast moves.',
  },
  QuickSilver: {
    strategy: 'Arbitrage',
    personality: 'Finds tiny inefficiencies at speed.',
  },
  Champion: {
    strategy: 'Balanced',
    personality: 'Consistent, low drawdown approach.',
  },
  SilverStar: {
    strategy: 'Mean Reversion',
    personality: 'Buys dips, sells fades.',
  },
  BronzeBeast: {
    strategy: 'Contrarian',
    personality: 'Fades crowded trades with conviction.',
  },
};

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

// Compact Countdown Display Component (DD:HH:MM:SS format)
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

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-gray-400 mb-2">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-[#FFD700] font-mono font-bold text-3xl">
          {String(days).padStart(2, '0')}
        </span>
        <span className="text-[#FFD700] font-bold text-2xl">:</span>
        <span className="text-[#FFD700] font-mono font-bold text-3xl">
          {String(hours).padStart(2, '0')}
        </span>
        <span className="text-[#FFD700] font-bold text-2xl">:</span>
        <span className="text-[#FFD700] font-mono font-bold text-3xl">
          {String(minutes).padStart(2, '0')}
        </span>
        <span className="text-[#FFD700] font-bold text-2xl">:</span>
        <span className="text-[#FFD700] font-mono font-bold text-3xl">
          {String(seconds).padStart(2, '0')}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1 mt-1 text-[11px] text-gray-400 uppercase tracking-wider w-full max-w-[210px]">
        <span className="text-center">Days</span>
        <span className="text-center">Hours</span>
        <span className="text-center">Mins</span>
        <span className="text-center">Secs</span>
      </div>
      {days > 0 && (
        <span className="text-xs text-gray-500 mt-1">
          ({days} day{days > 1 ? 's' : ''} remaining)
        </span>
      )}
    </div>
  );
}

// Live status — replaces countdown for LIVE tournaments
function LiveStatusDisplay({ agents }: { agents?: Tournament['agents'] }) {
  const leadAgent = agents?.[0];
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-gray-400">Status</span>
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-green-400 animate-pulse" />
        <span className="text-green-400 font-bold text-2xl">In Progress</span>
      </div>
      {leadAgent && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">Current Lead:</span>
          <span className="text-lg">{leadAgent.emoji}</span>
          <span className="text-sm font-semibold text-white">{leadAgent.name}</span>
        </div>
      )}
    </div>
  );
}

// Upcoming status — shows countdown when active, or "Starting Soon" when expired
function UpcomingStatusDisplay({ targetDate }: { targetDate: string }) {
  const { expired } = useCountdown(targetDate);

  if (expired) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-gray-400">Status</span>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#FFD700] animate-pulse" />
          <span className="text-[#FFD700] font-bold text-2xl">Starting Soon</span>
        </div>
        <span className="text-xs text-gray-500">Waiting for admin to start</span>
      </div>
    );
  }

  return <CompactCountdown targetDate={targetDate} label="Starts In" />;
}

// Upcoming action button — "Coming Soon" vs "Starting Soon"
function UpcomingActionButton({ targetDate }: { targetDate: string }) {
  const { expired } = useCountdown(targetDate);

  if (expired) {
    return (
      <div className="w-full py-3 px-4 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] font-semibold rounded-xl flex items-center justify-center gap-2">
        <Clock className="w-4 h-4 animate-pulse" />
        Starting Soon
      </div>
    );
  }

  return (
    <div className="w-full py-3 px-4 bg-white/5 border border-[#FFD700]/20 text-[#FFD700] font-semibold rounded-xl flex items-center justify-center gap-2">
      <Clock className="w-4 h-4" />
      Coming Soon
    </div>
  );
}

// Agent Preview Component
const AgentPreview = memo(function AgentPreview({ agents, maxDisplay = 4 }: { agents?: Tournament['agents']; maxDisplay?: number }) {
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
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-20 scale-95 group-hover:scale-100">
              <div className="rounded-xl px-4 py-3 w-56 text-center bg-[#0A2540]/95 border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                <p className="text-white font-semibold text-sm mb-1">{agent.name}</p>
                {(agent.strategy || agentDetails[agent.name]?.strategy) && (
                  <p className="text-[#FFD700] text-xs font-medium mb-1">
                    {agent.strategy || agentDetails[agent.name]?.strategy}
                  </p>
                )}
                {(agent.personality || agentDetails[agent.name]?.personality) && (
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                    {agent.personality || agentDetails[agent.name]?.personality}
                  </p>
                )}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white/10" />
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
});

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

const TournamentCard = memo(function TournamentCard({ tournament, isActive }: { tournament: Tournament; isActive: boolean }) {
  return (
    <motion.div
      className={`relative flex-shrink-0 w-full max-w-lg mx-auto rounded-3xl overflow-visible
        ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'}
        transition-all duration-300`}
    >
      {/* Card Background */}
      <div className="rounded-3xl bg-[#0A2540]/80 border border-white/15 p-6 h-full min-h-[460px]">
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

        {/* Prominent Countdown / Status */}
        <div className="my-4 py-5 px-4 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-[#FFD700]/20 shadow-[inset_0_1px_0_rgba(255,215,0,0.1)]">
          {tournament.status === 'LIVE' ? (
            <LiveStatusDisplay agents={tournament.agents} />
          ) : tournament.status === 'UPCOMING' ? (
            <UpcomingStatusDisplay targetDate={tournament.start_time} />
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-2">Tournament Ended</span>
              <span className="text-gray-500 font-bold text-2xl">Final results are in</span>
            </div>
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
            <div className="w-full py-3 px-4 bg-green-500/10 border border-green-500/30 text-green-400 font-semibold rounded-xl flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" />
              {tournament.agents?.length ?? 0} Agents Trading
            </div>
          )}
          {tournament.status === 'UPCOMING' && (
            <UpcomingActionButton targetDate={tournament.start_time} />
          )}
          {tournament.status === 'ENDED' && (
            <button className="w-full py-3 px-4 bg-white/10 text-gray-300 font-semibold rounded-xl hover:bg-white/20 transition-all">
              View Results
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

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
      <div ref={containerRef} className="overflow-visible px-8">
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
