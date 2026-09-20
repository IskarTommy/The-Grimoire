"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  accent?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function SectionHeader({
  title,
  subtitle,
  accent = "text-violet-300",
  actionLabel = "View all",
  onAction,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("h-4 w-1 rounded-full bg-current", accent)} />
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="mt-1 truncate pl-3 text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onAction}
        className="group flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
      >
        {actionLabel}
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
