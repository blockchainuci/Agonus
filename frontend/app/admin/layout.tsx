"use client";

import AdminSidebar from "@/app/components/admin/layout/AdminSidebar";
import Link from "next/link";
import { useState } from "react";
import CreateTournamentModal, { TournamentFormData } from "@/app/components/admin/tournaments/CreateTournamentModal";
import CreateAgentModal, { AgentFormData } from "@/app/components/admin/agents/CreateAgentModal";
import { useWalletAuth } from "@/src/hooks/useWalletAuth";
import { ConnectWallet } from "@/src/components/wallet/ConnectWallet";
import { useCreateTournament } from "@/src/hooks/useTournaments";
import { useCreateAgent, useAgents } from "@/src/hooks/useAgents";
import { Loader2, ShieldAlert, ShieldX } from "lucide-react";
import toast from "react-hot-toast";
import "@/app/styles/datepicker.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false);
  const [isCreateAgentModalOpen, setIsCreateAgentModalOpen] = useState(false);

  const { isConnected, isAuthenticated, isSigningIn, signIn, signOut, isAdmin, address } = useWalletAuth();

  // Frontend allowlist — wallets always granted admin access regardless of JWT role
  const ADMIN_WALLETS = [
    "0x6cd7eae80775d4eb6b383abc0efd59842d701f76",
    "0x8d8cf0e9e670476b86bf7d7594e3e6286a9b23c5",
  ];
  const hasAdminAccess = isAdmin || ADMIN_WALLETS.includes(address?.toLowerCase() ?? "");
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
      toast.success("Tournament created");
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
      toast.success("Agent created");
    } catch (err) {
      toast.error((err as Error).message || "Failed to create agent");
    }
  };

  // Gate 1: Wallet not connected
  if (!isConnected) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#1E3A8A]">
        <div className="flex flex-col items-center text-center space-y-6 max-w-md p-8">
          <ShieldAlert className="w-16 h-16 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">Admin Access Required</h1>
          <p className="text-gray-400">Connect your admin wallet to access the dashboard.</p>
          <ConnectWallet variant="hero" />
        </div>
      </div>
    );
  }

  // Gate 2: Wallet connected but not signed in
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#1E3A8A]">
        <div className="text-center space-y-6 max-w-md p-8">
          <ShieldAlert className="w-16 h-16 text-cyan-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Sign In Required</h1>
          <p className="text-gray-400">
            Sign a message with your wallet to verify admin access.
          </p>
          <button
            onClick={signIn}
            disabled={isSigningIn}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing...
              </>
            ) : (
              "Sign In to Admin"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Gate 3: Signed in but not admin role
  if (!hasAdminAccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#1E3A8A]">
        <div className="text-center space-y-6 max-w-md p-8">
          <ShieldX className="w-16 h-16 text-red-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-gray-400">
            Wallet <span className="text-white font-mono text-sm">{address}</span> does not have admin privileges.
          </p>
          <p className="text-xs text-gray-500">If you are an admin, your session token may be outdated. Sign out and sign back in.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={async () => { await signOut?.(); await signIn(); }}
              disabled={isSigningIn}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2"
            >
              {isSigningIn ? <><Loader2 className="w-4 h-4 animate-spin" />Signing...</> : "Re-Sign In"}
            </button>
            <Link href="/" className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative bg-gradient-to-b from-[#0A2540] to-[#1E3A8A]">
      {/* Animated gradient glow effect */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,58,138,0.3),transparent_50%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)] pointer-events-none z-0" />

      {/* Checkered pattern overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none z-0" style={{
        backgroundImage: `
          linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
          linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%)
        `,
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px'
      }} />

      {/* Sidebar */}
      <div className="relative z-20">
        <AdminSidebar
          onCreateTournament={() => setIsCreateTournamentModalOpen(true)}
          onCreateAgent={() => setIsCreateAgentModalOpen(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10">
        <main className="p-8">
          {children}
        </main>
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
