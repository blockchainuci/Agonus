'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Agonus3DIntro from './ui/Agonus3D';
import FloatingIcons from './ui/FloatingIcons';

export default function IntroOverlay() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 6 seconds (matches your animation duration)
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            bg-[var(--hero-navy)]
            bg-[radial-gradient(ellipse_at_center,var(--hero-navy-2),var(--hero-navy))]
            overflow-hidden
          "
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          onClick={() => setIsVisible(false)} // Click to skip
          aria-hidden="true"
        >
          {/* === Animated Floating Crypto Icons === */}
          <FloatingIcons />

          {/* === Center AGONUS intro === */}
          <div className="relative flex items-center justify-center w-full h-full select-none">
            <div
              className="
                pointer-events-none absolute inset-0 blur-3xl opacity-30
                bg-[radial-gradient(ellipse_at_center,rgba(0,210,255,0.25),transparent_60%)]
              "
            />
            <Agonus3DIntro />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
