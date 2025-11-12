'use client';
import React, { useMemo } from 'react';
import { FaBitcoin } from 'react-icons/fa';
import {
  SiEthereum,
  SiSolana,
  SiDogecoin,
  SiBinance,
  SiTether,
  SiLitecoin,
  SiPolkadot,
  SiCardano,
} from 'react-icons/si';

const iconList = [
  <FaBitcoin key="btc" className="icon-float text-[#f7931a]" />,
  <SiEthereum key="eth" className="icon-float text-[#627eea]" />,
  <SiSolana key="sol" className="icon-float text-[#14f195]" />,
  <SiDogecoin key="doge" className="icon-float text-[#c2a633]" />,
  <SiBinance key="bnb" className="icon-float text-[#f3ba2f]" />,
  <SiTether key="usdt" className="icon-float text-[#26a17b]" />,
  <SiLitecoin key="ltc" className="icon-float text-[#345d9d]" />,
  <SiPolkadot key="dot" className="icon-float text-[#e6007a]" />,
  <SiCardano key="ada" className="icon-float text-[#0033ad]" />,
];

// Simple deterministic PRNG (Mulberry32) for stable values during render
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function FloatingIcons() {
  const items = useMemo(() => {
    const rnd = mulberry32(123456);
    return Array.from({ length: 15 }).map((_, i) => ({
      iconIndex: i % iconList.length,
      left: rnd() * 90,
      bottom: rnd() * -300,
      delay: rnd() * 5,
      duration: 8 + rnd() * 8,
      scale: 0.8 + rnd() * 0.8,
    }));
  }, []);

  return (
    <div className="absolute inset-0 area -z-10">
      <ul className="crypto-float relative w-full h-full overflow-hidden">
        {items.map((cfg, i) => {
          const Icon = iconList[cfg.iconIndex];
          return (
            <li
              key={i}
              className="crypto-icon"
              style={{
                left: `${cfg.left}%`,
                bottom: `${cfg.bottom}px`,
                animationDelay: `${cfg.delay}s`,
                animationDuration: `${cfg.duration}s`,
                transform: `scale(${cfg.scale})`,
              }}
            >
              {Icon}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
