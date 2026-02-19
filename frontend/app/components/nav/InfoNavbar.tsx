'use client';

import Link from 'next/link';
import NavbarAccount from './NavbarAccount';
import MarketBlips from './MarketBlips';

export default function InfoNavbar({ title }: { title: string }) {
  return (
    <nav className="fixed top-0 w-full z-50 text-white border-b border-white/10 bg-[#0A2540]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 items-center">
        {/* Left: Logo → landing page */}
        <div className="justify-self-start">
          <Link href="/" className="flex items-center">
            <MarketBlips />
          </Link>
        </div>

        {/* Center: Page title */}
        <div className="justify-self-center">
          <span className="text-lg font-semibold text-gray-200 tracking-wide">
            {title}
          </span>
        </div>

        {/* Right: Connect wallet / user profile */}
        <div className="justify-self-end">
          <NavbarAccount />
        </div>
      </div>
    </nav>
  );
}
