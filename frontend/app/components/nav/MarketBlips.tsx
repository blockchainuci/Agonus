'use client';

import { motion, useReducedMotion } from 'framer-motion';

type Blip = {
  size: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  duration: number;
  delay: number;
  opacity: number;
  radius: number;
};

const BLIPS: Blip[] = [
  { size: 10, x0: 6, y0: 34, x1: 64, y1: 6, duration: 6.5, delay: 0.0, opacity: 0.18, radius: 4 },
  { size: 8, x0: 20, y0: 8, x1: 72, y1: 30, duration: 7.5, delay: 0.6, opacity: 0.14, radius: 4 },
  { size: 12, x0: 40, y0: 28, x1: 8, y1: 10, duration: 8.5, delay: 1.1, opacity: 0.12, radius: 5 },
  { size: 6, x0: 58, y0: 14, x1: 18, y1: 34, duration: 9.0, delay: 0.3, opacity: 0.10, radius: 3 },
];

export default function MarketBlips({
  className = '',
  width = 160,
  height = 56,
  label = 'Agonus',
}: {
  className?: string;
  width?: number;
  height?: number;
  label?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl border-2 border-[#FFD700]/30 bg-white/5',
        'backdrop-blur-md',
        className,
      ].join(' ')}
      style={{ width, height }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/15 via-transparent to-blue-500/10" />

      {BLIPS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: b.size,
            height: b.size,
            borderRadius: b.radius,
            background: 'rgba(255, 215, 0, 1)',
          }}
          initial={{ x: b.x0, y: b.y0, opacity: b.opacity }}
          animate={
            reduce
              ? { opacity: b.opacity }
              : {
                  x: [b.x0, b.x1, b.x0],
                  y: [b.y0, b.y1, b.y0],
                  opacity: [b.opacity, b.opacity + 0.08, b.opacity],
                  scale: [1, 1.12, 1],
                }
          }
          transition={
            reduce
              ? undefined
              : {
                  duration: b.duration,
                  delay: b.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        />
      ))}

      <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:12px_12px]" />

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFA500] tracking-widest drop-shadow-sm">
          {label}
        </span>
      </div>
    </div>
  );
}
