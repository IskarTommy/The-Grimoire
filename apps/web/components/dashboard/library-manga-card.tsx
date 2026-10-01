"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star,
  BookOpen,
  Tv,
  Plus,
  Minus,
  Trash2,
  Check,
  MoreVertical,
  ExternalLink,
  Sparkles,
  Play,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { MediaItem } from "@/lib/types";
import { STATUS_META, TYPE_META, ACCENT_CLASSES } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/hooks/use-library";
import { fetchDirectChapterToRead } from "@/hooks/use-mangadex";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type LibraryMangaCardProps = {
  item: MediaItem;
  index?: number;
  onSelect?: (item: MediaItem) => void;
};

const READING_STATUSES = [
  { key: "reading", label: "Reading", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { key: "completed", label: "Completed", color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  { key: "plan_to_read", label: "Plan to Read", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { key: "on_hold", label: "On Hold", color: "text-slate-300 bg-slate-500/10 border-slate-500/30" },
  { key: "dropped", label: "Dropped", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
];

export function LibraryMangaCard({ item, index = 0, onSelect }: LibraryMangaCardProps) {
  const router = useRouter();
  const { getLibraryEntry, updateProgress, updateChapter, updateStatus, updateRating, removeFromLibrary } = useLibrary();
  const entry = getLibraryEntry(item.id);

  const currentChapter = entry?.currentChapter ?? item.currentChapter ?? 0;
  const currentRating = entry?.rating ?? item.rating ?? 0;
  const rawStatus = (entry?.status || "reading").toLowerCase();

  const [inputVal, setInputVal] = useState<string>(String(currentChapter));
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [launchingReader, setLaunchingReader] = useState(false);

  const handleDirectRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setLaunchingReader(true);
      const chId = await fetchDirectChapterToRead(item.title, item.id, currentChapter);
      if (chId) {
        router.push(`/read/${item.id}/${chId}`);
      } else if (onSelect) {
        onSelect(item);
      } else {
        router.push(`/manga/${item.id}`);
      }
    } catch {
      if (onSelect) onSelect(item);
    } finally {
      setLaunchingReader(false);
    }
  };

  const statusMeta = STATUS_META[item.status] || STATUS_META.ONGOING;
  const typeMeta = TYPE_META[item.type] || TYPE_META.MANGA;
  const accent = ACCENT_CLASSES[item.accent] || ACCENT_CLASSES.violet;
  const total = item.totalChapters;

  const currentStatusObj =
    READING_STATUSES.find((s) => s.key === rawStatus) ?? READING_STATUSES[0]!;

  const handleIncrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = currentChapter + 1;
    setInputVal(String(next));
    if (rawStatus === "plan_to_read") {
      await updateProgress(item.id, { currentChapter: next, status: "reading" });
    } else {
      await updateChapter(item.id, next);
    }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = Math.max(0, currentChapter - 1);
    setInputVal(String(next));
    await updateChapter(item.id, next);
  };

  const handleInputSubmit = async () => {
    setIsEditing(false);
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      if (rawStatus === "plan_to_read" && parsed > 0) {
        await updateProgress(item.id, { currentChapter: parsed, status: "reading" });
      } else {
        await updateChapter(item.id, parsed);
      }
    } else {
      setInputVal(String(currentChapter));
    }
  };

  const handleRatingClick = async (r: number) => {
    const nextRating = currentRating === r ? 0 : r;
    await updateRating(item.id, nextRating);
  };

  const percent = total && total > 0 ? Math.min(100, Math.round((currentChapter / total) * 100)) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f111c] transition-all duration-300",
        "hover:border-white/20 hover:-translate-y-1 shadow-lg shadow-black/40",
        accent.glow
      )}
    >
      {/* Cover Image Header */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <button
          type="button"
          onClick={() => (onSelect ? onSelect(item) : router.push(`/manga/${item.id}`))}
          className="block h-full w-full text-left cursor-pointer"
        >
          <img
            src={item.cover}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </button>

        {/* Ambient Top & Bottom Vignettes */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/85 via-black/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0f111c] via-[#0f111c]/60 to-transparent" />

        {/* Direct 1-Click Read Button (Centered on hover) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            type="button"
            onClick={handleDirectRead}
            disabled={launchingReader}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow-xl shadow-black/80 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
            title="Read directly now"
          >
            {launchingReader ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Play className="h-4 w-4 fill-white" />
            )}
            <span>{currentChapter > 0 ? `Ch. ${currentChapter + 1}` : "Read"}</span>
          </button>
        </div>

        {/* Top Floating Controls */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5 z-10">
          {/* Status Dropdown Pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95",
                  currentStatusObj.color
                )}
                title="Change reading status"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                <span>{currentStatusObj.label}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-white/10 bg-[#161826]/95 backdrop-blur-xl min-w-[140px] text-xs">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Reading Status
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {READING_STATUSES.map((st) => (
                <DropdownMenuItem
                  key={st.key}
                  onClick={() => updateStatus(item.id, st.key)}
                  className="flex items-center justify-between gap-2 cursor-pointer focus:bg-violet-600/20"
                >
                  <span className={cn("font-medium", st.key === rawStatus ? "text-violet-300 font-bold" : "text-white/80")}>
                    {st.label}
                  </span>
                  {st.key === rawStatus && <Check className="h-3.5 w-3.5 text-violet-400" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Action Menu (Remove from Library) */}
          <div className="flex items-center gap-1">
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/80 backdrop-blur-md hover:bg-white/20 hover:text-white transition-all shadow-sm cursor-pointer"
                    title="Library options"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="border-white/10 bg-[#161826]/95 backdrop-blur-xl min-w-[150px] text-xs" align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/manga/${item.id}`} className="flex items-center gap-2 cursor-pointer">
                      <ExternalLink className="h-3.5 w-3.5 text-violet-400" />
                      <span>View Details</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="flex items-center gap-2 text-rose-400 focus:bg-rose-500/15 focus:text-rose-300 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove from Library</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialogContent className="border-white/10 bg-[#121422] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove from Library?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/60">
                    Are you sure you want to remove <strong className="text-white">{item.title}</strong> from your personal library? Your tracked chapter progress will be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => removeFromLibrary(item.id)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Bottom Anime Indicator Badge */}
        {item.hasAnime && (
          <div className="absolute left-2.5 bottom-2.5 z-10">
            <span className="flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-sky-200 backdrop-blur-md shadow-sm">
              <Tv className="h-3 w-3" />
              Anime
            </span>
          </div>
        )}
      </div>

      {/* Body & Interactive Tracker Controls */}
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        {/* Title */}
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => (onSelect ? onSelect(item) : router.push(`/manga/${item.id}`))}
            className="text-left w-full cursor-pointer"
          >
            <h3 className="truncate font-display text-sm font-bold text-white hover:text-violet-300 transition-colors leading-tight">
              {item.title}
            </h3>
          </button>
          <p className="mt-0.5 truncate text-[11px] text-white/50">
            {item.author || "Various Creators"}
          </p>
        </div>

        {/* Interactive 5-Star / 10-Point Rating */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Score
          </span>
          <div className="flex items-center gap-1">
            {[2, 4, 6, 8, 10].map((val) => {
              const active = (hoverRating !== null ? hoverRating : currentRating) >= val;
              return (
                <button
                  key={val}
                  type="button"
                  onMouseEnter={() => setHoverRating(val)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => handleRatingClick(val)}
                  className="p-0.5 text-white/20 hover:scale-125 transition-transform cursor-pointer"
                  title={`Rate ${val}/10`}
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      active
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                        : "text-white/20 hover:text-amber-300"
                    )}
                  />
                </button>
              );
            })}
            <span className="ml-1 text-[11px] font-bold tabular-nums text-amber-300/90">
              {currentRating > 0 ? `${currentRating}/10` : "—"}
            </span>
          </div>
        </div>

        {/* Quick Action: Start Reading if Plan to Read */}
        {rawStatus === "plan_to_read" && (
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await updateStatus(item.id, "reading");
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 border border-white/10"
            title="Start reading: Move to Reading status"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Start Reading</span>
          </button>
        )}

        {/* Interactive Chapter Stepper */}
        <div className="mt-auto space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-white/60 flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 text-violet-400" />
              Chapter
            </span>

            {/* Stepper buttons and numeric input */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={currentChapter <= 0}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                title="Previous chapter"
              >
                <Minus className="h-3 w-3" />
              </button>

              {isEditing ? (
                <input
                  type="number"
                  autoFocus
                  min={0}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onBlur={handleInputSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleInputSubmit()}
                  className="w-12 h-6 text-center text-xs font-bold bg-white/10 rounded-md border border-violet-500/50 text-white outline-none focus:ring-1 focus:ring-violet-400"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-2 h-6 rounded-md bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors tabular-nums cursor-pointer"
                  title="Click to edit chapter number"
                >
                  Ch. {currentChapter}
                </button>
              )}

              <button
                type="button"
                onClick={handleIncrement}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-violet-600/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                title="Next chapter (+1)"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Progress Bar & Completion Indicator */}
          <div className="space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  rawStatus === "completed"
                    ? "bg-gradient-to-r from-sky-400 to-emerald-400"
                    : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                )}
                style={{ width: `${percent !== null ? percent : Math.min(100, currentChapter * 2)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-white/40 font-medium">
              <span>{total ? `${total} chapters total` : "Ongoing tracker"}</span>
              <span className="tabular-nums text-white/70">
                {percent !== null ? `${percent}%` : `Ch. ${currentChapter}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
