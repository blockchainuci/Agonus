'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useState, useEffect, useRef } from 'react';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';

interface AccountProps {
  variant?: 'default' | 'hero';
  className?: string;
}

export function Account({ variant = 'default', className = '' }: AccountProps) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const buttonClasses = variant === 'hero'
    ? 'flex items-center gap-2 rounded-full border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--hero-navy)] px-8 py-3 shadow-[0_0_10px_rgba(255,215,0,0.3)] transition-all'
    : 'flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-[#1E3A8A] to-[#0A2540] text-white font-semibold hover:from-[#2563eb] hover:to-[#1E3A8A] transition';

  if (!address) return null;

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={buttonClasses}
      >
        <Wallet size={18} />
        <span className="hidden sm:inline">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <ChevronDown size={16} />
      </button>

      {showMenu && (
        <div className={`absolute right-0 w-48 bg-[#0A2540] border border-white/10 rounded-md shadow-lg z-50 ${
          variant === 'hero' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          <div className="p-2">
            <div className="px-3 py-2 text-sm text-gray-300 border-b border-white/10">
              {address.slice(0, 10)}...{address.slice(-8)}
            </div>
            <button
              onClick={() => {
                disconnect();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded transition"
            >
              <LogOut size={16} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}