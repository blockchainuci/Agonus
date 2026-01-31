"use client";

import { useCallback, useEffect } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { useAuthStore } from "@/src/store/useAuthStore";
import { API_URL } from "./api";

const SIGN_MESSAGE = "Sign in to Agonus";

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSigningIn = useAuthStore((s) => s.isSigningIn);
  const signInError = useAuthStore((s) => s.signInError);
  const setToken = useAuthStore((s) => s.setToken);
  const setSigningIn = useAuthStore((s) => s.setSigningIn);
  const setSignInError = useAuthStore((s) => s.setSignInError);
  const signOut = useAuthStore((s) => s.signOut);

  // Check if user needs to sign in (wallet connected but not authenticated)
  const needsSignIn = isConnected && !isAuthenticated && !isSigningIn;

  // Sign in function - triggers wallet signature and authenticates with backend
  const signIn = useCallback(async () => {
    if (!address) {
      setSignInError("No wallet address");
      return false;
    }

    setSigningIn(true);
    setSignInError(null);

    try {
      // Request signature from wallet
      const signature = await signMessageAsync({ message: SIGN_MESSAGE });

      // Send to backend
      const res = await fetch(`${API_URL}/auth/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Authentication failed");
      }

      const data = await res.json();

      if (data.access_token) {
        setToken(data.access_token);
        return true;
      } else {
        throw new Error("No access token received");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      // If user rejected the signature, provide a cleaner message
      if (message.includes("User rejected") || message.includes("rejected")) {
        setSignInError("Signature rejected. Please try again to access all features.");
      } else {
        setSignInError(message);
      }
      return false;
    } finally {
      setSigningIn(false);
    }
  }, [address, signMessageAsync, setToken, setSigningIn, setSignInError]);

  // Full disconnect - clears wallet + auth
  const fullDisconnect = useCallback(() => {
    signOut();
    disconnect();
  }, [signOut, disconnect]);

  // Clear auth when wallet disconnects
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      signOut();
    }
  }, [isConnected, isAuthenticated, signOut]);

  return {
    // State
    isConnected,
    isAuthenticated,
    isSigningIn,
    signInError,
    needsSignIn,
    address,
    token,

    // Actions
    signIn,
    signOut,
    fullDisconnect,
  };
}
