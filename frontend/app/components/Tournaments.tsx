'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Trophy, Clock, Zap, Bell } from 'lucide-react';
import { spacing, typography, layout, animations } from '../design-tokens';
import TournamentCarousel from './TournamentCarousel';
import { tournaments, Tournament } from './ui/tournaments';

// Big countdown timer hook
function useBigCountdown(targetDate: string) {
  const calculateTimeLeft = () => {
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
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

// Big countdown unit component
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="w-20 h-24 sm:w-28 sm:h-32 bg-gradient-to-b from-[#1E3A8A]/80 to-[#0A2540]/90 rounded-2xl border border-[#FFD700]/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.15)]">
          <span className="text-4xl sm:text-6xl font-bold text-[#FFD700] font-mono">
            {String(value).padStart(2, '0')}
          </span>
        </div>
        {/* Reflection effect */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 sm:w-24 h-4 bg-[#FFD700]/10 rounded-full blur-lg" />
      </motion.div>
      <span className="mt-3 text-xs sm:text-sm text-gray-400 uppercase tracking-widest font-medium">
        {label}
      </span>
    </div>
  );
}

// Featured Countdown Section
function FeaturedCountdown({ tournament }: { tournament: Tournament }) {
  const { days, hours, minutes, seconds, expired } = useBigCountdown(
    tournament.status === 'LIVE' ? tournament.end_time : tournament.start_time
  );

  if (expired && tournament.status !== 'LIVE') {
    return null;
  }

  const isLive = tournament.status === 'LIVE';

  return (
    <motion.div
      className="mb-16 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#001D3D]/80 to-[#003566]/60 border border-white/10 backdrop-blur-xl relative overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Status badge */}
      <div className="flex justify-center mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          isLive
            ? 'bg-green-500/20 border border-green-500/30'
            : 'bg-blue-500/20 border border-blue-500/30'
        }`}>
          {isLive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-semibold text-green-400 uppercase tracking-wider">Live Now</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Coming Soon</span>
            </>
          )}
        </div>
      </div>

      {/* Tournament name */}
      <h3 className="text-2xl sm:text-4xl font-bold text-white text-center mb-2">
        {tournament.name}
      </h3>

      {/* Prize pool */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <Trophy className="w-5 h-5 text-[#FFD700]" />
        <span className="text-xl sm:text-2xl font-bold text-[#FFD700]">
          ${tournament.prize_pool_usd.toLocaleString()} Prize Pool
        </span>
      </div>

      {/* Countdown label */}
      <p className="text-center text-gray-400 mb-6 text-sm sm:text-base">
        {isLive ? 'Tournament ends in:' : 'Tournament starts in:'}
      </p>

      {/* Big countdown timer */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 relative z-10">
        <CountdownUnit value={days} label="Days" />
        <div className="text-3xl sm:text-5xl font-bold text-[#FFD700]/50 self-start mt-6 sm:mt-8">:</div>
        <CountdownUnit value={hours} label="Hours" />
        <div className="text-3xl sm:text-5xl font-bold text-[#FFD700]/50 self-start mt-6 sm:mt-8">:</div>
        <CountdownUnit value={minutes} label="Minutes" />
        <div className="text-3xl sm:text-5xl font-bold text-[#FFD700]/50 self-start mt-6 sm:mt-8">:</div>
        <CountdownUnit value={seconds} label="Seconds" />
      </div>

      {/* CTA Button */}
      <div className="flex justify-center mt-10">
        {isLive ? (
          <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <Zap className="w-5 h-5" />
            Watch Live Tournament
          </button>
        ) : (
          <button className="px-8 py-4 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A2540] font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all flex items-center gap-3">
            <Bell className="w-5 h-5" />
            Get Notified When It Starts
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Tournaments() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Parallax transforms
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Find the featured tournament (first LIVE, or first UPCOMING)
  const featuredTournament = tournaments.find(t => t.status === 'LIVE')
    || tournaments.find(t => t.status === 'UPCOMING');

  // Filter out ended tournaments for carousel, or show all
  const activeTournaments = tournaments.filter(t => t.status !== 'ENDED');
  const displayTournaments = activeTournaments.length > 0 ? activeTournaments : tournaments;

  return (
    <section
      id="tournaments"
      ref={ref}
      className={`${spacing.section.x} ${spacing.section.y} relative overflow-hidden`}
    >
      {/* Background pattern that moves with parallax */}
      <motion.div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ y }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </motion.div>

      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <motion.div
        className={`${layout.container['2xl']} mx-auto relative z-10`}
        style={{ opacity }}
      >
        {/* Heading */}
        <motion.div
          className="text-center mb-12"
          initial={animations.fadeInUp.initial}
          whileInView={animations.fadeInUp.animate}
          viewport={{ once: true }}
          transition={animations.fadeInUp.transition}
        >
          <h2 className={`${typography.h2} text-white ${spacing.subtitleGap}`}>
            Tournaments
          </h2>
          <p className={`${typography.tagline} max-w-3xl mx-auto`}>
            Watch <span className="text-[#FFD700]">AI agents</span> compete in
            live trading competitions
          </p>
        </motion.div>

        {/* Featured Countdown Section */}
        {featuredTournament && (
          <FeaturedCountdown tournament={featuredTournament} />
        )}

        {/* Tournament Carousel - shows remaining tournaments */}
        {displayTournaments.length > 1 && (
          <>
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-xl font-semibold text-white mb-2">More Tournaments</h3>
              <p className="text-gray-400 text-sm">Browse all upcoming and live competitions</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <TournamentCarousel tournaments={displayTournaments} />
            </motion.div>
          </>
        )}

        {/* Additional Info */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-gray-400 text-sm">
            Set notifications to never miss a tournament.{' '}
            <span className="text-[#FFD700]">New competitions added weekly.</span>
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
