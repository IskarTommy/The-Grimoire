"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, BookOpen, Tv, Plus, Minus, Trash2, Check, ExternalLink, Play, Loader2 } from "lucide-react";
import Link from "next/link";
import type { MediaItem } from "@/lib/types";
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

type LibraryMangaRowProps = {
  item: MediaItem;
  index: number;
  onSelect?: (item: MediaItem) => void;
};

const READING_STATUSES = [
  { key: "reading", label: "Reading", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { key: "completed", label: "Completed", color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  { key: "plan_to_read", label: "Plan to Read", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { key: "on_hold", label: "On Hold", color: "text-slate-300 bg-slate-500/10 border-slate-500/30" },
  { key: "dropped", label: "Dropped", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
];

export function LibraryMangaRow({ item, index, onSelect }: LibraryMangaRowProps) {
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

  const total = item.totalChapters;
  const percent = total && total > 0 ? Math.min(100, Math.round((currentChapter / total) * 100)) : null;

  const currentStatusObj =
    READING_STATUSES.find((s) => s.key === rawStatus) ?? READING_STATUSES[0]!;

  const handleIncrement = async () => {
    const next = currentChapter + 1;
    setInputVal(String(next));
    if (rawStatus === "plan_to_read") {
      await updateProgress(item.id, { currentChapter: next, status: "reading" });
    } else {
      await updateChapter(item.id, next);
    }
  };

  const handleDecrement = async () => {
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

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-4 sm:py-3 rounded-xl border border-white/[0.06] bg-[#0d0f1b]/70 hover:bg-[#121526] hover:border-violet-500/20 transition-all duration-200">
      {/* Left: Thumbnail & Title & Meta */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <span className="text-xs font-bold text-white/30 tabular-nums w-5 text-right hidden sm:block">
          {index + 1}
        </span>

        {/* Thumbnail */}
        <button
          type="button"
          onClick={() => (onSelect ? onSelect(item) : router.push(`/manga/${item.id}`))}
          className="shrink-0 relative overflow-hidden rounded-lg aspect-[3/4] w-11 h-[58px] border border-white/10 bg-white/5 cursor-pointer text-left"
        >
          <img
            src={item.cover}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        </button>

        {/* Title and metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (onSelect ? onSelect(item) : router.push(`/manga/${item.id}`))}
              className="text-left truncate font-display text-sm font-bold text-white hover:text-violet-300 transition-colors cursor-pointer"
            >
              {item.title}
            </button>
            {item.hasAnime && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-sky-500/20 border border-sky-400/30 px-1 py-0.5 text-[9px] font-bold text-sky-300">
                <Tv className="h-2.5 w-2.5" />
                Anime
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/50">
            <span>{item.author || "Various"}</span>
            <span>•</span>
            <span className="text-white/40">{item.type}</span>
            {item.lastUpdated && (
              <>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline text-white/40">Updated {item.lastUpdated}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls: Status, Chapter Stepper, Rating, Remove */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
        {/* Direct Read CTA Button */}
        <button
          type="button"
          onClick={handleDirectRead}
          disabled={launchingReader}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 transition-all shadow-sm shadow-violet-600/30 cursor-pointer hover:scale-105 active:scale-95"
          title="Read directly"
        >
          {launchingReader ? (
            <Loader2 className="h-3 w-3 animate-spin text-white" />
          ) : (
            <Play className="h-3 w-3 fill-white" />
          )}
          <span>{currentChapter > 0 ? `Ch. ${currentChapter + 1}` : "Read"}</span>
        </button>
        {/* Quick Action: Start Reading if Plan to Read */}
        {rawStatus === "plan_to_read" && (
          <button
            type="button"
            onClick={() => updateStatus(item.id, "reading")}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-sm shadow-violet-600/30 cursor-pointer hover:scale-105 active:scale-95"
            title="Start reading: Move to Reading status"
          >
            <BookOpen className="h-3 w-3" />
            <span>Start Reading</span>
          </button>
        )}

        {/* Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95",
                currentStatusObj.color
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
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

        {/* Chapter Stepper */}
        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={currentChapter <= 0}
            className="flex h-5 w-5 items-center justify-center rounded border border-white/10 bg-white/5 text-white/80 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Decrement chapter"
          >
            <Minus className="h-2.5 w-2.5" />
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
              className="w-10 h-5 text-center text-xs font-bold bg-white/10 rounded border border-violet-500/50 text-white outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-1.5 h-5 text-xs font-bold text-white tabular-nums hover:text-violet-300 cursor-pointer"
              title="Click to edit chapter number"
            >
              Ch. {currentChapter}
            </button>
          )}

          <button
            type="button"
            onClick={handleIncrement}
            className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            title="Increment chapter (+1)"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Score Stars */}
        <div className="hidden md:flex items-center gap-1">
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
                    "h-3 w-3 transition-colors",
                    active
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]"
                      : "text-white/20 hover:text-amber-300"
                  )}
                />
              </button>
            );
          })}
          <span className="ml-1 text-[11px] font-bold tabular-nums text-amber-300/80 w-6">
            {currentRating > 0 ? `${currentRating}` : "—"}
          </span>
        </div>

        {/* Remove Button with Confirmation */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-300 transition-colors cursor-pointer"
              title="Remove from Library"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
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
  );
}
