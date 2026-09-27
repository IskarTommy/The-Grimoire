"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, BookOpen, Tv, Bookmark, Plus, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MediaItem } from "@/lib/types";
import { STATUS_META, TYPE_META, ACCENT_CLASSES } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/hooks/use-library";
import { useAuth } from "@/contexts/auth-context";

type MangaCardProps = {
  item: MediaItem;
  index?: number;
};

export function MangaCard({ item, index = 0 }: MangaCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isInLibrary, getLibraryEntry, addToLibrary, updateStatus } = useLibrary();
  const entry = getLibraryEntry(item.id);
  const inLibrary = isInLibrary(item.id);
  const isPlanToRead = (entry?.status || "").toLowerCase() === "plan_to_read";
  const [adding, setAdding] = useState(false);

  const status = STATUS_META[item.status] || STATUS_META.ONGOING;
  const type = TYPE_META[item.type] || TYPE_META.MANGA;
  const accent = ACCENT_CLASSES[item.accent] || ACCENT_CLASSES.violet;
  const isAnime = item.type === "ANIME";
  const current = isAnime ? item.currentEpisode : item.currentChapter;
  const total = isAnime ? item.totalEpisodes : item.totalChapters;

  const handleQuickAdd = async (e: React.MouseEvent, targetStatus: string = "reading") => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?redirect=/manga/${item.id}`);
      return;
    }

    if (inLibrary) {
      router.push(isPlanToRead ? "/dashboard?nav=planned" : "/dashboard");
      return;
    }

    try {
      setAdding(true);
      await addToLibrary({
        mangaId: item.id,
        title: item.title,
        coverUrl: item.cover,
        status: targetStatus,
      });
    } catch (err) {
      console.error("Failed to quick add to library:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleStartReading = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAdding(true);
      await updateStatus(item.id, "reading");
    } catch (err) {
      console.error("Failed to start reading:", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link href={`/manga/${item.id}`} className="block h-full group">
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: Math.min(index * 0.05, 0.4),
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] transition-all duration-300",
          "hover:border-white/20 hover:-translate-y-1 shadow-lg shadow-black/30",
          inLibrary && "border-emerald-500/20 bg-emerald-950/[0.08]",
          accent.glow,
        )}
      >
        {/* Cover */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={item.cover}
            alt={item.title}
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105",
              inLibrary
                ? "opacity-55 saturate-50 contrast-90 group-hover:opacity-90 group-hover:saturate-100"
                : "opacity-100"
            )}
          />

          {/* In-Library Ambient Dimming Veil */}
          {inLibrary && (
            <div className="pointer-events-none absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors duration-500" />
          )}

          {/* Top gradient for badges */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/80 to-transparent" />
          {/* Bottom gradient */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          {/* Top row: type + status + anime badge + library badge */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5 z-10">
            <div className="flex flex-wrap items-center gap-1.5">
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
              {inLibrary && (
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur-md shadow-md",
                    isPlanToRead
                      ? "border-amber-400/40 bg-amber-500/25 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                      : "border-emerald-400/40 bg-emerald-500/25 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)] animate-pulse"
                  )}
                >
                  <Bookmark
                    className={cn(
                      "h-3 w-3",
                      isPlanToRead ? "fill-amber-400 text-amber-400" : "fill-emerald-400 text-emerald-400"
                    )}
                  />
                  {isPlanToRead ? "Plan to Read" : "In Library"}
                </span>
              )}
            </div>
            <span
              className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-medium backdrop-blur-md shrink-0"
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
          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded-md border border-amber-300/20 bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 backdrop-blur-md z-10">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
            {item.rating.toFixed(1)}
          </div>

          {/* Hover Quick Action Buttons: Reading, Plan to Read, or View in Library */}
          <div className="absolute left-2.5 bottom-2.5 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 z-20 flex items-center gap-1.5">
            {inLibrary && isPlanToRead ? (
              <>
                <button
                  type="button"
                  onClick={handleStartReading}
                  disabled={adding}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white shadow-violet-600/40 border border-white/15"
                  title="Move from Plan to Read to Reading status"
                >
                  {adding ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <BookOpen className="h-3.5 w-3.5 text-white" />
                  )}
                  <span>Start Reading</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push("/dashboard?nav=planned");
                  }}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all cursor-pointer bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-400/40"
                  title="View in Planned Library"
                >
                  <Bookmark className="h-3.5 w-3.5 fill-white text-white" />
                  <span className="hidden sm:inline">Planned</span>
                </button>
              </>
            ) : inLibrary ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push("/dashboard");
                }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all cursor-pointer bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/30"
                title="View manga in your library"
              >
                <BookOpen className="h-3.5 w-3.5 text-white" />
                <span>View in Library</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => handleQuickAdd(e, "reading")}
                  disabled={adding}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all cursor-pointer bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 text-white shadow-violet-600/40 border border-white/15"
                  title="Add to Reading"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 text-white" />
                      <span>+ Reading</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleQuickAdd(e, "plan_to_read")}
                  disabled={adding}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all cursor-pointer bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-400/40"
                  title="Save to Plan to Read"
                >
                  <Bookmark className="h-3.5 w-3.5 fill-white text-white" />
                  <span className="hidden sm:inline">Plan</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="min-w-0">
            <h3 className={cn(
              "truncate font-display text-sm font-semibold leading-tight transition-colors group-hover:text-violet-200",
              inLibrary ? "text-white/80" : "text-foreground"
            )}>
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
                  inLibrary ? "from-emerald-500 to-teal-400" : accent.bar,
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
            inLibrary ? "from-emerald-500/20 to-teal-500/20" : cn(accent.from, accent.to),
          )}
          style={{ mixBlendMode: "soft-light" }}
        />
      </motion.article>
    </Link>
  );
}
