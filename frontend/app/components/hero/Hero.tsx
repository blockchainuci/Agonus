'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import PlayRoutes from './PlayRoutes';
import NetworkNode, {
  AgentIcon,
  ChartIcon,
  WalletIcon,
  TrophyIcon,
  BetIcon,
} from './NetworkNode';
import AnimatedChartCard from './AnimatedChartCard';

// Ambient particles for the hero background.
const PARTICLES = [
  { id: 0, left: 12, top: 23, duration: 3.5, delay: 0.2 },
  { id: 1, left: 45, top: 67, duration: 4.1, delay: 0.8 },
  { id: 2, left: 78, top: 34, duration: 3.2, delay: 1.5 },
  { id: 3, left: 23, top: 89, duration: 4.5, delay: 0.4 },
  { id: 4, left: 56, top: 12, duration: 3.8, delay: 1.1 },
  { id: 5, left: 89, top: 56, duration: 4.3, delay: 0.6 },
  { id: 6, left: 34, top: 45, duration: 3.1, delay: 1.8 },
  { id: 7, left: 67, top: 78, duration: 4.7, delay: 0.3 },
  { id: 8, left: 11, top: 90, duration: 3.6, delay: 1.2 },
  { id: 9, left: 92, top: 22, duration: 4.0, delay: 0.9 },
  { id: 10, left: 28, top: 55, duration: 3.4, delay: 1.6 },
  { id: 11, left: 61, top: 33, duration: 4.2, delay: 0.5 },
  { id: 12, left: 44, top: 88, duration: 3.9, delay: 1.3 },
  { id: 13, left: 77, top: 11, duration: 4.4, delay: 0.7 },
  { id: 14, left: 15, top: 66, duration: 3.3, delay: 1.9 },
  { id: 15, left: 88, top: 44, duration: 4.6, delay: 0.1 },
  { id: 16, left: 33, top: 77, duration: 3.7, delay: 1.4 },
  { id: 17, left: 66, top: 22, duration: 4.8, delay: 0.0 },
  { id: 18, left: 50, top: 50, duration: 3.0, delay: 1.7 },
  { id: 19, left: 95, top: 85, duration: 4.9, delay: 1.0 },
];

// Node positions for the interactive network layer.
const nodes = [
  {
    id: 0,
    icon: <AgentIcon />,
    label: 'AI Agents',
    tooltip: 'Autonomous trading agents',
    position: { x: 22, y: 30 },
  },
  {
    id: 1,
    icon: <ChartIcon />,
    label: 'Analytics',
    tooltip: 'Real-time performance metrics',
    position: { x: 73, y: 14 },
  },
  {
    id: 2,
    icon: <WalletIcon />,
    label: 'Wallet',
    tooltip: 'Secure Web3 integration',
    position: { x: 13, y: 50 },
  },
  {
    id: 3,
    icon: <TrophyIcon />,
    label: 'Tournaments',
    tooltip: 'Compete for prizes',
    position: { x: 85, y: 44 },
  },
  {
    id: 4,
    icon: <BetIcon />,
    label: 'Betting',
    tooltip: 'Place strategic bets',
    position: { x: 21, y: 90 },
  },
];

export default function Hero() {
  const ref = useRef(null);
  const isVisible = true; // Always visible on mount
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<'left' | 'right' | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Parallax transforms for background layers.
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0]);



  // Map hovered nodes/cards to route highlights.
  const getHighlightedRoute = () => {
    if (hoveredNode !== null) {
      // Map nodes to routes
      const nodeToRoute: { [key: number]: number } = {
        0: 0, // Agent -> Route 1
        1: 1, // Analytics -> Route 2
        2: 2, // Wallet -> Route 3
        3: 3, // Tournaments -> Route 4
        4: 4, // Betting -> Route 5
      };
      return nodeToRoute[hoveredNode] ?? null;
    }
    if (hoveredCard === 'left') return 2;
    if (hoveredCard === 'right') return 3;
    return null;
  };

  return (
    <section
      id="home"
      ref={ref}
      className="relative flex flex-col items-center justify-center text-center overflow-hidden min-h-screen"
      style={{
        // Deep blue gradient sets the hero mood.
        background: 'linear-gradient(180deg, #0a1929 0%, #0A2540 50%, #0a1929 100%)',
      }}
    >
      {/* ========== LAYER 1: Background ========== */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: y1 }}
      >
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.08),transparent_60%)]" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,215,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,215,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Ambient particles */}
        {PARTICLES.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full bg-[#FFD700]/30"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </motion.div>

      {/* ========== LAYER 2: Play Routes (Football-style SVG) ========== */}
      <div className="absolute inset-0 pointer-events-none">
        <PlayRoutes
          isVisible={isVisible}
          highlightedRoute={getHighlightedRoute()}
        />
      </div>

      {/* ========== LAYER 3: Graph Cards ========== */}
      <motion.div className="absolute inset-0" style={{ y: y2 }}>
        <AnimatedChartCard
          type="line"
          title="Performance"
          position="left"
          delay={0}
          isVisible={isVisible}
          isHighlighted={hoveredNode === 0 || hoveredNode === 2}
          onHover={(isHovered) => setHoveredCard(isHovered ? 'left' : null)}
          connectedRouteIndex={2}
        />
        <AnimatedChartCard
          type="bar"
          title="Winnings"
          position="right"
          delay={1}
          isVisible={isVisible}
          isHighlighted={hoveredNode === 1 || hoveredNode === 3}
          onHover={(isHovered) => setHoveredCard(isHovered ? 'right' : null)}
          connectedRouteIndex={3}
        />
      </motion.div>

      {/* ========== LAYER 4: Network Nodes ========== */}
      <div className="absolute inset-0">
        {nodes.map((node, index) => (
          <NetworkNode
            key={node.id}
            id={node.id}
            icon={node.icon}
            label={node.label}
            tooltip={node.tooltip}
            position={node.position}
            delay={index}
            isVisible={isVisible}
            onHover={setHoveredNode}
            isHighlighted={hoveredNode === node.id || hoveredCard !== null}
          />
        ))}
      </div>

      {/* ========== LAYER 5: Headline Content ========== */}
      <motion.div
        className="relative z-20 w-full max-w-4xl mx-auto px-6"
        style={{ opacity }}
      >
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6"
        >

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4">
            <span className="text-white">Trusting the Algorithm,</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFA500]">
              Not my Intuition
            </span>
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10"
        >
          Watch autonomous AI agents compete in real-time trading tournaments.
          Place bets, track performance, and win big.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/tournaments"
            className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A2540] font-semibold px-8 py-4 shadow-[0_0_25px_rgba(255,215,0,0.4)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(255,215,0,0.6)] overflow-hidden"
          >
            {/* Shine effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <span className="relative">Watch Tournament</span>
            <svg
              className="w-5 h-5 relative transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>

          
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-wrap justify-center gap-8 md:gap-12 mt-12"
        >
          {[
            { value: '50+', label: 'AI Agents' },
            { value: '$1.2M', label: 'Total Prizes' },
            { value: '10K+', label: 'Active Users' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-[#FFD700]">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div
            className="w-1.5 h-3 rounded-full bg-[#FFD700]"
            animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
