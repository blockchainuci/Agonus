'use client';

import React, { useState } from 'react';
import { UserProfile, mockUser } from '../data/mockUser';

interface UserProfileCardProps {
  user?: UserProfile;
  onEditProfile?: () => void;
  onViewProfile?: () => void;
  onDisconnectWallet?: () => void;
}

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveChanges = () => {
    // Save the edited data to the current user state
    setCurrentUser(editedUser);
    console.log('Saving changes:', editedUser);
    setIsEditing(false);
    // You can add onEditProfile callback here if you want to notify parent
    if (onEditProfile) {
      onEditProfile();
    }
  };

  const handleCancelEdit = () => {
    setEditedUser(currentUser); // Reset to current saved state
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

  return (
    <div className="relative bg-gradient-to-br from-blue-800 to-blue-950 rounded-3xl p-8 shadow-xl max-w-sm w-full min-h-[600px]">
      {/* Edit Mode Content */}
      {isEditing ? (
        <>
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">
            Edit Profile
          </h2>

          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={editedUser.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="Enter your name"
              />
            </div>

            {/* Pronouns Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Pronouns (Optional)
              </label>
              <input
                type="text"
                value={editedUser.pronouns || ''}
                onChange={(e) => handleInputChange('pronouns', e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="e.g., he/him, she/her, they/them"
              />
            </div>

            {/* Wallet ID (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Wallet ID
              </label>
              <input
                type="text"
                value={editedUser.walletId}
                disabled
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* Social Media Section */}
            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                Social Media
              </h3>

              {/* Twitter Input */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Twitter / X
                </label>
                <input
                  type="text"
                  value={editedUser.socialMedia?.twitter || ''}
                  onChange={(e) =>
                    handleSocialMediaChange('twitter', e.target.value)
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400 transition-colors"
                  placeholder="@username"
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editedUser.socialMedia?.email || ''}
                  onChange={(e) =>
                    handleSocialMediaChange('email', e.target.value)
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400 transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveChanges}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold py-3 rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Three Dots Menu */}
          <div className="absolute top-6 right-6">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
              aria-label="Options menu"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-10">
                <div className="py-1">
                  {onViewProfile && (
                    <button
                      onClick={() => {
                        onViewProfile();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                    >
                      View Full Profile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentUser.walletId);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
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
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
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
          <div className="flex justify-start mb-6">
            <div className="w-36 h-36 rounded-full bg-slate-200 flex items-center justify-center text-4xl font-bold text-slate-700">
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

          {/* User Name */}
          <h2 className="text-4xl font-bold text-yellow-400 mb-1 leading-tight">
            {currentUser.name}
          </h2>

          {/* Pronouns */}
          {currentUser.pronouns && (
            <p className="text-blue-200 text-sm mb-6">
              ({currentUser.pronouns})
            </p>
          )}

          {/* Yellow Progress Bar */}
          <div className="w-full h-1.5 bg-blue-900 rounded-full mb-8">
            <div className="h-full w-full bg-yellow-400 rounded-full"></div>
          </div>

          {/* Wallet ID */}
          <div className="mb-6">
            <p className="text-white text-lg font-medium">
              WALLET ID:{' '}
              <span className="font-mono">{currentUser.walletId}</span>
            </p>
          </div>

          {/* Social Media Icons */}
          {currentUser.socialMedia && (
            <div className="flex gap-4">
              {currentUser.socialMedia.twitter && (
                <button
                  className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-300 transition-colors"
                  aria-label="Twitter"
                >
                  <svg
                    className="w-7 h-7 text-blue-900"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
              )}
              {currentUser.socialMedia.email && (
                <button
                  className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-300 transition-colors"
                  aria-label="Email"
                >
                  <svg
                    className="w-7 h-7 text-blue-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserProfileCard;
