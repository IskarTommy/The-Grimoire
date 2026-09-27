"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, BookOpen, Clock, Award, Sparkles } from "lucide-react";
import { STATUS_META, TYPE_META } from "@/lib/data";
import type { ItemType, ItemStatus } from "@/lib/types";
import { StatCards } from "./stat-cards";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/hooks/use-library";

// Estimated activity distributions based on chapters read
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function StatsView() {
  const { libraryItems, rawEntries } = useLibrary();

  const total = libraryItems.length;

  const typeDistribution = useMemo(() => {
    return (["MANGA", "MANHWA", "MANHUA", "ANIME"] as ItemType[]).map((t) => {
      const count =
        t === "ANIME"
          ? libraryItems.filter((i) => i.hasAnime || i.type === "ANIME").length
          : libraryItems.filter((i) => i.type === t).length;
      return {
        type: t,
        count,
      };
    });
  }, [libraryItems]);

  const statusDistribution = useMemo(() => {
    return (["ONGOING", "COMPLETED", "PLANNED"] as ItemStatus[]).map((s) => ({
      status: s,
      count: libraryItems.filter((i) => i.status === s).length,
    }));
  }, [libraryItems]);

  const totalChapters = useMemo(() => {
    return libraryItems.reduce((acc, curr) => acc + (curr.currentChapter || 0), 0);
  }, [libraryItems]);

  // Dynamic distribution of reading activity across the week
  const weeklyActivity = useMemo(() => {
    if (totalChapters === 0) {
      return DAYS.map((day) => ({ day, value: 0 }));
    }
    const weights = [0.12, 0.15, 0.08, 0.20, 0.16, 0.18, 0.11];
    return DAYS.map((day, i) => ({
      day,
      value: Math.max(1, Math.round(totalChapters * (weights[i] ?? 0.14) * 0.25)),
    }));
  }, [totalChapters]);

  const maxActivity = Math.max(1, ...weeklyActivity.map((d) => d.value));

  return (
    <div className="space-y-6">
      <StatCards />

      {/* Weekly activity chart */}
      <section className="space-y-4">
        <SectionHeader
          title="Reading Activity"
          subtitle="Estimated weekly chapter momentum"
          accent="text-violet-300"
          actionLabel=""
          onAction={() => {}}
        />
        <div className="glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3 sm:gap-4">
            {weeklyActivity.map((d, i) => (
              <div
                key={d.day}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex h-36 w-full items-end justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.value / maxActivity) * 100}%` }}
                    transition={{
                      duration: 0.7,
                      delay: i * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-violet-600/60 to-fuchsia-400 shadow-[0_-6px_20px_-6px_rgba(168,85,247,0.5)]"
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {d.day}
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-foreground">
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Type distribution */}
        <section className="space-y-4">
          <SectionHeader
            title="By Format"
            subtitle="Your collection breakdown"
            accent="text-teal-300"
            actionLabel=""
            onAction={() => {}}
          />
          <div className="glass space-y-3.5 rounded-3xl p-5">
            {typeDistribution.map((t) => {
              const pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
              const meta = TYPE_META[t.type];
              return (
                <div key={t.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {meta.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground font-semibold">
                      {t.count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "h-full rounded-full",
                        t.type === "MANGA" && "bg-gradient-to-r from-violet-400 to-fuchsia-400",
                        t.type === "MANHWA" && "bg-gradient-to-r from-teal-300 to-cyan-400",
                        t.type === "MANHUA" && "bg-gradient-to-r from-rose-400 to-pink-400",
                        t.type === "ANIME" && "bg-gradient-to-r from-sky-400 to-cyan-400",
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Status distribution */}
        <section className="space-y-4">
          <SectionHeader
            title="By Status"
            subtitle="Where your series stand"
            accent="text-rose-300"
            actionLabel=""
            onAction={() => {}}
          />
          <div className="glass space-y-3.5 rounded-3xl p-5">
            {statusDistribution.map((s) => {
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              const meta = STATUS_META[s.status];
              return (
                <div key={s.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          meta.dotClass,
                          meta.ringClass,
                        )}
                      />
                      {meta.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground font-semibold">
                      {s.count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        s.status === "ONGOING" && "from-emerald-400 to-teal-400",
                        s.status === "COMPLETED" && "from-sky-400 to-blue-500",
                        s.status === "PLANNED" && "from-amber-400 to-orange-400",
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
