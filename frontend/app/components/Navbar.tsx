'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        {/* Left side: Logo + Links */}
        <div className="flex items-center space-x-6 lg:space-x-8">
          {/* Logo */}
          <Link href="/" className="text-xl sm:text-2xl font-bold hover:text-[#FFD700] transition-colors">
            Agonus
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className={`hover:text-[#2563eb] transition cursor-pointer text-sm lg:text-base ${
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
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0A2540] border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className={`block px-4 py-3 rounded-lg hover:bg-white/10 transition cursor-pointer text-base ${
                  pathname === link.href ? 'text-[#2563eb] font-semibold bg-white/5' : ''
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="px-4 pb-4 pt-2 border-t border-white/10">
            <ConnectWallet />
          </div>
        </div>
      )}
    </nav>
  );
}
