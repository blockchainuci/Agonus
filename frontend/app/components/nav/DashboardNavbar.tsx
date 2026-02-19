'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import NavbarAccount from './NavbarAccount';
import { scrollToSection } from './scrollToSection';
import { useActiveSection } from './useActiveSection';
import MarketBlips from './MarketBlips';

const SECTIONS = [
  { name: 'Tournaments', id: 'tournaments' },
  { name: 'Performance', id: 'performance' },
  { name: 'Recent Trades', id: 'recent-trades' },
];

export default function DashboardNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Get section IDs for scrollspy
  const sectionIds = SECTIONS.map((s) => s.id);
  const activeSection = useActiveSection(sectionIds);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSectionClick = (id: string) => {
    scrollToSection(id);
    setOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 text-white border-b border-white/10 transition-all duration-300 ${
        scrolled ? 'bg-[#0A2540]/95 backdrop-blur-md' : 'bg-[#0A2540]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - stays on /home */}
          <Link href="/" className="relative flex items-center hover:opacity-80 transition">
            <MarketBlips />
          </Link>

          {/* Desktop section links */}
          <div className="hidden md:flex items-center gap-8">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSectionClick(s.id)}
                className={`relative text-sm font-medium transition ${
                  activeSection === s.id
                    ? 'text-[#FFD700] font-semibold'
                    : 'text-gray-300 hover:text-[#FFD700]'
                }`}
              >
                {s.name}
                {/* Active indicator underline */}
                {activeSection === s.id && (
                  <motion.div
                    layoutId="dashboard-navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FFD700]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Right: Connect / Profile */}
          <div className="hidden md:block">
            <NavbarAccount />
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 space-y-3 overflow-hidden"
            >
              {SECTIONS.map((s, index) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.2 }}
                  onClick={() => handleSectionClick(s.id)}
                  className={`block w-full text-left px-4 py-2 rounded-lg transition ${
                    activeSection === s.id
                      ? 'text-[#FFD700] font-semibold bg-white/5'
                      : 'text-gray-300 hover:text-[#FFD700] hover:bg-white/5'
                  }`}
                >
                  {s.name}
                </motion.button>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: SECTIONS.length * 0.1, duration: 0.2 }}
                className="pt-2 px-4"
              >
                <NavbarAccount />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
