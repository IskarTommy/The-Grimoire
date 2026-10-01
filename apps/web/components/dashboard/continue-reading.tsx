"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, BookOpen, Tv, Loader2 } from "lucide-react";
import type { MediaItem } from "@/lib/types";
import { STATUS_META, ACCENT_CLASSES } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";
import { fetchDirectChapterToRead } from "@/hooks/use-mangadex";

type ContinueReadingProps = {
  items: MediaItem[];
};

function ContinueCard({ item, index }: { item: MediaItem; index: number }) {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);

  const accent = ACCENT_CLASSES[item.accent];
  const status = STATUS_META[item.status];
  const isAnime = item.type === "ANIME";
  const current = isAnime ? item.currentEpisode : item.currentChapter;

  const handleLaunch = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAnime) {
      router.push(`/manga/${item.id}`);
      return;
    }
    try {
      setLaunching(true);
      const chId = await fetchDirectChapterToRead(item.title, item.id, item.currentChapter || 0);
      if (chId) {
        router.push(`/read/${item.id}/${chId}`);
      } else {
        router.push(`/manga/${item.id}`);
      }
    } catch {
      router.push(`/manga/${item.id}`);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      onClick={handleLaunch}
      className="group relative w-[260px] shrink-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] sm:w-[280px] cursor-pointer hover:border-violet-500/30 transition-all shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={item.cover}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-tr opacity-40 mix-blend-soft-light",
            accent.from,
            accent.to,
          )}
        />

        {/* status dot */}
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-medium backdrop-blur-md">
          <span
            className={cn(
              "relative h-1.5 w-1.5 rounded-full",
              status.dotClass,
              "animate-pulse-glow",
              status.ringClass,
            )}
          />
          <span className={status.textClass}>{status.label}</span>
        </span>

        {/* play cta */}
        <button
          type="button"
          onClick={handleLaunch}
          disabled={launching}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:bg-white/20 group-hover:opacity-100 shadow-md cursor-pointer"
          aria-label="Continue"
        >
          {launching ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Play className="h-4 w-4 fill-white" />
          )}
        </button>

        {/* bottom info over image */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="truncate font-display text-sm font-semibold text-white">
            {item.title}
          </h3>
          <div className="mt-1 flex items-center justify-between text-[11px] text-white/70">
            <span className="flex items-center gap-1">
              {isAnime ? (
                <Tv className="h-3 w-3" />
              ) : (
                <BookOpen className="h-3 w-3" />
              )}
              {isAnime ? "Ep." : "Ch."} {current}
            </span>
            <span className="font-semibold tabular-nums">{item.progress}%</span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r", accent.bar)}
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ContinueReading({ items }: ContinueReadingProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Continue Reading"
        subtitle="Pick up right where you left off"
        accent="text-violet-300"
        actionLabel=""
        onAction={() => {}}
      />
      <div className="relative">
        {/* Scroll buttons */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-background/80 text-foreground backdrop-blur-md transition hover:bg-background sm:grid"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-background/80 text-foreground backdrop-blur-md transition hover:bg-background sm:grid"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div
          ref={scrollerRef}
          className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 sm:gap-4"
        >
          {items.map((item, i) => (
            <div key={item.id} className="snap-start">
              <ContinueCard item={item} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
