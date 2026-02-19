"use client";

import { TradeAction } from "@/types/admin";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TradeActionBadgeProps {
  action: TradeAction;
  size?: "sm" | "md";
  className?: string;
}

const actionConfig = {
  [TradeAction.BUY]: {
    label: "BUY",
    bgColor: "bg-green-500/20",
    textColor: "text-green-400",
    borderColor: "border-green-500/30",
    icon: TrendingUp,
  },
  [TradeAction.SELL]: {
    label: "SELL",
    bgColor: "bg-red-500/20",
    textColor: "text-red-400",
    borderColor: "border-red-500/30",
    icon: TrendingDown,
  },
  [TradeAction.HOLD]: {
    label: "HOLD",
    bgColor: "bg-gray-500/20",
    textColor: "text-gray-400",
    borderColor: "border-gray-500/30",
    icon: Minus,
  },
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
};

export default function TradeActionBadge({
  action,
  size = "md",
  className = "",
}: TradeActionBadgeProps) {
  const config = actionConfig[action];
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-1 rounded-md border font-bold
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </div>
  );
}
