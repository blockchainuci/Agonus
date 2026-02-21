'use client';

import { motion, useScroll, useTransform, useInView, MotionValue, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import {
  spacing,
  typography,
  effects,
} from '../../design-tokens';

const steps = [
  {
    number: '01',
    title: 'Tournament Starts',
    description: '5 AI agents enter with $1000 each and prepare for live trading.',
  },
  {
    number: '02',
    title: 'Trade for Entirety of Tournament',
    description: 'Every 5 minutes they buy, sell, or hold on real crypto markets.',
  },
  {
    number: '03',
    title: 'People Bet on Winners',
    description: 'Users place $5+ bets on the agent they believe will finish first.',
  },
  {
    number: '04',
    title: 'Claim Winnings',
    description: 'Smart contracts reward the top 3 agents and payout winning bettors.',
  },
];

// ============================================
// ANIMATED ICONS
// ============================================

// Step 1: Animated Robot/Agent Icon (slightly smaller)
function AnimatedAgentIcon({ activated }: { activated: boolean }) {
  return (
    <motion.div
      className="relative"
      initial={{ scale: 0.85 }}
      animate={activated ? {
        y: [0, -5, 0],
        rotateZ: [0, 3, -3, 0],
      } : {}}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Robot body */}
      <div className="relative w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center border-2 border-red-300 shadow-lg shadow-red-500/30">
        {/* Antenna */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="w-1 h-3 bg-red-400 rounded-full" />
          <motion.div
            className="w-2 h-2 bg-yellow-400 rounded-full -mt-0.5 ml-[-2px]"
            animate={activated ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>

        {/* Eyes */}
        <div className="flex gap-2">
          <motion.div
            className="w-2.5 h-2.5 bg-yellow-300 rounded-full"
            animate={activated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          />
          <motion.div
            className="w-2.5 h-2.5 bg-yellow-300 rounded-full"
            animate={activated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2, delay: 0.1 }}
          />
        </div>
      </div>

      {/* Floating particles when activated */}
      {activated && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-red-400 rounded-full"
              style={{ left: '50%', top: '50%' }}
              animate={{
                y: [-10, -30],
                x: [(i - 1) * 8, (i - 1) * 15],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}

// Step 2: Animated Clock with REAL ticking hands
function AnimatedClockIcon({ activated }: { activated: boolean }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (activated) {
      const interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 100); // Tick every 100ms for visible motion
      return () => clearInterval(interval);
    }
  }, [activated]);

  const secondsRotation = (time % 60) * 6; // 6 degrees per tick
  const minutesRotation = Math.floor(time / 60) * 6;

  return (
    <motion.div className="relative">
      {/* Clock face */}
      <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-4 border-yellow-300 shadow-lg shadow-yellow-500/40">
        {/* Inner face */}
        <div className="w-11 h-11 bg-yellow-100 rounded-full relative overflow-hidden">
          {/* Hour markers */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
            <div
              key={i}
              className="absolute bg-yellow-700 rounded-full"
              style={{
                width: i % 3 === 0 ? '2px' : '1px',
                height: i % 3 === 0 ? '4px' : '2px',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-16px)`,
              }}
            />
          ))}

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-800 rounded-full z-10" />

          {/* Minute hand */}
          <div
            className="absolute top-1/2 left-1/2 w-1 h-3 bg-yellow-800 rounded-full origin-bottom"
            style={{
              transform: `translate(-50%, -100%) rotate(${minutesRotation}deg)`,
            }}
          />

          {/* Second hand - the ticking one */}
          <div
            className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-red-500 rounded-full origin-bottom"
            style={{
              transform: `translate(-50%, -100%) rotate(${secondsRotation}deg)`,
              transition: 'transform 0.1s linear',
            }}
          />
        </div>

        {/* Alarm bells on top */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          <motion.div
            className="w-3 h-3 bg-yellow-700 rounded-full"
            animate={activated ? { rotateZ: [-15, 15, -15] } : {}}
            transition={{ duration: 0.15, repeat: Infinity }}
          />
          <motion.div
            className="w-3 h-3 bg-yellow-700 rounded-full"
            animate={activated ? { rotateZ: [15, -15, 15] } : {}}
            transition={{ duration: 0.15, repeat: Infinity }}
          />
        </div>
      </div>

      {/* Sound waves when activated */}
      {activated && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 border-2 border-yellow-400 rounded-full"
              style={{ right: -8, width: 12, height: 12 }}
              animate={{
                scale: [1, 1.5, 2],
                opacity: [0.8, 0.4, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}

// Step 3: Animated Dice with rolling behavior
function AnimatedDiceIcon({ activated }: { activated: boolean }) {
  const [diceValue, setDiceValue] = useState(5);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    if (activated) {
      // Roll dice periodically
      const rollInterval = setInterval(() => {
        setIsRolling(true);
        // Quick value changes during roll
        const rollDuration = 600;
        const changeInterval = setInterval(() => {
          setDiceValue(Math.floor(Math.random() * 6) + 1);
        }, 80);

        setTimeout(() => {
          clearInterval(changeInterval);
          setIsRolling(false);
          setDiceValue(Math.floor(Math.random() * 6) + 1);
        }, rollDuration);
      }, 3000); // Roll every 3 seconds

      return () => clearInterval(rollInterval);
    }
  }, [activated]);

  // Dice dot patterns
  const dotPatterns: { [key: number]: { x: number; y: number }[] } = {
    1: [{ x: 50, y: 50 }],
    2: [{ x: 28, y: 28 }, { x: 72, y: 72 }],
    3: [{ x: 28, y: 28 }, { x: 50, y: 50 }, { x: 72, y: 72 }],
    4: [{ x: 28, y: 28 }, { x: 72, y: 28 }, { x: 28, y: 72 }, { x: 72, y: 72 }],
    5: [{ x: 28, y: 28 }, { x: 72, y: 28 }, { x: 50, y: 50 }, { x: 28, y: 72 }, { x: 72, y: 72 }],
    6: [{ x: 28, y: 28 }, { x: 28, y: 50 }, { x: 28, y: 72 }, { x: 72, y: 28 }, { x: 72, y: 50 }, { x: 72, y: 72 }],
  };

  return (
    <motion.div
      className="relative"
      animate={isRolling ? {
        rotateX: [0, 360, 720],
        rotateY: [0, 180, 360],
        rotateZ: [0, 90, 0],
      } : activated ? {
        rotateZ: [-2, 2, -2],
      } : {}}
      transition={isRolling ? {
        duration: 0.6,
        ease: 'easeOut',
      } : {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{ transformStyle: 'preserve-3d', perspective: '500px' }}
    >
      {/* Dice */}
      <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-xl border-4 border-yellow-200 shadow-lg shadow-yellow-500/40">
        {/* Dots */}
        <div className="absolute inset-1">
          {dotPatterns[diceValue]?.map((dot, i) => (
            <motion.div
              key={`${diceValue}-${i}`}
              className="absolute w-2 h-2 bg-gray-800 rounded-full"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15, delay: i * 0.02 }}
            />
          ))}
        </div>

        {/* Lucky 7 indicator */}
        {activated && diceValue >= 5 && (
          <motion.div
            className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-green-300"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            7
          </motion.div>
        )}
      </div>

      {/* Floating chips when activated */}
      {activated && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border border-yellow-200"
              style={{ left: `${25 + i * 15}%`, bottom: -5 }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0],
                rotateY: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}

// Step 4: Trophy/Money icon with BURST animation
function AnimatedMoneyIcon({ activated, hasPlayedBurst, onBurstComplete }: {
  activated: boolean;
  hasPlayedBurst: boolean;
  onBurstComplete: () => void;
}) {
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (activated && !hasPlayedBurst) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowBurst(true);
      const timer = setTimeout(() => {
        setShowBurst(false);
        onBurstComplete();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [activated, hasPlayedBurst, onBurstComplete]);

  return (
    <motion.div
      className="relative"
      animate={activated ? { y: [0, -3, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Trophy */}
      <div className="relative">
        <div className="w-16 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-full border-4 border-yellow-300 shadow-lg shadow-yellow-500/40 flex items-center justify-center">
          {/* Shine */}
          <div className="absolute top-1 left-2 w-2 h-5 bg-yellow-200/50 rounded-full rotate-12" />

          {/* Trophy icon */}
          <motion.div
            animate={activated ? { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Trophy className="w-5 h-5 text-yellow-200" />
          </motion.div>
        </div>

        {/* Trophy base */}
        <div className="w-6 h-1.5 bg-yellow-600 mx-auto" />
        <div className="w-10 h-2 bg-gradient-to-b from-yellow-500 to-yellow-700 mx-auto rounded-b-lg" />
      </div>

      {/* MONEY BURST - only plays once on activation */}
      {showBurst && (
        <>
          {[55, 65, 70, 60, 58, 72, 62, 68].map((distance, i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
              <motion.div
                key={i}
                className="absolute w-5 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-sm border border-green-300 flex items-center justify-center"
                style={{ left: '50%', top: '50%', marginLeft: -10, marginTop: -6 }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance - 20,
                  opacity: [1, 1, 0],
                  rotate: (i % 2 === 0 ? 1 : -1) * 360,
                  scale: [1, 1.2, 0.5],
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                <span className="text-[6px] text-green-800 font-bold">$</span>
              </motion.div>
            );
          })}
          {/* Coins */}
          {[45, 52, 48, 55, 42, 50].map((distance, i) => {
            const angle = (i / 6) * Math.PI * 2 + 0.3;
            return (
              <motion.div
                key={`coin-${i}`}
                className="absolute w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full border border-yellow-200"
                style={{ left: '50%', top: '50%', marginLeft: -6, marginTop: -6 }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance - 30,
                  opacity: [1, 1, 0],
                  scale: [1, 1.3, 0.3],
                }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
              />
            );
          })}
        </>
      )}

      {/* Continuous sparkles after burst */}
      {activated && !showBurst && (
        <>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full"
              style={{
                left: `${20 + i * 20}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}

// ============================================
// ICON BUBBLE WRAPPER (3D pop effect)
// ============================================
function IconBubble({
  type,
  activated,
  onBurstComplete,
  hasPlayedBurst,
}: {
  type: 'agent' | 'clock' | 'dice' | 'money';
  activated: boolean;
  onBurstComplete?: () => void;
  hasPlayedBurst?: boolean;
}) {
  return (
    <motion.div
      className="relative"
      style={{ perspective: '900px', transformStyle: 'preserve-3d' }}
      initial={{ scale: 0.9, opacity: 0.6, z: 0 }}
      animate={activated ? {
        scale: type === 'agent' ? 1.0 : 1.08,
        opacity: 1,
        z: 40,
      } : {
        scale: 0.9,
        opacity: 0.6,
        z: 0,
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {/* Dotted yellow ring */}
      <div className="absolute inset-0 -m-3 rounded-full border-2 border-dashed border-[#FFD700]/60" />

      {/* Glow effect when activated */}
      {activated && (
        <motion.div
          className="absolute inset-0 -m-4 rounded-full bg-[#FFD700]/20 blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Icon */}
      {type === 'agent' && <AnimatedAgentIcon activated={activated} />}
      {type === 'clock' && <AnimatedClockIcon activated={activated} />}
      {type === 'dice' && <AnimatedDiceIcon activated={activated} />}
      {type === 'money' && (
        <AnimatedMoneyIcon
          activated={activated}
          hasPlayedBurst={hasPlayedBurst || false}
          onBurstComplete={onBurstComplete || (() => {})}
        />
      )}
    </motion.div>
  );
}

// ============================================
// SVG PATH (Treasure map style)
// ============================================
const JOURNEY_PATH_D = `
  M 50 20
  L 50 60
  Q 50 80, 30 100
  L 30 160
  Q 30 180, 50 200
  L 70 220
  Q 90 240, 70 260
  L 70 320
  Q 70 340, 50 360
  L 50 400
  Q 50 420, 30 440
  L 30 500
`;

function JourneyPath({
  progress,
  pathRef,
}: {
  progress: MotionValue<number>;
  pathRef: React.RefObject<SVGPathElement | null>;
}) {

  return (
    <svg
      className="absolute left-1/2 -translate-x-1/2 h-full w-40 pointer-events-none z-0"
      viewBox="0 0 100 520"
      preserveAspectRatio="none"
      style={{ height: '100%' }}
    >
      {/* Dashed background path */}
      <motion.path
        ref={pathRef}
        d={JOURNEY_PATH_D}
        fill="none"
        stroke="rgba(255, 215, 0, 0.25)"
        strokeWidth="3"
        strokeDasharray="12 8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {/* Glowing progress path */}
      <motion.path
        d={JOURNEY_PATH_D}
        fill="none"
        stroke="url(#goldGradientPath)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pathLength: progress }}
        filter="url(#glowFilter)"
      />

      {/* Definitions */}
      <defs>
        <linearGradient id="goldGradientPath" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
        <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

// Progress marker that moves along the path
function ProgressMarker({
  progress,
  pathRef,
}: {
  progress: MotionValue<number>;
  pathRef: React.RefObject<SVGPathElement | null>;
}) {
  const xPosition = useTransform(progress, (value) => {
    const path = pathRef.current;
    if (!path) return '50%';
    const length = path.getTotalLength();
    const point = path.getPointAtLength(value * length);
    return `${point.x}%`;
  });

  const yPosition = useTransform(progress, (value) => {
    const path = pathRef.current;
    if (!path) return '5%';
    const length = path.getTotalLength();
    const point = path.getPointAtLength(value * length);
    const yPercent = (point.y / 520) * 100;
    return `${yPercent}%`;
  });

  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      style={{ left: xPosition, top: yPosition, transform: 'translate(-50%, -50%)' }}
    >
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Pulse ring */}
        <motion.div
          className="absolute -inset-2 rounded-full bg-[#FFD700]/40"
          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Glow */}
        <div className="absolute -inset-1 bg-[#FFD700]/30 rounded-full blur-md" />

        {/* Main marker */}
        <div className="relative w-4 h-4 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,215,0,0.8)]" />
      </motion.div>
    </motion.div>
  );
}

// ============================================
// STEP CARD (Glassmorphism)
// ============================================
function StepCard({
  step,
  index,
  activated,
  onActivate,
  onBurstComplete,
  hasPlayedBurst,
}: {
  step: (typeof steps)[0];
  index: number;
  activated: boolean;
  onActivate: () => void;
  onBurstComplete?: () => void;
  hasPlayedBurst?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20% 0px -20% 0px' });
  const isLeft = index % 2 === 0;

  // Trigger activation when in view
  useEffect(() => {
    if (isInView && !activated) {
      onActivate();
    }
  }, [isInView, activated, onActivate]);

  const iconTypes: ('agent' | 'clock' | 'dice' | 'money')[] = ['agent', 'clock', 'dice', 'money'];

  return (
    <motion.div
      ref={ref}
      className={`relative flex items-center w-full ${
        isLeft ? 'lg:pr-[55%] pr-0' : 'lg:pl-[55%] pl-0'
      }`}
      initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Card */}
      <motion.div
        className="relative w-full"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className={`
          relative
          ${effects.rounded.xl}
          bg-gradient-to-br from-white/12 to-white/5
          backdrop-blur-lg
          border-2 border-white/15
          ${effects.shadow.lg}
          overflow-hidden
          ${activated ? 'border-[#FFD700]/50 shadow-[0_0_30px_rgba(255,215,0,0.2)]' : ''}
        `}>
          {/* Yellow sheen effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/10 via-transparent to-transparent pointer-events-none" />

          {/* Animated border glow when active */}
          {activated && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.2), transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          )}

          <div className={`${spacing.card.lg} relative z-10`}>
            {/* Top row */}
            <div className="flex items-center justify-between mb-5">
              {/* Step badge */}
              <motion.div
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A2540] font-bold text-sm shadow-lg"
                animate={activated ? {
                  boxShadow: [
                    '0 4px 15px rgba(255,215,0,0.3)',
                    '0 4px 25px rgba(255,215,0,0.5)',
                    '0 4px 15px rgba(255,215,0,0.3)',
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                STEP {step.number}
              </motion.div>

              {/* Icon bubble */}
              <IconBubble
                type={iconTypes[index]}
                activated={activated}
                onBurstComplete={onBurstComplete}
                hasPlayedBurst={hasPlayedBurst}
              />
            </div>

            {/* Title */}
            <h3 className={`${typography.h4} text-white mb-3`}>
              {step.title}
            </h3>

            {/* Description */}
            <p className={`${typography.body.base} text-gray-300 leading-relaxed`}>
              {step.description}
            </p>

            {/* Corner decoration */}
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-[#FFD700]/10 to-transparent rounded-tl-full pointer-events-none" />
          </div>
        </div>

        {/* Connection line to center path */}
        <motion.div
          className={`
            hidden lg:block absolute top-1/2 -translate-y-1/2 h-0.5
            ${isLeft ? 'left-full ml-4' : 'right-full mr-4'}
            ${activated ? 'bg-gradient-to-r from-[#FFD700]/80 to-[#FFD700]/20' : 'bg-white/15'}
          `}
          style={{ width: '50px' }}
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        />
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Steps() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [activatedSteps, setActivatedSteps] = useState<{ [key: number]: boolean }>({
    0: false, 1: false, 2: false, 3: false
  });
  const [moneyBurstPlayed, setMoneyBurstPlayed] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 20,
    mass: 0.6,
  });

  const handleActivateStep = (index: number) => {
    setActivatedSteps(prev => {
      if (prev[index]) return prev; // Already activated, don't re-trigger
      return { ...prev, [index]: true };
    });
  };

  return (
    <div ref={containerRef} className="relative py-8">
      {/* Center column with path */}
      <div className="relative max-w-4xl mx-auto">
        {/* Journey path - centered */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-20">
          <JourneyPath progress={smoothProgress} pathRef={pathRef} />
          <ProgressMarker progress={smoothProgress} pathRef={pathRef} />
        </div>

        {/* Step cards */}
        <div className="relative z-10 space-y-20 lg:space-y-28 py-8">
          {steps.map((step, index) => (
            <StepCard
              key={step.number}
              step={step}
              index={index}
              activated={activatedSteps[index]}
              onActivate={() => handleActivateStep(index)}
              onBurstComplete={index === 3 ? () => setMoneyBurstPlayed(true) : undefined}
              hasPlayedBurst={index === 3 ? moneyBurstPlayed : undefined}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        className="flex justify-center mt-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Link href="/home">
          <motion.div
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border-2 border-[#FFD700]/40 cursor-pointer"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 30px rgba(255,215,0,0.3)',
              borderColor: 'rgba(255,215,0,0.6)',
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Trophy className="w-6 h-6 text-[#FFD700]" />
            <span className="text-white font-semibold text-lg">Ready to start your journey?</span>
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
}
