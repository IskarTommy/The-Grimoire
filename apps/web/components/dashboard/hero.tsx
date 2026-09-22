"use client";

import { motion } from "framer-motion";
import { Play, Plus, Star, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import { STATUS_META, TYPE_META, ACCENT_CLASSES } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MediaItem } from "@/lib/types";

type HeroProps = {
  item?: MediaItem;
};

export function Hero({ item }: HeroProps) {
  if (!item) return null;

  const status = STATUS_META[item.status];
  const type = TYPE_META[item.type];
  const accent = ACCENT_CLASSES[item.accent];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/40">
        {/* Background banner/cover with cinematic overlay */}
        <div className="absolute inset-0">
          <img
            src={item.bannerImage || item.cover}
            alt={item.title}
            className={`h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105 ${
              !item.bannerImage ? "blur-md opacity-40 scale-110" : "opacity-60"
            }`}
          />
          {/* Gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div
            className={`absolute inset-0 bg-gradient-to-tr ${accent.from} ${accent.to} opacity-40 mix-blend-soft-light`}
          />
        </div>

        {/* Content with small crisp cover card alongside the bio */}
        <div className="relative flex min-h-[360px] flex-col justify-end p-6 sm:min-h-[420px] sm:p-10 lg:min-h-[460px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 lg:gap-8">
            {/* Small crisp clickable cover image card */}
            <Link href={`/manga/${item.id}`} className="relative shrink-0 group/cover block">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600/40 to-fuchsia-600/40 blur-md opacity-60 transition-opacity duration-300 group-hover/cover:opacity-100" />
              <div className="relative h-[200px] w-[140px] sm:h-[240px] sm:w-[165px] lg:h-[270px] lg:w-[185px] overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-2xl transition-transform duration-300 group-hover/cover:scale-[1.02]">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 rounded-md border border-amber-300/30 bg-black/70 px-2 py-0.5 text-[11px] font-bold text-amber-300 backdrop-blur-md">
                    <Star className="h-3 w-3 fill-amber-300" />
                    {item.rating.toFixed(1)}
                  </span>
                  <span className="rounded-md border border-white/15 bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-md">
                    Ch. {item.currentChapter}
                  </span>
                </div>
              </div>
            </Link>

            {/* Title, bio and actions */}
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={`border-white/10 bg-black/40 backdrop-blur-md ${type.className}`}
                >
                  {type.label}
                </Badge>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-xs font-medium backdrop-blur-md ${status.textClass}`}
                >
                  <span
                    className={`relative h-1.5 w-1.5 rounded-full ${status.dotClass} ${status.ringClass}`}
                  />
                  {status.label}
                </span>
                {item.hasAnime && (
                  <Badge
                    variant="outline"
                    className="border-sky-400/30 bg-sky-500/15 text-sky-200 backdrop-blur-md"
                  >
                    Anime Adaptation
                  </Badge>
                )}
              </div>

              <div className="max-w-2xl">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">
                  Featured Masterpiece
                </p>
                <Link href={`/manga/${item.id}`}>
                  <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-white hover:text-violet-300 transition-colors cursor-pointer sm:text-4xl lg:text-5xl">
                    {item.title}
                  </h2>
                </Link>
                <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                  {item.synopsis || "Dive into this world of extraordinary storytelling, vivid artwork, and unforgettable characters."}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Ch. {item.currentChapter}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {item.lastUpdated}
                  </span>
                  <span className="text-white/40">·</span>
                  {item.genres.slice(0, 4).map((g) => (
                    <span key={g} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-white/60">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  size="lg"
                  className="h-11 gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-black shadow-[0_10px_30px_-8px_oklch(0.62_0.24_295_/_0.5)] transition hover:bg-white/90"
                >
                  <Play className="h-4 w-4 fill-black" />
                  Continue Reading
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 gap-2 rounded-xl border-white/20 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Add to Library
                </Button>
              </div>

              {/* Progress */}
              <div className="mt-1 flex items-center gap-3">
                <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${accent.bar}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums text-white/70">
                  {item.progress}% · Ch. {item.currentChapter}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
