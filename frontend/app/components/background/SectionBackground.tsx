'use client';

import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

type Variant = 'base' | 'spotlight' | 'blips' | 'grid' | 'inverse' | 'grid-inverse';

export default function SectionBackground({
  id,
  variant = 'base',
  className = '',
  baseClass,
  gridClass,
  parallax = false,
  children,
}: PropsWithChildren<{
  id?: string;
  variant?: Variant;
  className?: string;
  baseClass?: string;
  gridClass?: string;
  parallax?: boolean;
}>) {
  const [pos, setPos] = useState({ x: 50, y: 35 });
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [80, -80]);

  useEffect(() => {
    if (variant !== 'spotlight') return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const x = (e.clientX / w) * 100;
        const y = (e.clientY / h) * 100;
        setPos({ x, y });
      });
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, [variant]);

  const spotlightStyle = useMemo(() => {
    if (variant !== 'spotlight') return undefined;
    return {
      background: `
        radial-gradient(650px 420px at ${pos.x}% ${pos.y}%,
          rgba(255,215,0,0.14), transparent 62%),
        radial-gradient(800px 520px at ${pos.x * 0.7}% ${pos.y * 1.1}%,
          rgba(34,211,238,0.10), transparent 66%)
      `,
    } as React.CSSProperties;
  }, [pos, variant]);

  const isInverse = variant === 'inverse' || variant === 'grid-inverse';
  const isGridAccent = variant === 'grid' || variant === 'grid-inverse';

  const baseLayerClass = baseClass || (isInverse ? 'bg-deep-inverse' : 'bg-deep');
  const gridLayerClass = gridClass || (isGridAccent ? 'bg-grid-gold grid-flicker' : 'bg-grid');

  return (
    <section id={id} ref={sectionRef} className={`relative overflow-hidden ${className}`}>
      <div className={`pointer-events-none absolute inset-0 ${baseLayerClass}`} />
      <div className={`pointer-events-none absolute inset-0 ${gridLayerClass}`} />
      <div className="pointer-events-none absolute inset-0 bg-noise" />

      {variant === 'spotlight' && (
        <div className="pointer-events-none absolute inset-0" style={spotlightStyle} />
      )}

      {parallax && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            y: parallaxY,
            background:
              'linear-gradient(180deg, transparent 0%, rgba(255,215,0,0.08) 50%, transparent 100%)',
          }}
        />
      )}

      {variant === 'blips' && (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
              backgroundSize: '140px 140px',
              backgroundPosition: '30px 50px',
              filter: 'blur(0.2px)',
            }}
          />
          <SlowBlips />
        </>
      )}

      <div className="relative">{children}</div>
    </section>
  );
}

function SlowBlips() {
  const blips = [
    { s: 12, left: '12%', top: '35%', d: 10, delay: 0.2, o: 0.1 },
    { s: 8, left: '70%', top: '18%', d: 12, delay: 0.8, o: 0.08 },
    { s: 10, left: '82%', top: '60%', d: 14, delay: 0.1, o: 0.07 },
    { s: 6, left: '35%', top: '72%', d: 16, delay: 1.2, o: 0.06 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {blips.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-md"
          style={{
            width: b.s,
            height: b.s,
            left: b.left,
            top: b.top,
            opacity: b.o,
            background: 'rgba(255,215,0,1)',
            animation: `blipFloat ${b.d}s ease-in-out ${b.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
