"use client";

import Link from "next/link";
import { GrimoireLogo } from "./grimoire-logo";
import { cn } from "@/lib/utils";

interface GrimoireBrandProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showMascot?: boolean;
  showSubscript?: boolean;
  subscriptText?: string;
  className?: string;
  clickable?: boolean;
}

export function GrimoireBrand({
  href = "/",
  size = "md",
  showMascot = true,
  showSubscript = true,
  subscriptText = "グリモワール",
  className,
  clickable = true,
}: GrimoireBrandProps) {
  const mascotSizes = {
    sm: 30,
    md: 36,
    lg: 48,
  };

  const titleSizes = {
    sm: "text-base tracking-tight",
    md: "text-lg tracking-tight",
    lg: "text-2xl sm:text-3xl tracking-tight",
  };

  const kanaSizes = {
    sm: "text-[7.5px] tracking-[0.22em]",
    md: "text-[8.5px] tracking-[0.24em]",
    lg: "text-[10px] tracking-[0.28em]",
  };

  const content = (
    <div
      className={cn(
        "group relative flex items-center gap-2.5 select-none transition-all duration-300",
        clickable && "cursor-pointer hover:opacity-95",
        className
      )}
      title="Grimoire — Return to Home"
    >
      {showMascot && (
        <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
          <GrimoireLogo size={mascotSizes[size]} />
        </div>
      )}

      <div className="flex flex-col leading-none">
        {/* Modern Anime Stylized Wordmark */}
        <div className="flex items-center">
          <span
            className={cn(
              "font-display font-black italic bg-gradient-to-r from-white via-violet-200 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(168,85,247,0.45)] transition-all duration-300 group-hover:drop-shadow-[0_0_18px_rgba(192,132,252,0.7)]",
              titleSizes[size]
            )}
          >
            Grimoire
          </span>
        </div>

        {/* Japanese Furigana / Katakana Sub-script */}
        {showSubscript && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={cn(
                "font-sans font-black text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)] uppercase transition-colors duration-300 group-hover:text-sky-300",
                kanaSizes[size]
              )}
            >
              {subscriptText}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (!clickable) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg">
      {content}
    </Link>
  );
}
