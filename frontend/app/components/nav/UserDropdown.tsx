'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { AnimatePresence, motion } from 'framer-motion';
import { AtSign, Edit, LogOut, Mail, User } from 'lucide-react';
import { loadUserProfile, saveUserProfile, type UserProfile } from './userProfileStorage';

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function UserDropdown() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    twitter: '',
  });

  const ref = useRef<HTMLDivElement | null>(null);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // load profile when wallet changes
  useEffect(() => {
    if (!address) return;
    const loaded = loadUserProfile(address);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loaded);
  }, [address]);

  const addrLabel = useMemo(() => (address ? truncate(address) : ''), [address]);

  const onSave = () => {
    if (!address) return;
    saveUserProfile(address, profile);
    setEditing(false);
  };

  if (!isConnected || !address) return null;

  return (
    <div className="relative" ref={ref}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
        aria-label="Open user menu"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>

        <span className="hidden sm:block text-sm text-gray-200 font-mono">
          {addrLabel}
        </span>

        <span className="w-2 h-2 bg-green-400 rounded-full" title="Connected" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/10 bg-[#001D3D]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <p className="text-xs text-gray-400">Connected Wallet</p>
              <p className="text-white font-mono text-sm">{addrLabel}</p>
            </div>

            {/* Profile */}
            <div className="p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Profile</p>

                <button
                  onClick={() => setEditing((v) => !v)}
                  className="p-2 rounded-lg hover:bg-white/10 transition"
                  aria-label="Toggle edit profile"
                >
                  <Edit className="w-4 h-4 text-gray-300" />
                </button>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400">Name</label>
                    <input
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    <input
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="you@email.com"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">Twitter</label>
                    <input
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                      value={profile.twitter}
                      onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                      placeholder="@handle"
                    />
                  </div>

                  <button
                    onClick={onSave}
                    className="w-full mt-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <User className="w-4 h-4" /> Name
                    </span>
                    <span className="text-white">{profile.name || 'Not set'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </span>
                    <span className="text-white">{profile.email || 'Not set'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <AtSign className="w-4 h-4" /> Twitter
                    </span>
                    <span className="text-white">{profile.twitter || 'Not set'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={() => {
                  disconnect();
                  setOpen(false);
                  setEditing(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-300 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Disconnect</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
