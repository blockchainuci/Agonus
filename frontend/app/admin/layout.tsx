"use client";

import AdminSidebar from "@/app/components/admin/layout/AdminSidebar";
import { useState } from "react";
import CreateTournamentModal, { TournamentFormData } from "@/app/components/admin/tournaments/CreateTournamentModal";
import CreateAgentModal, { AgentFormData } from "@/app/components/admin/agents/CreateAgentModal";
import "@/app/styles/datepicker.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false);
  const [isCreateAgentModalOpen, setIsCreateAgentModalOpen] = useState(false);

  const handleCreateTournament = (data: TournamentFormData) => {
    console.log("Creating tournament:", data);
    // TODO: Add API call to create tournament
  };

  const handleCreateAgent = (data: AgentFormData) => {
    console.log("Creating agent:", data);
    // TODO: Add API call to create agent
  };
  return (
    <div className="flex min-h-screen relative bg-gradient-to-b from-[#0A2540] to-[#1E3A8A]">
      {/* Animated gradient glow effect - Behind everything */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,58,138,0.3),transparent_50%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)] pointer-events-none z-0" />

      {/* Subtle checkered pattern overlay - Behind everything */}
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

      {/* Sidebar Navigation - Above background */}
      <div className="relative z-20">
        <AdminSidebar
          onCreateTournament={() => setIsCreateTournamentModalOpen(true)}
          onCreateAgent={() => setIsCreateAgentModalOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10">
        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>

      {/* Create Tournament Modal */}
      <CreateTournamentModal
        isOpen={isCreateTournamentModalOpen}
        onClose={() => setIsCreateTournamentModalOpen(false)}
        onSubmit={handleCreateTournament}
      />

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateAgentModalOpen}
        onClose={() => setIsCreateAgentModalOpen(false)}
        onSubmit={handleCreateAgent}
      />
    </div>
  );
}
