"use client";

import { motion } from "framer-motion";
import { Star, BookOpen, Tv, ArrowUpRight } from "lucide-react";
import type { MediaItem } from "@/lib/types";
import { STATUS_META, TYPE_META, ACCENT_CLASSES } from "@/lib/data";
import { cn } from "@/lib/utils";

type MangaCardProps = {
  item: MediaItem;
  index?: number;
};

export function MangaCard({ item, index = 0 }: MangaCardProps) {
  const status = STATUS_META[item.status];
  const type = TYPE_META[item.type];
  const accent = ACCENT_CLASSES[item.accent];
  const isAnime = item.type === "ANIME";
  const current = isAnime ? item.currentEpisode : item.currentChapter;
  const total = isAnime ? item.totalEpisodes : item.totalChapters;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] transition-all duration-300",
        "hover:border-white/15 hover:-translate-y-1",
        accent.glow,
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={item.cover}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* top gradient for badges */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 to-transparent" />
        {/* bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Top row: type + status + anime badge */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <div className="flex gap-1.5">
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-md",
                type.className,
              )}
            >
              {type.label}
            </span>
            {item.hasAnime && (
              <span className="flex items-center gap-1 rounded-md border border-sky-300/30 bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-200 backdrop-blur-md shadow-[0_0_10px_rgba(14,165,233,0.2)]">
                <Tv className="h-3 w-3" />
                Anime
              </span>
            )}
          </div>
          <span
            className="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-medium backdrop-blur-md"
            title={status.label}
          >
            <span
              className={cn(
                "relative h-1.5 w-1.5 rounded-full",
                status.dotClass,
                item.status === "ONGOING" && "animate-pulse-glow",
                status.ringClass,
              )}
            />
            <span className={status.textClass}>{status.label}</span>
          </span>
        </div>

        {/* Rating chip */}
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded-md border border-amber-300/20 bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 backdrop-blur-md">
          <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
          {item.rating.toFixed(1)}
        </div>

        {/* Hover quick-open */}
        <div className="absolute left-2.5 bottom-2.5 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-violet-200">
            {item.title}
          </h3>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {item.author}
          </p>
        </div>

        {/* Progress */}
        <div className="mt-auto">
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              {isAnime ? (
                <Tv className="h-3 w-3" />
              ) : (
                <BookOpen className="h-3 w-3" />
              )}
              {(current ?? 0) > 0 ? `Ch. ${current}` : "Not started"}
              {total ? ` / ${total}` : ""}
            </span>
            <span className="font-semibold tabular-nums text-foreground/80">
              {item.progress}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                accent.bar,
              )}
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Accent edge glow on hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          accent.from,
          accent.to,
        )}
        style={{ mixBlendMode: "soft-light" }}
      />
    </motion.article>
  );
}
