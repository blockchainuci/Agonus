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
  walletId: "178930",
  name: "Steph Curry",
  pronouns: "he/him",
  profilePicUrl: undefined, // Wwll use placeholder
  socialMedia: {
    twitter: "@StephenCurry30",
    email: "steph@gmail.com" 
  }
};



