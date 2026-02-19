"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "electric" | "gold";
  className?: string;
}

const variantStyles = {
  default: "bg-white/5 border-white/10",
  electric: "bg-blue-500/10 border-blue-500/20",
  gold: "bg-yellow-500/10 border-yellow-500/20",
};

export default function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  variant = "default",
  className = "",
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl border p-6 transition-all duration-300
        hover:scale-105 hover:bg-white/8
        ${variantStyles[variant]}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>

          {trend && trendValue && (
            <div className="mt-3 flex items-center gap-1">
              {trend === "up" && (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
              {trend === "down" && (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend === "up" ? "text-green-500" : "text-red-500"
                }`}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div className="text-gray-400 opacity-50">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
