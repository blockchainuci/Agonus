"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CreateTournamentModal, {
  TournamentFormData,
} from "@/app/components/admin/tournaments/CreateTournamentModal";
import CreateAgentModal, {
  AgentFormData,
} from "@/app/components/admin/agents/CreateAgentModal";
import { useWalletAuth } from "@/src/hooks/useWalletAuth";
import { ConnectWallet } from "@/src/components/wallet/ConnectWallet";
import { useCreateTournament } from "@/src/hooks/useTournaments";
import { useCreateAgent, useAgents } from "@/src/hooks/useAgents";
import {
  Loader2,
  ShieldAlert,
  ShieldX,
  TerminalSquare,
  Plus,
  Bot,
  Trophy,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import "@/app/styles/datepicker.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] =
    useState(false);
  const [isCreateAgentModalOpen, setIsCreateAgentModalOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const {
    isConnected,
    isAuthenticated,
    isSigningIn,
    signIn,
    signOut,
    isAdmin,
    address,
  } = useWalletAuth();

  // Frontend allowlist ensures designated wallets always receive access regardless of JWT role checks
  const ADMIN_WALLETS = [
    "0x6cd7eae80775d4eb6b383abc0efd59842d701f76",
    "0x8d8cf0e9e670476b86bf7d7594e3e6286a9b23c5",
  ];
  const hasAdminAccess =
    isAdmin || ADMIN_WALLETS.includes(address?.toLowerCase() ?? "");

  const createTournament = useCreateTournament();
  const createAgent = useCreateAgent();
  const { data: agents = [] } = useAgents();

  const handleCreateTournament = async (data: TournamentFormData) => {
    try {
      await createTournament.mutateAsync({
        name: data.name,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date.toISOString(),
        prize_pool: data.prize_pool,
        agent_ids: data.agent_ids || [],
      });
      setIsCreateTournamentModalOpen(false);
      toast.success("Tournament created successfully");
    } catch (err) {
      toast.error((err as Error).message || "Failed to create tournament");
    }
  };

  const handleCreateAgent = async (data: AgentFormData) => {
    try {
      await createAgent.mutateAsync({
        name: data.name,
        personality: data.personality,
        strategy_type: data.strategy_type,
        stats: data.stats,
      });
      setIsCreateAgentModalOpen(false);
      toast.success("Agent deployed successfully");
    } catch (err) {
      toast.error((err as Error).message || "Failed to deploy agent");
    }
  };

  // This reusable wrapper maintains visual consistency across all security checkpoints
  const SecurityGateWrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      className="flex h-screen items-center justify-center relative overflow-hidden"
      style={{ background: "#0a0e17" }}
    >
      {/* Background ambient glows create depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-[#0c1422] border border-white/5 shadow-2xl flex flex-col items-center text-center">
        {children}
      </div>
    </div>
  );

  // Security Gate 1: Check for wallet connection
  if (!isConnected) {
    return (
      <SecurityGateWrapper>
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Authentication Required
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          You are attempting to access a restricted system zone. Please connect
          an authorized administrator wallet to proceed.
        </p>
        <div className="w-full">
          <ConnectWallet variant="hero" />
        </div>
      </SecurityGateWrapper>
    );
  }

  // Security Gate 2: Verify the cryptographic signature establishes a session
  if (!isAuthenticated) {
    return (
      <SecurityGateWrapper>
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
          <TerminalSquare className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Cryptographic Signature
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          Your wallet is connected, but we require a cryptographic signature to
          verify ownership and establish a secure session.
        </p>
        <button
          onClick={signIn}
          disabled={isSigningIn}
          className="w-full py-3.5 rounded-xl font-bold text-black flex items-center justify-center gap-2 transition-all hover:scale-[0.98] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
        >
          {isSigningIn ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying Signature...
            </>
          ) : (
            "Sign Message to Enter"
          )}
        </button>
      </SecurityGateWrapper>
    );
  }

  // Security Gate 3: Confirm the connected identity has the correct access privileges
  if (!hasAdminAccess) {
    return (
      <SecurityGateWrapper>
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          The connected wallet identity does not possess the required clearance
          level for the Admin Console.
        </p>

        <div className="w-full p-4 rounded-xl bg-black/40 border border-white/5 mb-8">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Current Identity
          </p>
          <p className="text-sm font-mono text-zinc-300 break-all">{address}</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={async () => {
              await signOut?.();
              await signIn();
            }}
            disabled={isSigningIn}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-all"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              "Refresh Session"
            )}
          </button>
          <Link
            href="/"
            className="w-full py-3.5 rounded-xl font-bold text-zinc-400 hover:text-white transition-colors text-center"
          >
            Return to Public Terminal
          </Link>
        </div>
      </SecurityGateWrapper>
    );
  }

  // Active Admin View Rendering
  return (
    <div
      className="flex min-h-screen relative text-white"
      style={{ background: "#0a0e17" }}
    >
      {/* Subtle ambient background glows to tie the design together */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[150px] opacity-50" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[150px] opacity-50" />
      </div>

      {/* Very faint structural dot matrix background */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex flex-col h-screen overflow-hidden">
        {children}
      </div>

      {/* Floating Command Menu for Quick Actions */}
      <div className="fixed bottom-8 right-8 z-50">
        {isFabMenuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsFabMenuOpen(false)}
          />
        )}

        <div className="relative z-50 flex flex-col items-end">
          <AnimatePresence>
            {isFabMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="mb-4 w-64 bg-[#0c1422] border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Admin Actions
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsCreateAgentModalOpen(true);
                    setIsFabMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Deploy Agent
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Initialize a new trader
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsCreateTournamentModalOpen(true);
                    setIsFabMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Trophy className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      New Tournament
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Create a competition
                    </p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-transform hover:scale-105 z-50"
            style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
          >
            <motion.div
              animate={{ rotate: isFabMenuOpen ? 135 : 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Plus className="w-6 h-6 text-white" />
            </motion.div>
          </button>
        </div>
      </div>

      <CreateTournamentModal
        isOpen={isCreateTournamentModalOpen}
        onClose={() => setIsCreateTournamentModalOpen(false)}
        onSubmit={handleCreateTournament}
      />

      <CreateAgentModal
        isOpen={isCreateAgentModalOpen}
        onClose={() => setIsCreateAgentModalOpen(false)}
        onSubmit={handleCreateAgent}
      />
    </div>
  );
}
