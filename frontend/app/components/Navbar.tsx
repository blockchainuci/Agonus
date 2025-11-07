'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Tournaments', href: '/tournaments' },
    { name: 'Agents', href: '/agents' },
    { name: 'How It Works', href: '/how-it-works' },
  ]; // Updated navigation

  return (
    <nav className="bg-[#0A2540] text-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left side: Logo + Links */}
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <h1 className="text-2xl font-bold">Agonus</h1>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`hover:text-[#2563eb] transition ${
                  pathname === link.href ? 'text-[#2563eb] font-semibold' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side: Connect Wallet Button (Desktop) */}
        <div className="hidden md:block">
          <button className="px-4 py-2 rounded-md bg-gradient-to-r from-[#1E3A8A] to-[#0A2540] text-white font-semibold hover:from-[#2563eb] hover:to-[#1E3A8A] transition">
            Connect Wallet
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0A2540] px-6 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`block hover:text-[#2563eb] transition ${
                pathname === link.href ? 'text-[#2563eb] font-semibold' : ''
              }`}
              onClick={() => setIsOpen(false)} // close menu when clicked
            >
              {link.name}
            </Link>
          ))}

          <button className="w-full mt-2 px-4 py-2 rounded-md bg-gradient-to-r from-[#1E3A8A] to-[#0A2540] text-white font-semibold hover:from-[#2563eb] hover:to-[#1E3A8A] transition">
            Connect Wallet
          </button>
        </div>
      )}
    </nav>
  );
}
