"use client";

import { motion } from "framer-motion";
import { BookMarked, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavKey } from "@/lib/types";
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "./nav-config";
import { GrimoireBrand } from "@/components/ui/grimoire-brand";

type SidebarContentProps = {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  counts?: Partial<Record<NavKey, number>>;
};

function NavButton({
  item,
  active,
  onClick,
  count,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/nav relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
        active && "text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/20 via-violet-500/10 to-transparent ring-1 ring-inset ring-violet-400/25"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      {active && (
        <motion.span
          layoutId="nav-active-bar"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400 shadow-[0_0_10px_2px_oklch(0.62_0.24_295_/_0.7)]"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <Icon
        className={cn(
          "relative z-10 h-[18px] w-[18px] shrink-0 transition-colors",
          active
            ? "text-violet-300"
            : "text-muted-foreground group-hover/nav:text-foreground",
        )}
        strokeWidth={2}
      />
      <span className="relative z-10 flex-1 text-left">{item.label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "relative z-10 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
            active
              ? "bg-violet-400/20 text-violet-200"
              : "bg-white/[0.06] text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function SidebarContent({
  active,
  onNavigate,
  counts,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      {/* Brand & Landing Page Link */}
      <div className="px-2 py-3">
        <GrimoireBrand
          href="/"
          size="md"
          subscriptText="グリモワール • SANCTUARY"
        />
      </div>

      {/* Primary nav */}
      <nav className="mt-2 flex flex-col gap-1">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
          Library
        </p>
        {PRIMARY_NAV.map((item) => (
          <NavButton
            key={item.key}
            item={item}
            active={active === item.key}
            onClick={() => onNavigate(item.key)}
            count={counts?.[item.key]}
          />
        ))}
      </nav>

      {/* Secondary nav */}
      <nav className="mt-3 flex flex-col gap-1">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
          Explore
        </p>
        {SECONDARY_NAV.map((item) => (
          <NavButton
            key={item.key}
            item={item}
            active={active === item.key}
            onClick={() => onNavigate(item.key)}
          />
        ))}
      </nav>


    </div>
  );
}

export function DesktopSidebar({
  active,
  onNavigate,
  counts,
}: SidebarContentProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 lg:block">
      <div className="glass-strong m-3 h-[calc(100vh-1.5rem)] overflow-hidden rounded-3xl">
        <SidebarContent active={active} onNavigate={onNavigate} counts={counts} />
      </div>
    </aside>
  );
}
