export type UserProfile = {
  name: string;
  email: string;
  twitter: string;
};

const DEFAULT_PROFILE: UserProfile = { name: '', email: '', twitter: '' };

function key(address: string) {
  return `agonus:userProfile:${address.toLowerCase()}`;
}

export function loadUserProfile(address: string): UserProfile {
  try {
    const raw = localStorage.getItem(key(address));
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      name: parsed?.name ?? '',
      email: parsed?.email ?? '',
      twitter: parsed?.twitter ?? '',
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(address: string, profile: UserProfile) {
  localStorage.setItem(key(address), JSON.stringify(profile));
}
