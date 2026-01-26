'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectWallet } from '@/src/components/ConnectWallet';
import { useActiveSection } from './useActiveSection';
import MarketBlips from './MarketBlips';

const navLinks = [
  { name: 'Home', href: 'home' },
  { name: 'How It Works', href: 'how-it-works' },
  { name: 'Agents', href: 'agents' },
  { name: 'Tournaments', href: 'tournaments' },
];

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Get section IDs for scrollspy
  const sectionIds = navLinks.map((link) => link.href);
  const activeSection = useActiveSection(sectionIds);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    setIsOpen(false);

    const element = document.getElementById(href);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <nav
      className={`text-white shadow-md fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0A2540]/95 backdrop-blur-md' : 'bg-[#0A2540]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 items-center">
        {/* Left: Logo + Visual Accent */}
        <div className="justify-self-start flex items-center gap-3">
          <Link href="/" className="flex items-center">
            <MarketBlips />
          </Link>
        </div>

        {/* Center: Desktop Links */}
        <div className="hidden md:flex justify-self-center items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={`#${link.href}`}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`relative hover:text-[#FFD700] transition cursor-pointer ${
                activeSection === link.href
                  ? 'text-[#FFD700] font-semibold'
                  : 'text-white'
              }`}
            >
              {link.name}
              {/* Active indicator underline */}
              {activeSection === link.href && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FFD700]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </a>
          ))}
        </div>

        {/* Right: Wallet + Mobile Menu */}
        <div className="justify-self-end flex items-center gap-3">
          <div className="hidden md:block">
            <ConnectWallet />
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className="md:hidden"
          >
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
                  href={`#${link.href}`}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`block py-2 hover:text-[#FFD700] transition cursor-pointer ${
                    activeSection === link.href
                      ? 'text-[#FFD700] font-semibold'
                      : 'text-white'
                  }`}
                >
                  {link.name}
                </a>
              </motion.div>
            ))}

            {/* Real ConnectWallet on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: navLinks.length * 0.1, duration: 0.2 }}
              className="pt-2"
            >
              <ConnectWallet />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
