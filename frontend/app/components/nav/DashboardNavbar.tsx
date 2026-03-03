'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import NavbarAccount from './NavbarAccount';
import MarketBlips from './MarketBlips';
import { useTournamentStore } from '@/src/store/useTournamentStore';
import type { TournamentStatus } from '@/src/store/useTournamentStore';
import { useTournaments } from '@/src/hooks/useTournaments';
import type { Tournament } from '@/src/types';

function normalizeStatus(status?: string): TournamentStatus {
  const s = (status || '').toLowerCase();
  if (s === 'live') return 'LIVE';
  if (s === 'completed' || s === 'ended') return 'ENDED';
  return 'UPCOMING';
}

// ── Single tournament row ─────────────────────────────────────────────────────
function TournamentRow({
  t,
  active,
  onClick,
}: {
  t: Tournament;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${active ? 'bg-white/[0.06]' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`font-semibold truncate text-sm ${active ? 'text-[#FFD700]' : 'text-white'}`}>
            {t.name || `Tournament ${String(t.id).slice(0, 8)}`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            ${Number(t.prize_pool).toLocaleString()} ·{' '}
            {t.end_date
              ? new Date(t.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'TBD'}
          </p>
        </div>
        {active && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({
  label,
  color,
  live = false,
  count,
  collapsible = false,
  collapsed,
  onToggle,
}: {
  label: string;
  color: string;
  live?: boolean;
  count?: number;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const inner = (
    <div className="flex items-center gap-2">
      {live && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
      <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${color}`}>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] text-gray-600">({count})</span>
      )}
      {collapsible && (
        <ChevronDown
          className={`w-3 h-3 ml-auto transition-transform ${collapsed ? '' : 'rotate-180'}`}
          style={{ color: '#6b7280' }}
        />
      )}
    </div>
  );

  if (collapsible) {
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center px-4 py-2 hover:bg-white/[0.03] transition-colors"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className="px-4 py-2"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {inner}
    </div>
  );
}

// ── Grouped dropdown content (reused in both desktop & mobile) ────────────────
function GroupedTournamentList({
  tournaments,
  selectedId,
  onSelect,
}: {
  tournaments: Tournament[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
}) {
  const [endedOpen, setEndedOpen] = useState(false);

  const live     = tournaments.filter((t) => normalizeStatus(t.status) === 'LIVE');
  const upcoming = tournaments.filter((t) => normalizeStatus(t.status) === 'UPCOMING');
  const ended    = tournaments.filter((t) => normalizeStatus(t.status) === 'ENDED');

  return (
    <div>
      {/* LIVE */}
      {live.length > 0 && (
        <>
          <SectionLabel label="Live" color="text-green-400" live />
          {live.map((t) => (
            <TournamentRow
              key={t.id}
              t={t}
              active={String(t.id) === selectedId}
              onClick={() => onSelect(String(t.id), t.name)}
            />
          ))}
        </>
      )}

      {/* UPCOMING */}
      {upcoming.length > 0 && (
        <>
          <SectionLabel
            label="Upcoming"
            color="text-blue-400"
            count={upcoming.length}
          />
          {upcoming.map((t) => (
            <TournamentRow
              key={t.id}
              t={t}
              active={String(t.id) === selectedId}
              onClick={() => onSelect(String(t.id), t.name)}
            />
          ))}
        </>
      )}

      {/* ENDED — collapsible */}
      {ended.length > 0 && (
        <>
          <SectionLabel
            label="Ended"
            color="text-gray-500"
            count={ended.length}
            collapsible
            collapsed={!endedOpen}
            onToggle={() => setEndedOpen((v) => !v)}
          />
          <AnimatePresence initial={false}>
            {endedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                {ended.map((t) => (
                  <TournamentRow
                    key={t.id}
                    t={t}
                    active={String(t.id) === selectedId}
                    onClick={() => onSelect(String(t.id), t.name)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Empty */}
      {tournaments.length === 0 && (
        <p className="px-4 py-6 text-sm text-gray-600 text-center">No tournaments</p>
      )}
    </div>
  );
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

  useEffect(() => {
    if (backendT) setTournamentStatus(normalizeStatus(backendT.status));
  }, [backendT?.status, setTournamentStatus]);

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

  function handleSelect(id: string, name: string) {
    setTournamentId(id, name);
    setDropdownOpen(false);
    setMobileOpen(false);
  }

  return (
    <nav className="fixed top-0 w-full z-50 text-white border-b border-white/10 bg-[#0A2540]">
      <div className="w-full px-8 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition shrink-0">
            <MarketBlips />
          </Link>

          {/* Centre: tournament info strip */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="relative flex items-center gap-4 text-sm">

              {/* Tournament name — opens grouped dropdown */}
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 group"
              >
                <span className="text-white font-semibold group-hover:text-[#FFD700] transition-colors">
                  {backendT?.name ?? 'Select Tournament'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <span className="text-white/20">|</span>

              {/* Status */}
              <span className={`font-semibold text-xs uppercase tracking-wide ${
                currentStatus === 'LIVE'  ? 'text-green-400' :
                currentStatus === 'ENDED' ? 'text-gray-400'  :
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
                    {currentStatus === 'ENDED' ? 'Ended' : 'Ends'} {formattedEnd}
                  </span>
                </>
              )}

              {/* Grouped dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-[#0d1f35] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="max-h-[60vh] overflow-y-auto">
                        <GroupedTournamentList
                          tournaments={tournaments ?? []}
                          selectedId={selectedTournamentId ?? ''}
                          onSelect={handleSelect}
                        />
                      </div>
                    </motion.div>
                  </>
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
              <div>
                <p className="text-xs text-gray-500 uppercase px-2 mb-1">Tournament</p>
                <GroupedTournamentList
                  tournaments={tournaments ?? []}
                  selectedId={selectedTournamentId ?? ''}
                  onSelect={handleSelect}
                />
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
