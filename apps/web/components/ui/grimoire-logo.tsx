"use client";

import { cn } from "@/lib/utils";

interface GrimoireLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export function GrimoireLogo({
  className,
  size = 36,
  glow = false,
}: GrimoireLogoProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 flex items-center justify-center select-none transition-transform duration-300 hover:scale-105",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="Grimoire"
    >
      {glow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-full bg-violet-600/25 blur-lg -z-10"
          style={{ transform: "scale(1.2)" }}
        />
      )}
      <img
        src="/grimoire-mascot.png"
        alt="Grimoire"
        width={size}
        height={size}
        className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
      />
    </div>
  );
}
