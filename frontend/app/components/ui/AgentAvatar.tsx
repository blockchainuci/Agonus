"use client";

import { useState } from "react";

interface AgentAvatarProps {
  avatarUrl?: string | null;
  name: string;
  color: string;
  /** sm = 28px, md = 36px, lg = 56px */
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  className?: string;
}

const SIZE_CLASS = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-14 h-14" };
const TEXT_CLASS = { sm: "text-[11px]", md: "text-sm", lg: "text-xl" };

export default function AgentAvatar({
  avatarUrl,
  name,
  color,
  size = "sm",
  glow = false,
  className = "",
}: AgentAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = (
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("") || name.slice(0, 2)
  ).toUpperCase();

  return (
    <div
      className={`${SIZE_CLASS[size]} rounded-full overflow-hidden flex items-center justify-center font-bold flex-shrink-0 ${className}`}
      style={{
        background: `${color}25`,
        border: `1.5px solid ${color}50`,
        boxShadow: glow ? `0 0 14px ${color}45` : undefined,
      }}
    >
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`${TEXT_CLASS[size]} font-bold`} style={{ color }}>
          {initials}
        </span>
      )}
    </div>
  );
}
