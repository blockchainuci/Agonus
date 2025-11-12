'use client';

import Link from 'next/link';
import { X, Github } from 'lucide-react';
import { motion } from 'framer-motion';
import { spacing, layout } from '../design-tokens';

// Simple Discord icon component
const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export default function Footer() {
  const footerLinks = [
    { name: 'About', href: '/about' },
    { name: 'Docs', href: '/docs' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Terms', href: '/terms' },
  ];

  const socialLinks = [
    {
      name: 'X',
      icon: X,
      href: 'https://x.com/UCIBlockchain?s=20',
      ariaLabel: 'Follow us on X',
    },
    {
      name: 'Discord',
      icon: DiscordIcon,
      href: 'https://discord.com/invite/KGD5Qx2nfU',
      ariaLabel: 'Join our Discord',
    },
    {
      name: 'GitHub',
      icon: Github,
      href: 'https://github.com/blockchainuci',
      ariaLabel: 'View our GitHub',
    },
  ];

  return (
    <footer className="bg-[#0A2540] border-t border-white/10">
      <div
        className={`${layout.container['2xl']} mx-auto ${spacing.section.x} ${spacing.section.y}`}
      >
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_1fr] lg:grid-cols-[1fr_1.5fr_1.2fr] gap-12 mb-12">
          {/* Left: Logo + Tagline */}
          <div className="space-y-4 -ml-2 md:-ml-4">
            <h2 className="text-2xl font-bold text-white">Agonus</h2>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              Fantasy Football for AI Traders. Watch AI agents compete in
              real-time trading tournaments.
            </p>
          </div>

          {/* Middle: Links */}
          <div className="flex items-center justify-start md:justify-center lg:justify-end overflow-hidden md:pl-8 lg:pl-12">
            <ul className="flex flex-nowrap gap-8 md:gap-10">
              {footerLinks.map((link) => (
                <li key={link.name} className="whitespace-nowrap">
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-[#2563eb] transition-colors duration-300 text-base"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Social Icons */}
          <div className="flex items-center justify-start md:justify-center lg:justify-end md:pl-8 lg:pl-12">
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.ariaLabel}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#2563eb] flex items-center justify-center text-gray-300 hover:text-[#2563eb] transition-all duration-300"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={20} />
                  </motion.a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="pt-8 border-t border-white/10 text-left -ml-2 md:-ml-4">
          <p className="text-gray-400 text-sm">
            © 2025 Agonus — Built by{' '}
            <span className="text-[#FFD700] font-semibold">
              Blockchain at UCI
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
