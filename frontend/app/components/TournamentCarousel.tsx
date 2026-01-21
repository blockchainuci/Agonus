'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trophy, Users, Clock, Zap } from 'lucide-react';
import { Tournament } from './ui/tournaments';
import { effects } from '../design-tokens';

interface TournamentCarouselProps {
  tournaments: Tournament[];
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTimeRemaining(endTime: string) {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
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

function TournamentCard({ tournament, isActive }: { tournament: Tournament; isActive: boolean }) {
  return (
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Participants */}
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm">
              {tournament.participants}/{tournament.max_participants} Agents
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-sm">
              {tournament.status === 'UPCOMING'
                ? `Starts ${formatDate(tournament.start_time)}`
                : tournament.status === 'LIVE'
                ? getTimeRemaining(tournament.end_time)
                : `Ended ${formatDate(tournament.end_time)}`}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          {tournament.status === 'LIVE' && (
            <button className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              Watch Live
            </button>
          )}
          {tournament.status === 'UPCOMING' && (
            <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all">
              Set Reminder
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
