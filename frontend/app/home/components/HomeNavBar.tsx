'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Wallet, ChevronDown, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomeNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  // Hardcoded wallet address for now
  const walletAddress = '0x8d8c7B3E9F2a1D5c6B4e8F0A3C7D9E2B5F8A23C5';
  const truncatedAddress = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close wallet menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.wallet-menu-container')) {
        setShowWalletMenu(false);
      }
    };

    if (showWalletMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWalletMenu]);

  const navLinks = [
    { name: 'Dashboard', href: '#UserInfo' },
    { name: 'Portfolio Value', href: '#CandleChart' },
    { name: 'Recent Trades', href: '#RecentTrades' },
  ];

  const handleNavScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetHref: string
  ) => {
    e.preventDefault();
    setIsOpen(false);

    const targetId = targetHref.replace('#', '');
    const element = document.getElementById(targetId);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // Wallet pill component (used in both desktop and mobile)
  const WalletPill = ({ className = '' }: { className?: string }) => (
    <div className={`wallet-menu-container relative ${className}`}>
      <button
        onClick={() => setShowWalletMenu(!showWalletMenu)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#FFD700]/50 bg-[#0A2540] text-white font-medium hover:border-[#FFD700] hover:shadow-[0_0_8px_rgba(255,215,0,0.3)] transition-all"
      >
        <Wallet size={16} className="text-[#FFD700]" />
        <span className="text-sm">{truncatedAddress}</span>
        <ChevronDown size={14} className="opacity-60" />
      </button>

      {showWalletMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[#0A2540] border border-[#FFD700]/30 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/10">
              Connected Wallet
            </div>
            <div className="px-3 py-2 text-sm text-white font-mono">
              {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
            </div>
            <button
              onClick={() => {
                // TODO: Add actual disconnect logic
                setShowWalletMenu(false);
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

  return (
    <nav
      className={`text-white shadow-md fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0A2540]/95 backdrop-blur-md' : 'bg-[#0A2540]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left side: Logo + Links */}
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold">Agonus</h1>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavScroll(e, link.href)}
                className={`hover:text-[#2563eb] transition cursor-pointer ${
                  pathname === link.href ? 'text-[#2563eb] font-semibold' : ''
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Right side: Wallet Pill (Desktop) */}
        <div className="hidden md:block">
          <WalletPill />
        </div>

        {/* Mobile: Wallet + Hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <WalletPill />
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#0A2540] px-6 pb-4 space-y-2 overflow-hidden"
          >
            {navLinks.map((link, index) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.2 }}
              >
                <a
                  href={link.href}
                  onClick={(e) => handleNavScroll(e, link.href)}
                  className={`block hover:text-[#2563eb] transition cursor-pointer ${
                    pathname === link.href ? 'text-[#2563eb] font-semibold' : ''
                  }`}
                >
                  {link.name}
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
