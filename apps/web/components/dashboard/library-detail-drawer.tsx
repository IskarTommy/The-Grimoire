"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  BookOpen,
  Star,
  ExternalLink,
  Plus,
  Minus,
  Check,
  Search,
  ArrowUpDown,
  Tv,
  Layers,
  Loader2,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { MediaItem, MangaDexChapter } from "@/lib/types";
import { useMangaDetail } from "@/hooks/use-anilist";
import { useMangaChapters } from "@/hooks/use-mangadex";
import { useLibrary } from "@/hooks/use-library";

const READING_STATUSES = [
  { key: "reading", label: "Reading", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
  { key: "plan_to_read", label: "Plan to Read", color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
  { key: "completed", label: "Completed", color: "text-violet-400 bg-violet-500/15 border-violet-500/30" },
  { key: "on_hold", label: "On Hold", color: "text-slate-300 bg-slate-500/15 border-slate-500/30" },
  { key: "dropped", label: "Dropped", color: "text-rose-400 bg-rose-500/15 border-rose-500/30" },
];

function cleanSynopsis(synopsis?: string) {
  if (!synopsis) return "";
  return synopsis
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>?/gm, "")
    .trim();
}

type LibraryDetailDrawerProps = {
  item: MediaItem | null;
  open: boolean;
  onClose: () => void;
};

export function LibraryDetailDrawer({ item, open, onClose }: LibraryDetailDrawerProps) {
  const router = useRouter();
  const { getLibraryEntry, updateChapter, updateStatus, updateRating, removeFromLibrary } = useLibrary();

  const [chapterSearch, setChapterSearch] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Fetch full detailed metadata
  const { manga: detail } = useMangaDetail(item?.id || "");
  const activeItem = detail || item;

  // Fetch MangaDex chapters
  const {
    chapters,
    loading: loadingChapters,
    total: totalChaptersCount,
    order: chapterOrder,
    toggleOrder,
  } = useMangaChapters(activeItem?.title, activeItem?.id);

  const entry = item ? getLibraryEntry(item.id) : null;
  const currentChapter = entry?.currentChapter ?? item?.currentChapter ?? 0;
  const currentRating = entry?.rating ?? item?.rating ?? 0;
  const rawStatus = (entry?.status || "reading").toLowerCase();
  const currentStatusObj = READING_STATUSES.find((s) => s.key === rawStatus) ?? READING_STATUSES[0]!;

  // Earliest readable chapter (e.g. Chapter 1)
  const earliestReadableChapter = useMemo(() => {
    const asc = [...chapters].sort(
      (a, b) => (parseFloat(a.chapter) || 0) - (parseFloat(b.chapter) || 0)
    );
    return asc.find((c) => c.readable);
  }, [chapters]);

  // Next unread chapter based on user's current progress
  const nextProgressChapter = useMemo(() => {
    if (!currentChapter) return null;
    const asc = [...chapters].sort(
      (a, b) => (parseFloat(a.chapter) || 0) - (parseFloat(b.chapter) || 0)
    );
    return asc.find((c) => (parseFloat(c.chapter) || 0) > currentChapter && c.readable);
  }, [chapters, currentChapter]);

  // Filtered chapters for in-drawer chapter list
  const filteredChapters = useMemo(() => {
    if (!chapterSearch.trim()) return chapters;
    const q = chapterSearch.trim().toLowerCase();
    return chapters.filter(
      (c) =>
        c.chapter.toLowerCase().includes(q) ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.scanlationGroup && c.scanlationGroup.toLowerCase().includes(q))
    );
  }, [chapters, chapterSearch]);

  if (!item) return null;

  const targetLaunchChapter = nextProgressChapter || earliestReadableChapter;

  const handleLaunchReader = (chapterId?: string) => {
    const targetId = chapterId || targetLaunchChapter?.id;
    if (targetId) {
      onClose();
      router.push(`/read/${item.id}/${targetId}`);
    }
  };

  const handleRatingClick = async (val: number) => {
    const nextVal = currentRating === val ? 0 : val;
    await updateRating(item.id, nextVal);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl bg-[#0b1622] text-[#9fadbd] border-l border-white/10 p-0 overflow-y-auto scrollbar-thin shadow-2xl z-50 focus:outline-none"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{item.title} Details</SheetTitle>
        </SheetHeader>

        {/* 1. HERO BANNER HEADER */}
        <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-[#070e17]">
          <img
            src={activeItem?.bannerImage || activeItem?.cover || item.cover}
            alt={item.title}
            className={cn(
              "w-full h-full object-cover",
              activeItem?.bannerImage ? "opacity-40" : "blur-lg scale-110 opacity-25"
            )}
          />

          {/* Vignette fade to solid background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1622] via-[#0b1622]/80 via-40% to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0b1622] from-30% via-[#0b1622]/95 to-transparent" />

          {/* Close button */}
          <SheetClose className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer z-20">
            <X className="h-4 w-4" />
          </SheetClose>

          {/* Artwork & Header Metadata Info */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4 z-10">
            <div className="w-20 sm:w-24 aspect-[3/4.2] rounded-xl overflow-hidden shadow-2xl border border-white/15 bg-[#152232] shrink-0">
              <img
                src={item.cover}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className="rounded-md border border-violet-500/30 bg-violet-600/15 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                  {item.origin === "KR" ? "🇰🇷 Manhwa" : item.origin === "CN" ? "🇨🇳 Manhua" : "🇯🇵 Manga"}
                </span>
                <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold", currentStatusObj.color)}>
                  {currentStatusObj.label}
                </span>
                {item.hasAnime && (
                  <span className="flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                    <Tv className="h-2.5 w-2.5" />
                    Anime
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white truncate font-display leading-tight">
                {item.title}
              </h2>
              {detail?.nativeTitle && (
                <p className="text-[11px] text-white/40 font-mono truncate">{detail.nativeTitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* 2. INTERACTIVE CONTROLS BAR */}
        <div className="p-4 sm:p-6 flex flex-col gap-6">
          {/* Main Direct Reading Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {targetLaunchChapter ? (
              <Button
                onClick={() => handleLaunchReader()}
                className="flex-1 font-bold h-12 rounded-2xl transition-all gap-2 cursor-pointer shadow-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 text-white shadow-violet-600/25"
              >
                <Play className="h-4 w-4 fill-white" />
                <span className="text-sm">
                  {nextProgressChapter
                    ? `Continue Reading (Ch. ${nextProgressChapter.chapter})`
                    : `Start Reading (Ch. ${earliestReadableChapter?.chapter})`}
                </span>
              </Button>
            ) : loadingChapters ? (
              <Button
                disabled
                className="flex-1 font-bold h-12 rounded-2xl bg-white/5 text-white/40 border border-white/10 gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                <span>Checking MangaDex Chapters...</span>
              </Button>
            ) : (
              <Button
                disabled
                variant="outline"
                className="flex-1 font-bold h-12 rounded-2xl border-white/10 text-white/40"
              >
                <span>No Readable Chapters on MangaDex</span>
              </Button>
            )}

            {/* Reading Status Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 px-4 rounded-2xl font-bold border transition-all cursor-pointer gap-2 shrink-0",
                    currentStatusObj.color
                  )}
                  title="Change status"
                >
                  <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                  <span>{currentStatusObj.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-white/10 bg-[#161826] text-white min-w-[150px] shadow-2xl">
                <DropdownMenuLabel className="text-[10px] text-white/50 uppercase tracking-wider">
                  Update Status
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {READING_STATUSES.map((st) => (
                  <DropdownMenuItem
                    key={st.key}
                    onClick={() => updateStatus(item.id, st.key)}
                    className="flex items-center justify-between text-xs cursor-pointer focus:bg-violet-600/20"
                  >
                    <span className={cn(st.key === rawStatus ? "font-bold text-violet-300" : "text-white/80")}>
                      {st.label}
                    </span>
                    {st.key === rawStatus && <Check className="h-3.5 w-3.5 text-violet-400" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stepper & 10-Star Rating Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            {/* Chapter Stepper */}
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-xs font-semibold text-white/60">Chapter</span>
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => updateChapter(item.id, Math.max(0, currentChapter - 1))}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Previous Chapter"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="px-2.5 text-xs font-bold text-white font-mono min-w-[2.5rem] text-center">
                  {currentChapter}
                </span>
                <button
                  type="button"
                  onClick={() => updateChapter(item.id, currentChapter + 1)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Next Chapter"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Score Rating */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              <span className="text-xs font-semibold text-white/60">Score</span>
              <div className="flex items-center gap-0.5">
                {[2, 4, 6, 8, 10].map((val) => {
                  const active = (hoverRating !== null ? hoverRating : currentRating) >= val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onMouseEnter={() => setHoverRating(val)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => handleRatingClick(val)}
                      className="p-1 text-white/20 hover:scale-125 transition-transform cursor-pointer"
                      title={`Score ${val}/10`}
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          active ? "text-amber-400 fill-amber-400" : "text-white/20"
                        )}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-bold text-white/80 ml-1 font-mono">
                  {currentRating > 0 ? `${currentRating}/10` : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Synopsis */}
          {activeItem?.synopsis && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">
                Synopsis
              </h3>
              <p className="text-xs leading-relaxed text-[#9fadbd] whitespace-pre-line bg-white/[0.02] border border-white/5 rounded-2xl p-4 max-h-36 overflow-y-auto scrollbar-thin">
                {cleanSynopsis(activeItem.synopsis)}
              </p>
            </div>
          )}

          {/* 3. CHAPTERS LIST & SEARCH */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Chapters ({totalChaptersCount || chapters.length})
              </h3>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={chapterSearch}
                    onChange={(e) => setChapterSearch(e.target.value)}
                    className="h-7 w-28 sm:w-36 pl-7 pr-2 text-[11px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleOrder}
                  className="h-7 px-2 text-[10px] rounded-lg border-white/10 text-white/70 hover:bg-white/5 cursor-pointer gap-1"
                  title={`Order: ${chapterOrder === "desc" ? "Newest First" : "Oldest First"}`}
                >
                  <ArrowUpDown className="h-3 w-3" />
                  <span>{chapterOrder === "desc" ? "Newest" : "Oldest"}</span>
                </Button>
              </div>
            </div>

            {loadingChapters ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2 border border-white/5 rounded-2xl bg-white/[0.02]">
                <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                <p className="text-[11px] text-white/50">Fetching chapters from MangaDex...</p>
              </div>
            ) : filteredChapters.length === 0 ? (
              <div className="p-6 text-center text-white/40 text-xs border border-white/5 rounded-2xl bg-white/[0.02]">
                {chapterSearch ? `No chapters matching "${chapterSearch}"` : "No chapters available on MangaDex."}
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                {filteredChapters.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-violet-500/30 transition-all group"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                          Chapter {ch.chapter}
                        </span>
                        {ch.scanlationGroup && (
                          <span className="text-[10px] text-white/40 truncate max-w-[120px]">
                            • {ch.scanlationGroup}
                          </span>
                        )}
                      </div>
                      {ch.title && (
                        <p className="text-[11px] text-white/50 truncate mt-0.5">{ch.title}</p>
                      )}
                      <span className="text-[10px] text-white/40 block mt-0.5">
                        {ch.pages > 0 ? `${ch.pages} pages` : "Official"}
                      </span>
                    </div>

                    {ch.readable ? (
                      <Button
                        size="sm"
                        onClick={() => handleLaunchReader(ch.id)}
                        className="h-7 px-3 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white shrink-0 cursor-pointer shadow-sm shadow-violet-600/20"
                      >
                        Read
                      </Button>
                    ) : ch.externalUrl ? (
                      <a
                        href={ch.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[10px] font-semibold rounded-lg border-white/10 hover:bg-white/10 text-white/70"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" /> External
                        </Button>
                      </a>
                    ) : (
                      <span className="text-[10px] text-white/30 pr-2">Unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. FOOTER: ARCHIVE LINK & REMOVE OPTION */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
            <Link
              href={`/manga/${item.id}`}
              onClick={onClose}
              className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View Full Archival Entry & Franchise</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                removeFromLibrary(item.id);
                onClose();
              }}
              className="text-rose-400/80 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
