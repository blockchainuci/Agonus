import { create } from "zustand";
import { persist } from "zustand/middleware";

function parseJwtRole(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

type AuthState = {
  token: string | null;
  isAuthenticated: boolean;
  isSigningIn: boolean;
  signInError: string | null;
  role: string | null;

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
      role: null,

      setToken: (token) => {
        if (token) {
          localStorage.setItem("token", token);
        } else {
          localStorage.removeItem("token");
        }
        set({
          token,
          isAuthenticated: !!token,
          role: token ? parseJwtRole(token) : null,
          signInError: null,
        });
      },

      setSigningIn: (isSigningIn) => set({ isSigningIn }),

      setSignInError: (error) => set({ signInError: error, isSigningIn: false }),

      signOut: () => {
        localStorage.removeItem("token");
        set({ token: null, isAuthenticated: false, role: null, signInError: null });
      },
    }),
    {
      name: "agonus-auth",
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated, role: state.role }),
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
