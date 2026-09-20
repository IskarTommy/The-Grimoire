"use client";

import { motion } from "framer-motion";
import { Library, CirclePlay, BookOpenText, Star, TrendingUp } from "lucide-react";
import { libraryStats, MEDIA_ITEMS } from "@/lib/data";
import { cn } from "@/lib/utils";

const stats = libraryStats(MEDIA_ITEMS);

type Stat = {
  label: string;
  value: string;
  sub: string;
  icon: typeof Library;
  accent: string;
  ring: string;
  trend: string;
};

const items: Stat[] = [
  {
    label: "In Library",
    value: String(stats.total),
    sub: `${stats.completed} completed`,
    icon: Library,
    accent: "from-violet-500/20 to-transparent",
    ring: "text-violet-300",
    trend: "+3 this week",
  },
  {
    label: "Currently Reading",
    value: String(stats.ongoing),
    sub: "Active series",
    icon: CirclePlay,
    accent: "from-emerald-500/20 to-transparent",
    ring: "text-emerald-300",
    trend: "+1 today",
  },
  {
    label: "Chapters Read",
    value: stats.chapters.toLocaleString(),
    sub: "All time",
    icon: BookOpenText,
    accent: "from-rose-500/20 to-transparent",
    ring: "text-rose-300",
    trend: "+128 this week",
  },
  {
    label: "Avg. Rating",
    value: stats.avgRating.toFixed(1),
    sub: "Across library",
    icon: Star,
    accent: "from-amber-500/20 to-transparent",
    ring: "text-amber-300",
    trend: "Top 8%",
  },
];

export function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
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
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-300/90">
                <TrendingUp className="h-3 w-3" />
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
