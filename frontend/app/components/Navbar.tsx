'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectWallet } from '@/src/components/ConnectWallet';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Agents', href: '#agents' },
    { name: 'Tournaments', href: '#tournaments' },
  ];

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    setIsOpen(false);

    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);

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
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left side: Logo + Links */}
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <h1 className="text-2xl font-bold">Agonus</h1>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className={`hover:text-[#2563eb] transition cursor-pointer ${
                  pathname === link.href ? 'text-[#2563eb] font-semibold' : ''
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Right side: Connect Wallet Button (Desktop) */}
        <div className="hidden md:block">
          <ConnectWallet />
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
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
                  onClick={(e) => handleScroll(e, link.href)}
                  className={`block hover:text-[#2563eb] transition cursor-pointer ${
                    pathname === link.href ? 'text-[#2563eb] font-semibold' : ''
                  }`}
                >
                  {link.name}
                </a>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: navLinks.length * 0.1, duration: 0.2 }}
            >
              <button className="w-full mt-2 px-4 py-2 rounded-md bg-gradient-to-r from-[#1E3A8A] to-[#0A2540] text-white font-semibold hover:from-[#2563eb] hover:to-[#1E3A8A] transition">
                Connect Wallet
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
