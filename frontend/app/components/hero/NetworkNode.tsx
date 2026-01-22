'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface NetworkNodeProps {
  id: number;//unique node id for hover/highlight logic
  icon: React.ReactNode;//icon graphic rendered inside bubble
  label: string;//text under bubble
  tooltip: string; //tooltip text shown on hover
  position: { x: number; y: number }; //where to place on hero (%based)
  delay: number; //stagger animation timing across nodes
  isVisible: boolean; //trigger entrance (scale 0 -> 1)
  onHover: (id: number | null) => void;//tells parents which node is hovered
  isHighlighted: boolean;//active or not
}

export default function NetworkNode({
  id,
  icon,
  label,
  tooltip,
  position,
  delay,
  isVisible,
  onHover,
  isHighlighted,
}: NetworkNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = () => {
    // Highlight node and show tooltip on hover.
    setShowTooltip(true);
    onHover(id);
  };

  const handleMouseLeave = () => {
    // Reset highlight on leave.
    setShowTooltip(false);
    onHover(null);
  };

  const nodeVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 1.3 + delay * 0.1,
        duration: 0.4,
        type: 'spring' as const,
        stiffness: 200,
        damping: 15,
      },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 0, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  return (
    //outer wrapping absolute positioning in hero
    <motion.div
      className="absolute cursor-pointer"
      style={{
        // Places node within the hero grid.
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={nodeVariants}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Pulsing rings create ambient activity. */}
      {/* Outer pulse rings */}
      <motion.div
        className="absolute inset-0 rounded-full bg-[#FFD700]/20"
        style={{ margin: '-8px' }}
        variants={pulseVariants}
        animate="pulse"
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-[#FFD700]/10"
        style={{ margin: '-16px' }}
        variants={pulseVariants}
        animate="pulse"
        transition={{ delay: 0.5 }}
      />

      {/* Main node bubble with icon. */}
      {/* Main node container */}
      <motion.div
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center
          bg-gradient-to-br from-[#1E3A8A]/80 to-[#0A2540]/90
          border-2 backdrop-blur-sm
          transition-all duration-300
          ${isHighlighted
            ? 'border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.5)]'
            : 'border-white/20 shadow-lg'
          }
        `}
        whileHover={{
          scale: 1.15,
          borderColor: '#FFD700',
          boxShadow: '0 0 30px rgba(255,215,0,0.6)',
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Icon */}
        <div className={`text-2xl transition-colors duration-300 ${isHighlighted ? 'text-[#FFD700]' : 'text-white'}`}>
          {icon}
        </div>

        {/* Active dot reinforces "live" status. */}
        {/* Active indicator dot */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FFD700]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Label anchors the node's meaning. */}
      {/* Label */}
      <motion.span
        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs text-white/70 whitespace-nowrap font-medium"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 + delay * 0.1 }}
      >
        {label}
      </motion.span>

      {/* Tooltip explains the node on hover. */}
      {/* Tooltip */}
      <motion.div
        className={`
          absolute bottom-full mb-3 left-1/2 -translate-x-1/2
          px-4 py-2 rounded-lg
          bg-[#0A2540]/95 border border-[#FFD700]/30
          backdrop-blur-md shadow-xl
          text-sm text-white whitespace-nowrap
          pointer-events-none z-50
        `}
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{
          opacity: showTooltip ? 1 : 0,
          y: showTooltip ? 0 : 10,
          scale: showTooltip ? 1 : 0.9,
        }}
        transition={{ duration: 0.2 }}
      >
        {tooltip}
        {/* Tooltip arrow */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(255, 215, 0, 0.3)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// Icon components for nodes
export function AgentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M15 3a3 3 0 0 1 0 6" strokeDasharray="3 3" />
    </svg>
  );
}

export function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-4-4-3 3" />
    </svg>
  );
}

export function WalletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M16 12h.01" />
      <path d="M2 10h20" />
    </svg>
  );
}

export function TrophyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 22V8a4 4 0 0 1 8 0v14" />
      <path d="M8 8h8" />
      <path d="M12 8v6" />
    </svg>
  );
}

export function BetIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="12" r="2" />
    </svg>
  );
}
