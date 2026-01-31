import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  token: string | null;
  isAuthenticated: boolean;
  isSigningIn: boolean;
  signInError: string | null;

  setToken: (token: string | null) => void;
  setSigningIn: (isSigningIn: boolean) => void;
  setSignInError: (error: string | null) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      isSigningIn: false,
      signInError: null,

      setToken: (token) => {
        if (token) {
          localStorage.setItem("token", token);
        } else {
          localStorage.removeItem("token");
        }
        set({ token, isAuthenticated: !!token, signInError: null });
      },

      setSigningIn: (isSigningIn) => set({ isSigningIn }),

      setSignInError: (error) => set({ signInError: error, isSigningIn: false }),

      signOut: () => {
        localStorage.removeItem("token");
        set({ token: null, isAuthenticated: false, signInError: null });
      },
    }),
    {
      name: "agonus-auth",
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // Sync with localStorage on rehydrate
        if (state) {
          const storedToken = localStorage.getItem("token");
          if (storedToken && !state.token) {
            state.setToken(storedToken);
          }
        }
      },
    }
  )
);
