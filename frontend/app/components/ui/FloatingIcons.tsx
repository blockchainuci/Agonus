'use client';
import React, { useState, useEffect } from 'react';
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

export default function FloatingIcons() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 area -z-10">
      <ul className="crypto-float relative w-full h-full overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => {
          const Icon = iconList[i % iconList.length];
          const left = Math.random() * 90;
          const bottom = Math.random() * -300;
          const delay = Math.random() * 5;
          const duration = 8 + Math.random() * 8;
          const scale = 0.8 + Math.random() * 0.8;

          return (
            <li
              key={i}
              className="crypto-icon"
              style={{
                left: `${left}%`,
                bottom: `${bottom}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                transform: `scale(${scale})`,
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
