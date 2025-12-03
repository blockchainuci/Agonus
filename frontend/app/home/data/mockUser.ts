export interface UserProfile {
  walletId: string;
  name: string;
  pronouns?: string;
  profilePicUrl?: string;
  socialMedia?: {
    twitter?: string;
    email?: string;
  };
}

export const mockUser: UserProfile = {
  walletId: "0x8d8c7B3E9F2a1D5c6B4e8F0A3C7D9E2B5F8A23C5",
  name: "Steph Curry",
  pronouns: "he/him",
  profilePicUrl: undefined, // Wwll use placeholder
  socialMedia: {
    twitter: "@StephenCurry30",
    email: "steph@gmail.com" 
  }
};



