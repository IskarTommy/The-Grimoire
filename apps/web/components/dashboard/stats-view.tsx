"use client";

import { motion } from "framer-motion";
import { TrendingUp, BookOpen, Clock, Award } from "lucide-react";
import {
  libraryStats,
  MEDIA_ITEMS,
  STATUS_META,
  TYPE_META,
} from "@/lib/data";
import type { ItemType, ItemStatus } from "@/lib/types";
import { StatCards } from "./stat-cards";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/utils";

const stats = libraryStats(MEDIA_ITEMS);

const typeDistribution: { type: ItemType; count: number }[] = (
  ["MANGA", "MANHWA", "MANHUA", "ANIME"] as ItemType[]
).map((t) => ({
  type: t,
  count: MEDIA_ITEMS.filter((i) => i.type === t).length,
}));

const statusDistribution: { status: ItemStatus; count: number }[] = (
  ["ONGOING", "COMPLETED", "PLANNED", "HIATUS", "DROPPED"] as ItemStatus[]
).map((s) => ({
  status: s,
  count: MEDIA_ITEMS.filter((i) => i.status === s).length,
}));

// Mock weekly reading activity (chapters read per day)
const weeklyActivity = [
  { day: "Mon", value: 18 },
  { day: "Tue", value: 24 },
  { day: "Wed", value: 12 },
  { day: "Thu", value: 32 },
  { day: "Fri", value: 28 },
  { day: "Sat", value: 41 },
  { day: "Sun", value: 36 },
];
const maxActivity = Math.max(...weeklyActivity.map((d) => d.value));

export function StatsView() {
  return (
    <div className="space-y-6">
      <StatCards />

      {/* Weekly activity chart */}
      <section className="space-y-4">
        <SectionHeader
          title="Reading Activity"
          subtitle="Chapters read this week"
          accent="text-violet-300"
          actionLabel="Details"
        />
        <div className="glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3 sm:gap-4">
            {weeklyActivity.map((d, i) => (
              <div
                key={d.day}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex h-40 w-full items-end justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.value / maxActivity) * 100}%` }}
                    transition={{
                      duration: 0.7,
                      delay: i * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-violet-600/60 to-fuchsia-400 shadow-[0_-6px_20px_-6px_oklch(0.62_0.24_295_/_0.5)]"
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
            title="By Type"
            subtitle="Your collection breakdown"
            accent="text-teal-300"
            actionLabel=""
            onAction={() => {}}
          />
          <div className="glass space-y-3 rounded-3xl p-5">
            {typeDistribution.map((t) => {
              const pct = Math.round((t.count / stats.total) * 100);
              const meta = TYPE_META[t.type];
              return (
                <div key={t.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {meta.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
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
                        t.type === "ANIME" && "bg-gradient-to-r from-amber-300 to-yellow-400",
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
          <div className="glass space-y-3 rounded-3xl p-5">
            {statusDistribution.map((s) => {
              const pct = Math.round((s.count / stats.total) * 100);
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
                    <span className="tabular-nums text-muted-foreground">
                      {s.count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className={cn("h-full rounded-full bg-current", meta.textClass)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Achievement cards */}
      <section className="space-y-4">
        <SectionHeader
          title="Achievements"
          subtitle="Milestones you've unlocked"
          accent="text-amber-300"
          actionLabel="All badges"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: BookOpen, label: "Bookworm", value: `${stats.chapters} chapters`, color: "text-violet-300" },
            { icon: Clock, label: "Streak", value: "14 days", color: "text-emerald-300" },
            { icon: Award, label: "Completionist", value: `${stats.completed} finished`, color: "text-amber-300" },
            { icon: TrendingUp, label: "Critic", value: `${stats.avgRating} avg`, color: "text-rose-300" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.label}
                className="glass flex flex-col items-center gap-2 rounded-2xl p-4 text-center"
              >
                <span className={cn("grid h-11 w-11 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/10", a.color)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {a.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{a.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
