'use client';

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

interface DashboardHeaderProps {
  wallet?: string; // optional until Wagmi connected
  tournamentId?: number; // optional
}

export default function DashboardHeader({ wallet, tournamentId }: DashboardHeaderProps) {

  // fallback placeholder until wagmi / store is connected
  const displayWallet = wallet ?? "Connect Wallet";

  return (
    <motion.div
      className="bg-gradient-to-br from-[#001D3D]/60 to-[#003566]/40 
                 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >

      {/* Top row: icon + greeting */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-cyan-400" />
        </div>

        <h2 className="text-2xl font-semibold text-white">
          Welcome Back
        </h2>
      </div>

      {/* Wallet Address */}
      <p className="text-gray-400 text-sm">
        Connected Wallet:{" "}
        <span className="text-white font-medium">
          {displayWallet}
        </span>
      </p>

      {/* Optional Tournament context */}
      {tournamentId && (
        <p className="text-gray-400 text-sm mt-1">
          Viewing Tournament:{" "}
          <span className="text-[#FFD700] font-semibold">
            #{tournamentId}
          </span>
        </p>
      )}
    </motion.div>
  );
}
