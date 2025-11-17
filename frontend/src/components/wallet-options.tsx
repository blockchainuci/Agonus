'use client';

import { useConnect } from 'wagmi';
import { useState, useEffect, useRef } from 'react';
import { Wallet } from 'lucide-react';

//conenct wallet is different for the hero vs the navabar
interface WalletOptionsProps {
  variant?: 'default' | 'hero';
  className?: string;
}

export function WalletOptionsMenu({ variant = 'default', className = '' }: WalletOptionsProps) {
  const { connectors, connect, isPending } = useConnect();
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
    ? 'flex items-center gap-2 rounded-full border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--hero-navy)] px-8 py-3 shadow-[0_0_10px_rgba(255,215,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed'
    : 'flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-[#1E3A8A] to-[#0A2540] text-white font-semibold hover:from-[#2563eb] hover:to-[#1E3A8A] transition disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isPending}
        className={buttonClasses}
      >
        <Wallet size={18} />
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showMenu && (
        <div className={`absolute right-0 w-56 bg-[#0A2540] border border-white/10 rounded-md shadow-lg z-50 ${
          variant === 'hero' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          <div className="p-2">
            <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/10 mb-1">
              Choose a wallet
            </div>
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  connect({ connector });
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 rounded transition"
              >
                {connector.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}