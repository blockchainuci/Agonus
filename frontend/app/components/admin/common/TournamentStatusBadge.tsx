"use client";

import { TournamentStatus } from "@/types/admin";
import { Clock, Zap, Trophy } from "lucide-react";

interface TournamentStatusBadgeProps {
  status: TournamentStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig = {
  [TournamentStatus.UPCOMING]: {
    label: "Upcoming",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-300",
    borderColor: "border-blue-500/30",
    icon: Clock,
    pulse: false,
  },
  [TournamentStatus.LIVE]: {
    label: "Live",
    bgColor: "bg-white/10",
    textColor: "text-white",
    borderColor: "border-white/30",
    icon: Zap,
    pulse: true,
  },
  [TournamentStatus.COMPLETED]: {
    label: "Completed",
    bgColor: "bg-yellow-500/20",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-500/30",
    icon: Trophy,
    pulse: false,
  },
};

const sizeClasses = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-3 py-1.5",
  lg: "text-base px-4 py-2",
};

export default function TournamentStatusBadge({
  status,
  size = "md",
  className = "",
}: TournamentStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
        ${config.pulse ? "animate-pulse" : ""}
        ${className}
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </div>
  );
}
