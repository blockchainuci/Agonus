'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import NavbarAccount from './NavbarAccount';
import MarketBlips from './MarketBlips';
import { useTournamentStore } from '@/src/store/useTournamentStore';
import type { TournamentStatus } from '@/src/store/useTournamentStore';
import { useTournaments } from '@/src/hooks/useTournaments';

function normalizeStatus(status?: string): TournamentStatus {
  const s = (status || '').toLowerCase();
  if (s === 'live') return 'LIVE';
  if (s === 'completed' || s === 'ended') return 'ENDED';
  return 'UPCOMING';
}


export default function DashboardNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedTournamentId = useTournamentStore((s) => s.selectedTournamentId);
  const setTournamentId      = useTournamentStore((s) => s.setTournamentId);
  const setTournamentStatus  = useTournamentStore((s) => s.setTournamentStatus);
  const { data: tournaments } = useTournaments();

  const backendT = tournaments?.find((t) => String(t.id) === String(selectedTournamentId));
  const currentStatus = normalizeStatus(backendT?.status);

  // Sync status into the store whenever the selected tournament changes
  useEffect(() => {
    if (backendT) setTournamentStatus(normalizeStatus(backendT.status));
  }, [backendT?.status, setTournamentStatus]);

  // Auto-select first tournament on load
  useEffect(() => {
    if (tournaments && tournaments.length > 0 && !selectedTournamentId) {
      setTournamentId(String(tournaments[0].id), tournaments[0].name);
    }
  }, [tournaments, selectedTournamentId, setTournamentId]);

  const formattedEnd = backendT?.end_date
    ? new Date(backendT.end_date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : 'TBD';

  return (
    <nav className="fixed top-0 w-full z-50 text-white border-b border-white/10 bg-[#0A2540]">
      <div className="w-full px-8 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition shrink-0">
            <MarketBlips />
          </Link>

          {/* Centre: flat tournament info strip */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="relative flex items-center gap-4 text-sm">

              {/* Tournament name — clickable to open picker */}
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 group"
              >
                <span className="text-white font-semibold group-hover:text-[#FFD700] transition-colors">
                  {backendT?.name ?? 'Select Tournament'}
                </span>
                <svg
                  className={`w-3 h-3 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="currentColor" viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>

              <span className="text-white/20">|</span>

              {/* Status — coloured text, no box */}
              <span className={`font-semibold text-xs uppercase tracking-wide ${
                currentStatus === 'LIVE'     ? 'text-green-400' :
                currentStatus === 'ENDED'    ? 'text-gray-400'  :
                                               'text-blue-400'
              }`}>
                {currentStatus === 'LIVE' && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                )}
                {currentStatus}
              </span>

              {backendT && (
                <>
                  <span className="text-white/20">|</span>
                  <span className="text-gray-300 hidden lg:inline">
                    ${Number(backendT.prize_pool).toLocaleString()}
                  </span>
                  <span className="text-white/20 hidden lg:inline">|</span>
                  <span className="text-gray-500 hidden lg:inline">
                    Ends {formattedEnd}
                  </span>
                </>
              )}

              {/* Dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-[#0d1f35] border border-white/10 rounded-xl shadow-2xl z-50 max-h-[60vh] overflow-y-auto"
                  >
                    {(tournaments ?? []).map((t) => {
                      const st = normalizeStatus(t.status);
                      const active = String(t.id) === String(selectedTournamentId);
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTournamentId(String(t.id), t.name);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors first:rounded-t-xl last:rounded-b-xl ${active ? 'bg-white/5' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold truncate text-sm ${active ? 'text-[#FFD700]' : 'text-white'}`}>
                                {t.name || `Tournament ${String(t.id).slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                ${Number(t.prize_pool).toLocaleString()} ·{' '}
                                {t.end_date
                                  ? new Date(t.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                  : 'TBD'}
                              </p>
                            </div>
                            <span className={`text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${
                              st === 'LIVE' ? 'text-green-400' : st === 'ENDED' ? 'text-gray-500' : 'text-blue-400'
                            }`}>
                              {st}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: account */}
          <div className="hidden md:block shrink-0">
            <NavbarAccount />
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mt-3 pb-3 border-t border-white/10 pt-3 space-y-3 overflow-hidden"
            >
              {/* Tournament picker in mobile menu */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase px-2">Tournament</p>
                {(tournaments ?? []).map((t) => {
                  const st = normalizeStatus(t.status);
                  const active = String(t.id) === String(selectedTournamentId);
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTournamentId(String(t.id), t.name);
                        setMobileOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center justify-between gap-2 ${
                        active ? 'bg-white/10 text-[#FFD700]' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-sm truncate">{t.name}</span>
                      <span className={`text-[10px] font-semibold uppercase flex-shrink-0 ${
                        st === 'LIVE' ? 'text-green-400' : st === 'ENDED' ? 'text-gray-500' : 'text-blue-400'
                      }`}>
                        {st}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 px-2">
                <NavbarAccount />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
