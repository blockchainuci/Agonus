'use client';

import { ReactNode, useState, useRef } from "react";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export default function Tooltip({
  children,
  content,
  side = "top",
  delay = 120,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={() => setTimeout(() => setVisible(true), delay)}
      onMouseLeave={() => setVisible(false)}
    >
      {/* Hover Element */}
      {children}

      {/* Tooltip */}
      {visible && (
        <div
          className={`
            absolute w-max max-w-xs px-3 py-2
            bg-[#0d1220]/95 backdrop-blur-md 
            text-gray-200 text-xs rounded-xl 
            border border-white/10 shadow-2xl z-50 animate-fadeInUp
            ${side === "top" ? "bottom-full left-1/2 -translate-x-1/2 mb-2" : ""}
            ${side === "bottom" ? "top-full left-1/2 -translate-x-1/2 mt-2" : ""}
            ${side === "left" ? "right-full top-1/2 -translate-y-1/2 mr-2" : ""}
            ${side === "right" ? "left-full top-1/2 -translate-y-1/2 ml-2" : ""}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
}
