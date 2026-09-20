"use client";

import type { MediaItem } from "@/lib/types";
import { MangaCard } from "./manga-card";
import { cn } from "@/lib/utils";

type MangaGridProps = {
  items: MediaItem[];
  className?: string;
  /** number of columns at the lg breakpoint */
  dense?: boolean;
  emptyMessage?: string;
};

export function MangaGrid({
  items,
  className,
  dense,
  emptyMessage = "No items found.",
}: MangaGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5",
        dense && "xl:grid-cols-6",
        className,
      )}
    >
      {items.map((item, i) => (
        <MangaCard key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}
