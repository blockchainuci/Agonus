"use client";

import { useWalletAuth } from "@/src/hooks/useWalletAuth";
import { Loader2, Wallet, X, AlertCircle, CheckCircle } from "lucide-react";

interface SignInPromptProps {
  onClose?: () => void;
  variant?: "modal" | "inline" | "banner";
}

export function SignInPrompt({ onClose, variant = "inline" }: SignInPromptProps) {
  const { isSigningIn, signInError, signIn, isAuthenticated, address } = useWalletAuth();

  // Already authenticated
  if (isAuthenticated) {
    if (variant === "banner") {
      return null;
    }
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>Signed in as {address?.slice(0, 6)}...{address?.slice(-4)}</span>
      </div>
    );
  }

  // Banner variant - minimal top banner
  if (variant === "banner") {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-amber-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Sign in to access betting features</span>
          </div>
          <button
            onClick={signIn}
            disabled={isSigningIn}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium transition disabled:opacity-50"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Signing...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Modal variant
  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-[#001D3D] p-6 shadow-2xl">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sign In to Agonus</h2>
            <p className="text-gray-400 text-sm">
              Sign a message with your wallet to verify ownership and access all features.
            </p>
          </div>

          {signInError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {signInError}
            </div>
          )}

          <button
            onClick={signIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold transition disabled:opacity-50"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Waiting for signature...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Sign Message
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            This signature is free and does not send any transaction.
          </p>
        </div>
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Wallet className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white mb-1">Sign in required</h3>
          <p className="text-xs text-gray-400 mb-3">
            Sign a message to verify wallet ownership and access betting features.
          </p>

          {signInError && (
            <p className="text-xs text-red-400 mb-3">{signInError}</p>
          )}

          <button
            onClick={signIn}
            disabled={isSigningIn}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium transition disabled:opacity-50"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
