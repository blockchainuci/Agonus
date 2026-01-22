'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, forwardRef, useImperativeHandle } from 'react';

export interface PlayRoutesRef {
  highlightRoute: (routeIndex: number | null) => void;
}

interface PlayRoutesProps {
  isVisible: boolean;
  highlightedRoute: number | null;
}

const PlayRoutes = forwardRef<PlayRoutesRef, PlayRoutesProps>(
  ({ isVisible, highlightedRoute }, ref) => {
    const controls = useAnimation();

    // Define routes - football play style paths
    // Routes connect from a central "quarterback" position to various "receiver" positions
    const routes = [
      {
        // Route 1: Slant route to top-left (connects to node 1)
        path: 'M 400 400 Q 300 350 200 250',
        endPoint: { x: 200, y: 250 },
        color: '#FFD700',
      },
      {
        // Route 2: Deep route to top-right (connects to node 2)
        path: 'M 400 400 Q 500 300 600 180',
        endPoint: { x: 600, y: 180 },
        color: '#FFD700',
      },
      {
        // Route 3: Out route to left (connects to card 1)
        path: 'M 400 400 Q 250 400 120 320',
        endPoint: { x: 120, y: 320 },
        color: '#FFD700',
      },
      {
        // Route 4: Curl route to right (connects to card 2)
        path: 'M 400 400 Q 550 380 680 300',
        endPoint: { x: 680, y: 300 },
        color: '#FFD700',
      },
      {
        // Route 5: Screen route to bottom-left (connects to node 3)
        path: 'M 400 400 Q 300 450 180 480',
        endPoint: { x: 180, y: 480 },
        color: '#FFD700',
      },
    ];

    useImperativeHandle(ref, () => ({
      highlightRoute: (_routeIndex: number | null) => {
        // This can be used for external control
      },
    }));

    useEffect(() => {
      // Draw routes when the hero becomes visible.
      if (isVisible) {
        // Start drawing routes at 0.3s
        controls.start('visible');
      }
    }, [isVisible, controls]);

    const pathVariants = {
      hidden: {
        pathLength: 0,
        opacity: 0,
      },
      visible: (i: number) => ({
        pathLength: 1,
        opacity: 1,
        transition: {
          pathLength: {
            delay: 0.3 + i * 0.1,
            duration: 0.5,
            ease: 'easeInOut' as const,
          },
          opacity: {
            delay: 0.3 + i * 0.1,
            duration: 0.1,
          },
        },
      }),
    };

    const ballVariants = {
      hidden: {
        opacity: 0,
        scale: 0,
      },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          delay: 0.8,
          duration: 0.3,
        },
      },
    };

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Glow for highlighted routes. */}
          {/* Glow filter for highlighted routes */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gold gradient for route strokes. */}
          {/* Gradient for routes */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#FFD700" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.3" />
          </linearGradient>

          {/* Ball shading for depth. */}
          {/* Ball gradient */}
          <radialGradient id="ballGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#FFF4CC" />
            <stop offset="70%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#B8860B" />
          </radialGradient>
        </defs>

        {/* Animated play routes in the background. */}
        {/* Draw routes */}
        {routes.map((route, index) => (
          <g key={index}>
            {/* Background dashed route (always visible after draw) */}
            <motion.path
              d={route.path}
              fill="none"
              stroke="rgba(255, 215, 0, 0.2)"
              strokeWidth="2"
              strokeDasharray="8 6"
              initial="hidden"
              animate={controls}
              variants={pathVariants}
              custom={index}
            />

            {/* Bright overlay when hovered/linked. */}
            {/* Highlighted route overlay */}
            <motion.path
              d={route.path}
              fill="none"
              stroke={route.color}
              strokeWidth="3"
              strokeDasharray="8 6"
              filter="url(#glow)"
              initial={{ opacity: 0 }}
              animate={{
                opacity: highlightedRoute === index ? 1 : 0,
                strokeWidth: highlightedRoute === index ? 4 : 3,
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Moving dot to imply motion along the route. */}
            {/* Animated moving dot along route (shows on highlight) */}
            {highlightedRoute === index && (
              <motion.circle
                r="4"
                fill="#FFD700"
                filter="url(#glow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <animateMotion
                  dur="1.5s"
                  repeatCount="indefinite"
                  path={route.path}
                />
              </motion.circle>
            )}
          </g>
        ))}

        {/* Center "football" marker. */}
        {/* Center ball (quarterback position) */}
        <motion.g
          initial="hidden"
          animate={controls}
          variants={ballVariants}
        >
          {/* Ball shadow */}
          <ellipse
            cx="400"
            cy="410"
            rx="12"
            ry="4"
            fill="rgba(0,0,0,0.3)"
          />

          {/* Main ball */}
          <motion.ellipse
            cx="400"
            cy="400"
            rx="15"
            ry="10"
            fill="url(#ballGradient)"
            stroke="#B8860B"
            strokeWidth="1"
            animate={{
              y: [0, -5, 0],
              rotate: [0, 10, 0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Ball laces */}
          <motion.g
            animate={{
              y: [0, -5, 0],
              rotate: [0, 10, 0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: '400px 400px' }}
          >
            <line
              x1="395"
              y1="397"
              x2="405"
              y2="397"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <line
              x1="398"
              y1="395"
              x2="398"
              y2="405"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <line
              x1="402"
              y1="395"
              x2="402"
              y2="405"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </motion.g>
        </motion.g>

        {/* Expanding rings reinforce the center focus. */}
        {/* Pulse rings from ball (shows after ball appears) */}
        {isVisible && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.circle
                key={i}
                cx="400"
                cy="400"
                r="20"
                fill="none"
                stroke="#FFD700"
                strokeWidth="1"
                initial={{ opacity: 0, scale: 1 }}
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [1, 3, 4],
                }}
                transition={{
                  delay: 1 + i * 0.4,
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            ))}
          </>
        )}
      </svg>
    );
  }
);

PlayRoutes.displayName = 'PlayRoutes';

export default PlayRoutes;
