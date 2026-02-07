'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { AgentCard, type Agent } from './ui/agents';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  items: Agent[];
  autoRotateMs?: number;
}

const DEFAULT_INTERVAL = 8000;

export default function CenteredAgentCarousel({
  items,
  autoRotateMs = DEFAULT_INTERVAL,
}: Props) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const lastProgressUpdate = useRef<number>(0);

  // Use a ref for goNext to avoid re-triggering the RAF effect
  const goNextRef = useRef<() => void>(() => {});

  // -------------------------
  // Navigation Handlers
  // -------------------------

  const goNext = useCallback(() => {
    setActive((prev) => {
      const next = (prev + 1) % items.length;
      startRef.current = performance.now();
      lastProgressUpdate.current = 0;
      setProgress(0);
      return next;
    });
  }, [items.length]);

  const goPrev = useCallback(() => {
    setActive((prev) => {
      const next = (prev - 1 + items.length) % items.length;
      startRef.current = performance.now();
      lastProgressUpdate.current = 0;
      setProgress(0);
      return next;
    });
  }, [items.length]);

  // Keep ref in sync
  goNextRef.current = goNext;

  // -------------------------
  // Autorotation Animation
  // -------------------------

  useEffect(() => {
    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const pct = Math.min(elapsed / autoRotateMs, 1);

      // Throttle state updates to ~10fps to reduce re-renders
      if (now - lastProgressUpdate.current > 100 || pct >= 1) {
        lastProgressUpdate.current = now;
        setProgress(pct * 100);
      }

      if (pct < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        goNextRef.current();
      }
    };

    startRef.current = performance.now();
    lastProgressUpdate.current = 0;
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [active, autoRotateMs]);

  // -------------------------
  // Swipe Gesture Navigation
  // -------------------------

  const onSwipeEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 80 || info.velocity.x > 300) {
      goPrev();
    } else if (info.offset.x < -80 || info.velocity.x < -300) {
      goNext();
    }
  };

  // -------------------------
  // Keyboard Navigation
  // -------------------------

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  const agent = items[active];

  // -------------------------
  // Render
  // -------------------------

  return (
    <div className="flex flex-col items-center gap-12 w-full px-4 mx-auto">
      
      {/* -------------------------
           TOP — CENTERED AGENT CARD
         ------------------------- */}
      <div className="max-w-[720px] w-full perspective-[1400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              dragMomentum={false}
              onDragEnd={onSwipeEnd}
              whileHover={{ rotateX: -4, rotateY: 4, translateY: -4 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Subtle halo behind card */}
              <motion.div
                className="
                  pointer-events-none absolute -inset-2 -z-10 rounded-3xl 
                  bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.15),transparent_70%)]
                  blur-xl opacity-60
                "
                layoutId="agent-halo"
              />

              <AgentCard agent={agent} index={active} />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* -------------------------
           BOTTOM — CONTROLS
         ------------------------- */}
      <div className="w-full max-w-xl flex items-center justify-center gap-6">

        {/* Left Arrow */}
        <button
          onClick={goPrev}
          className="
            p-3 rounded-full border border-white/10 
            hover:border-yellow-400 transition-all
            bg-white/5 hover:bg-white/10
          "
        >
          <ChevronLeft className="w-6 h-6 text-gray-300 hover:text-yellow-400" />
        </button>

        {/* Name + Progress */}
        <div className="flex flex-col items-center flex-1">
          <span className="text-gray-200 font-semibold text-base mb-2">
            {agent.name}
          </span>

          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={goNext}
          className="
            p-3 rounded-full border border-white/10 
            hover:border-yellow-400 transition-all
            bg-white/5 hover:bg-white/10
          "
        >
          <ChevronRight className="w-6 h-6 text-gray-300 hover:text-yellow-400" />
        </button>

      </div>
    </div>
  );
}
