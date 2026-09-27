"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Library, CirclePlay, BookOpenText, Star, Sparkles } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

interface StatCardsProps {
  items?: MediaItem[];
}

export function StatCards({ items: propItems }: StatCardsProps) {
  const { libraryItems, rawEntries } = useLibrary();
  const items = propItems || libraryItems;

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === "COMPLETED").length;
    const ongoing = items.filter((i) => i.status === "ONGOING").length;
    const chapters = items.reduce((acc, curr) => acc + (curr.currentChapter || 0), 0);

    const ratedItems = rawEntries.filter((e) => typeof e.rating === "number" && e.rating > 0);
    const avgRating =
      ratedItems.length > 0
        ? ratedItems.reduce((acc, curr) => acc + (curr.rating || 0), 0) / ratedItems.length
        : items.filter((i) => i.rating > 0).length > 0
        ? items.filter((i) => i.rating > 0).reduce((acc, curr) => acc + curr.rating, 0) /
          items.filter((i) => i.rating > 0).length
        : 0;

    return {
      total,
      completed,
      ongoing,
      chapters,
      avgRating,
    };
  }, [items, rawEntries]);

  const cards = [
    {
      label: "In Library",
      value: String(stats.total),
      sub: `${stats.completed} completed`,
      icon: Library,
      accent: "from-violet-500/20 to-transparent",
      ring: "text-violet-300",
      trend: stats.total > 0 ? "Active sanctuary" : "Start collecting",
    },
    {
      label: "Currently Reading",
      value: String(stats.ongoing),
      sub: "Active series",
      icon: CirclePlay,
      accent: "from-emerald-500/20 to-transparent",
      ring: "text-emerald-300",
      trend: `${stats.ongoing} in progress`,
    },
    {
      label: "Chapters Read",
      value: stats.chapters.toLocaleString(),
      sub: "All time total",
      icon: BookOpenText,
      accent: "from-rose-500/20 to-transparent",
      ring: "text-rose-300",
      trend: "Tracked progress",
    },
    {
      label: "Avg. Rating",
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—",
      sub: stats.avgRating > 0 ? "Personal score" : "Rate your reads",
      icon: Star,
      accent: "from-amber-500/20 to-transparent",
      ring: "text-amber-300",
      trend: stats.avgRating > 0 ? "Rated" : "Unscored",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="glass relative overflow-hidden rounded-2xl p-4 sm:p-5"
          >
            <div
              className={cn(
                "pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br blur-2xl",
                s.accent,
              )}
            />
            <div className="relative flex items-center justify-between">
              <span
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/10",
                  s.ring,
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-violet-300/80">
                <Sparkles className="h-3 w-3 text-violet-400" />
                {s.trend}
              </span>
            </div>
            <div className="relative mt-4">
              <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-foreground/80">
                {s.label}
              </p>
              <p className="text-[11px] text-muted-foreground">{s.sub}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
