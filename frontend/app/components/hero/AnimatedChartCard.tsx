'use client';

// Floating glass card used in the hero background.
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

// Props from the hero section to position and highlight the card.
interface AnimatedChartCardProps {
  type: 'line' | 'bar'; // Chart type to render.
  title: string; // Header label.
  position: 'left' | 'right'; // Screen side placement.
  delay: number; // Staggered entrance timing.
  isVisible: boolean; // Triggers entrance animation.
  isHighlighted: boolean; // External highlight state.
  onHover: (isHovered: boolean) => void; // Notify parent for route highlight.
  connectedRouteIndex: number; // Connected route index (used by parent).
}

export default function AnimatedChartCard({
  type,
  title,
  position,
  delay,
  isVisible,
  isHighlighted,
  onHover,
}: AnimatedChartCardProps) {
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);

  // Start entrance when the hero section becomes visible.
  useEffect(() => {
    if (isVisible) {
      controls.start('visible');
    }
  }, [isVisible, controls]);

  // Slide/fade in from the side with a slight 3D turn.
  const cardVariants = {
    hidden: {
      x: position === 'left' ? -100 : 100,
      opacity: 0,
      rotateY: position === 'left' ? -15 : 15,
    },
    visible: {
      x: 0,
      opacity: 1,
      rotateY: 0,
      transition: {
        delay: 1.0 + delay * 0.15,
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  const handleMouseEnter = () => {
    // Highlight card and connected route.
    setIsHovered(true);
    onHover(true);
  };

  const handleMouseLeave = () => {
    // Remove highlight on exit.
    setIsHovered(false);
    onHover(false);
  };

  return (
    <motion.div
      className={`
        absolute
        ${position === 'left' ? 'left-[5%]' : 'right-[5%]'}
        ${position === 'left' ? 'top-[25%]' : 'top-[60%]'}
        w-48 h-32 perspective-1000
      `}
      initial="hidden"
      animate={controls}
      variants={cardVariants}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className={`
          relative w-full h-full rounded-xl
          bg-gradient-to-br from-[#1E3A8A]/60 to-[#0A2540]/80
          border backdrop-blur-md
          overflow-hidden
          transition-all duration-300
          ${isHighlighted || isHovered
            ? 'border-[#FFD700]/50 shadow-[0_0_25px_rgba(255,215,0,0.3)]'
            : 'border-white/10 shadow-xl'
          }
        `}
        // Subtle 3D tilt for depth on hover.
        whileHover={{
          rotateX: 5,
          rotateY: position === 'left' ? 10 : -10,
          scale: 1.05,
        }}
        style={{ transformStyle: 'preserve-3d' }}
        transition={{ duration: 0.3 }}
      >
        {/* Header bar with live indicator dot. */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">{title}</span>
            <motion.div
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ scale: [1, 2.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Chart body: line or bars. */}
        <div className="p-3 h-[calc(100%-2rem)]">
          {type === 'line' ? (
            <LineChart isActive={isHighlighted || isHovered} />
          ) : (
            <BarChart isActive={isHighlighted || isHovered} />
          )}
        </div>

        {/* Shine sweep to emphasize hover. */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '200%' : '-100%' }}
          transition={{ duration: 0.6 }}
        />
      </motion.div>
    </motion.div>
  );
}

// SVG line chart used inside the card.
function LineChart({ isActive }: { isActive: boolean }) {
  const points = [
    { x: 10, y: 60 },
    { x: 20, y: 45 },
    { x: 40, y: 55 },
    { x: 60, y: 30 },
    { x: 80, y: 40 },
    { x: 100, y: 20 },
    { x: 120, y: 35 },
    { x: 140, y: 15 },
  ];

  // Path for the line and its filled area.
  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');
  const areaD = `${pathD} L 140 70 L 0 70 Z`;

  return (
    <svg className="w-full h-full" viewBox="0 0 150 75" preserveAspectRatio="none">
      <defs>
        {/* Gold gradients match brand accent. */}
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid adds depth and scale. */}
      {[0, 25, 50].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="150"
          y2={y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.5"
        />
      ))}

      {/* Area glow under the line. */}
      <motion.path
        d={areaD}
        fill="url(#areaGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />

      {/* Draw the line on entrance. */}
      <motion.path
        d={pathD}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />

      {/* Moving dot signals "live" activity. */}
      {isActive && (
        <motion.circle
          r="4"
          fill="#FFD700"
          filter="drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))"
        >
          <animateMotion dur="3s" repeatCount="indefinite" path={pathD} />
        </motion.circle>
      )}

      {/* Points add detail along the line. */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="2"
          fill="#FFD700"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + i * 0.05 }}
        />
      ))}
    </svg>
  );
}

// SVG bar chart used inside the card.
function BarChart({ isActive }: { isActive: boolean }) {
  const bars = [
    { height: 70, color: '#FFD700' },
    { height: 60, color: '#FFD700' },
    { height: 35, color: '#FFD700' },
    { height: 75, color: '#FFD700' },
    { height: 50, color: '#FFD700' },
    { height: 65, color: '#FFD700' },
  ];

  return (
    <svg className="w-full h-full" viewBox="0 0 150 75" preserveAspectRatio="none">
      <defs>
        {/* Vertical gradient for bar depth. */}
        <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Grid adds depth and scale. */}
      {[0, 25, 50].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="150"
          y2={y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.5"
        />
      ))}

      {/* Bars grow in and pulse when active. */}
      {bars.map((bar, i) => (
        <motion.g key={i}>
          <motion.rect
            x={10 + i * 23}
            y={75 - bar.height}
            width="18"
            height={bar.height}
            fill="url(#barGradient)"
            rx="2"
            initial={{ scaleY: 0 }}
            animate={{
              scaleY: 1,
              opacity: isActive ? [0.7, 1, 0.7] : 1,
            }}
            transition={{
              scaleY: { delay: 0.2 + i * 0.08, duration: 0.4 },
              opacity: isActive
                ? { duration: 1, repeat: Infinity, delay: i * 0.1 }
                : {},
            }}
            style={{ transformOrigin: 'bottom' }}
          />

          {/* Values show only when active. */}
          {isActive && (
            <motion.text
              x={19 + i * 23}
              y={75 - bar.height - 5}
              fill="#FFD700"
              fontSize="8"
              textAnchor="middle"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
            >
              {bar.height}
            </motion.text>
          )}
        </motion.g>
      ))}
    </svg>
  );
}
