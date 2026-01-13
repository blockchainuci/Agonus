"use client";

import type { HealthStatus } from "@/types/admin";
import { getHealthColor, getHealthLabel } from "@/lib/utils/admin/health";

interface HealthDotProps {
  status: HealthStatus;
  size?: "sm" | "md" | "lg";
  withLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export default function HealthDot({
  status,
  size = "md",
  withLabel = false,
  className = "",
}: HealthDotProps) {
  const color = getHealthColor(status);
  const label = getHealthLabel(status);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          ${status === "healthy" ? "animate-pulse" : ""}
        `}
        style={{ backgroundColor: color }}
      />
      {withLabel && (
        <span
          className={`
            text-sm font-medium
            ${status === "stuck" ? "text-red-400" : ""}
            ${status === "slow" ? "text-yellow-400" : ""}
            ${status === "healthy" ? "text-green-400" : ""}
          `}
        >
          {label}
        </span>
      )}
    </div>
  );
}
