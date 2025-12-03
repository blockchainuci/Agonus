'use client';

import React, { useState } from 'react';
import { Wallet, Copy, Check, Mail, Trophy, TrendingUp } from 'lucide-react';
import { UserProfile, mockUser } from '../data/mockUser';

interface UserProfileCardProps {
  user?: UserProfile;
  onEditProfile?: () => void;
  onViewProfile?: () => void;
  onDisconnectWallet?: () => void;
}

// Helper to truncate wallet address: 0x8d8c…23C5
const truncateAddress = (address: string) => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user = mockUser,
  onEditProfile,
  onViewProfile,
  onDisconnectWallet,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [editedUser, setEditedUser] = useState(user);
  const [copied, setCopied] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(currentUser.walletId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveChanges = () => {
    setCurrentUser(editedUser);
    setIsEditing(false);
    if (onEditProfile) onEditProfile();
  };

  const handleCancelEdit = () => {
    setEditedUser(currentUser);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialMediaChange = (
    platform: 'twitter' | 'email',
    value: string
  ) => {
    setEditedUser((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value,
      },
    }));
  };

  // Placeholder stats (will be replaced with real data later)
  const stats = {
    totalBalance: 12345.67,
    tournamentsPlayed: 8,
    winRate: 62,
  };

  return (
    <div
      id="UserInfo"
      className="relative bg-gradient-to-br from-blue-800 to-blue-950 rounded-3xl p-8 shadow-xl max-w-sm w-full antialiased"
    >
      {/* Edit Mode */}
      <div
        className={`
          absolute inset-0 p-8 overflow-y-auto rounded-3xl bg-gradient-to-br from-blue-800 to-blue-950
          transition-opacity duration-200 z-20
          ${isEditing ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        <h2 className="text-2xl font-bold text-yellow-400 mb-6">
          Edit Profile
        </h2>

        <div className="space-y-6">
          {/* NAME */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">
              Name
            </label>
            <input
              type="text"
              value={editedUser.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white
                         focus:outline-none focus:border-yellow-400"
              placeholder="Enter your name"
            />
          </div>

          {/* pronouns */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">
              Pronouns <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              type="text"
              value={editedUser.pronouns || ''}
              onChange={(e) => handleInputChange('pronouns', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white
                         focus:outline-none focus:border-yellow-400"
              placeholder="e.g., he/him, she/her, they/them"
            />
          </div>

          {/* wallet id */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">
              Wallet ID
            </label>
            <input
              type="text"
              value={currentUser.walletId}
              disabled
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed font-mono text-sm"
            />
          </div>

          {/* email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={editedUser.socialMedia?.email || ''}
              onChange={(e) => handleSocialMediaChange('email', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white
                         focus:outline-none focus:border-yellow-400"
              placeholder="your@email.com"
            />
          </div>

          {/* buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveChanges}
              className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold py-3 rounded-lg transition"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* View Mode */}
      <div
        className={`
          transition-opacity duration-200
          ${!isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Menu */}
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-yellow-400 hover:text-yellow-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-20">
              <div className="py-1">
                {onViewProfile && (
                  <button
                    onClick={() => {
                      onViewProfile();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                  >
                    View Full Profile
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    handleCopyWallet();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                >
                  Copy Wallet ID
                </button>
                {onDisconnectWallet && (
                  <>
                    <div className="border-t border-slate-700 my-1"></div>
                    <button
                      onClick={() => {
                        onDisconnectWallet();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
                    >
                      Disconnect Wallet
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Picture */}
        <div className="flex justify-start mb-5">
          <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-700 shadow-lg">
            {currentUser.profilePicUrl ? (
              <img
                src={currentUser.profilePicUrl}
                alt={currentUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(currentUser.name)
            )}
          </div>
        </div>

        {/* Name */}
        <h2 className="text-2xl font-bold text-yellow-400 mb-0.5 leading-tight">
          {currentUser.name}
        </h2>

        {currentUser.pronouns && (
          <p className="text-blue-200 text-sm mb-3">({currentUser.pronouns})</p>
        )}

        {/* Wallet ID - Big label style */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-2">
            <Wallet size={12} />
            <span>Wallet</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-mono text-2xl font-bold tracking-wide">
              {truncateAddress(currentUser.walletId)}
            </span>
            <button
              onClick={handleCopyWallet}
              className="p-1.5 rounded-md hover:bg-white/10 transition text-slate-400 hover:text-yellow-400"
              title="Copy full address"
            >
              {copied ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-blue-700/50 mb-5"></div>

        {/* Total Account Balance */}
        <div className="mb-5">
          <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">
            Total Balance
          </div>
          <div className="text-yellow-400 text-3xl font-bold">
            $
            {stats.totalBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            Updates after each tournament settles
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="flex gap-3">
          <div className="flex-1 bg-blue-900/50 rounded-xl p-3 border border-blue-700/30">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Trophy size={12} />
              <span>Tournaments</span>
            </div>
            <div className="text-white font-bold text-lg">
              {stats.tournamentsPlayed}
            </div>
          </div>
          <div className="flex-1 bg-blue-900/50 rounded-xl p-3 border border-blue-700/30">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <TrendingUp size={12} />
              <span>Win Rate</span>
            </div>
            <div className="text-green-400 font-bold text-lg">
              {stats.winRate}%
            </div>
          </div>
        </div>

        {/* Email if exists */}
        {currentUser.socialMedia?.email && (
          <div className="flex items-center gap-2 text-slate-300 text-sm mt-4 pt-4 border-t border-blue-700/30">
            <Mail size={14} className="text-yellow-400" />
            <span>{currentUser.socialMedia.email}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileCard;
