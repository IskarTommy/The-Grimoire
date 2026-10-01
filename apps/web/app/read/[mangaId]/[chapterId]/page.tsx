"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings,
  Layers,
  FileText,
  Columns,
  BookOpen,
  Loader2,
  CheckCircle2,
  Sparkles,
  Zap,
  RotateCcw,
  Compass,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ReaderMode, FitMode, MangaDexChapter } from "@/lib/types";
import { useMangaDetail } from "@/hooks/use-anilist";
import { useMangaChapters, useChapterPages } from "@/hooks/use-mangadex";
import { useLibrary } from "@/hooks/use-library";

export default function ReaderPage() {
  const router = useRouter();
  const params = useParams();
  const mangaId = params.mangaId as string;
  const chapterId = params.chapterId as string;

  // Manga & Chapter Data
  const { manga } = useMangaDetail(mangaId);
  const { chapters, loading: loadingChapters } = useMangaChapters(manga?.title, mangaId);
  const { data: pageData, loading: loadingPages, error: pageError, proxyUrl } = useChapterPages(chapterId);
  const { updateProgress, isInLibrary } = useLibrary();

  // Reader Settings State
  const [mode, setMode] = useState<ReaderMode>("webtoon");
  const [fitMode, setFitMode] = useState<FitMode>("width");
  const [useDataSaver, setUseDataSaver] = useState(false);
  const [readingDirection, setReadingDirection] = useState<"rtl" | "ltr">("rtl");
  const [stripWidth, setStripWidth] = useState<"narrow" | "normal" | "wide">("normal");

  // Navigation & Progress State
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasSyncedProgress, setHasSyncedProgress] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Sorted chapters ascending (Ch 1 -> Ch 2 -> Ch 3)
  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => {
      const numA = parseFloat(a.chapter) || 0;
      const numB = parseFloat(b.chapter) || 0;
      return numA - numB;
    });
  }, [chapters]);

  // Current chapter index
  const currentChapterIndex = useMemo(() => {
    return sortedChapters.findIndex((c) => c.id === chapterId);
  }, [sortedChapters, chapterId]);

  const currentChapter = sortedChapters[currentChapterIndex] || null;
  const prevChapter = currentChapterIndex > 0 ? sortedChapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < sortedChapters.length - 1
      ? sortedChapters[currentChapterIndex + 1]
      : null;

  // Active pages based on quality setting
  const pages = useMemo(() => {
    if (!pageData) return [];
    const rawList = useDataSaver ? pageData.dataSaverPages : pageData.pages;
    return rawList.map((url) => proxyUrl(url));
  }, [pageData, useDataSaver, proxyUrl]);

  const totalPages = pages.length;

  // Sync Progress to Library on completion
  const syncChapterProgress = useCallback(() => {
    if (!currentChapter || hasSyncedProgress) return;
    const chNum = parseFloat(currentChapter.chapter);
    if (!isNaN(chNum) && chNum > 0) {
      updateProgress(mangaId, chNum);
      setHasSyncedProgress(true);
    }
  }, [currentChapter, hasSyncedProgress, mangaId, updateProgress]);

  // Track scroll in webtoon mode for auto-updating current page & auto-hiding HUD
  useEffect(() => {
    if (mode !== "webtoon") return;

    const handleScroll = () => {
      const currentY = window.scrollY;

      // Auto-hide header when scrolling down, show when scrolling up
      if (currentY > lastScrollY.current + 80 && currentY > 200) {
        setShowControls(false);
      } else if (currentY < lastScrollY.current - 40) {
        setShowControls(true);
      }
      lastScrollY.current = currentY;

      // Calculate approximate page in view
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0 && totalPages > 0) {
        const scrollFraction = Math.max(0, Math.min(1, currentY / docHeight));
        const estimatedPage = Math.min(totalPages, Math.max(1, Math.round(scrollFraction * totalPages) || 1));
        setCurrentPage(estimatedPage);

        // Mark completed if scrolled past 90%
        if (scrollFraction >= 0.92) {
          syncChapterProgress();
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mode, totalPages, syncChapterProgress]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "h" || e.key === "H") {
        setShowControls((prev) => !prev);
      } else if (e.key === "ArrowRight") {
        if (mode === "single" || mode === "double") {
          if (readingDirection === "rtl") {
            goToPrevPage();
          } else {
            goToNextPage();
          }
        }
      } else if (e.key === "ArrowLeft") {
        if (mode === "single" || mode === "double") {
          if (readingDirection === "rtl") {
            goToNextPage();
          } else {
            goToPrevPage();
          }
        }
      } else if (e.key === "]") {
        if (nextChapter && nextChapter.readable) {
          router.push(`/read/${mangaId}/${nextChapter.id}`);
        }
      } else if (e.key === "[") {
        if (prevChapter && prevChapter.readable) {
          router.push(`/read/${mangaId}/${prevChapter.id}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, readingDirection, nextChapter, prevChapter, mangaId, router]);

  // Page flipping handlers for single/double mode
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const step = mode === "double" ? 2 : 1;
      const nextP = Math.min(totalPages, currentPage + step);
      setCurrentPage(nextP);
      if (nextP >= totalPages) syncChapterProgress();
    } else if (nextChapter && nextChapter.readable) {
      router.push(`/read/${mangaId}/${nextChapter.id}`);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const step = mode === "double" ? 2 : 1;
      setCurrentPage((prev) => Math.max(1, prev - step));
    } else if (prevChapter && prevChapter.readable) {
      router.push(`/read/${mangaId}/${prevChapter.id}`);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Strip width class for webtoon mode
  const stripWidthClass = {
    narrow: "max-w-xl",
    normal: "max-w-3xl",
    wide: "max-w-5xl",
  }[stripWidth];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#080d14] text-white selection:bg-violet-600/30 font-sans relative"
    >
      {/* 1. TOP FLOATING HUD / HEADER */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 backdrop-blur-xl bg-[#0b1622]/90 border-b border-white/10 px-4 py-2.5 sm:px-6 shadow-2xl",
          showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/manga/${mangaId}`}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all border border-white/10 shrink-0 cursor-pointer"
              title="Return to Manga Overview"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-white truncate font-display">
                {manga?.title || "Manga Reader"}
              </h1>
              <p className="text-[11px] text-white/50 truncate flex items-center gap-1.5 font-mono">
                <span>
                  Chapter {currentChapter?.chapter || "..."}
                  {currentChapter?.title ? ` • ${currentChapter.title}` : ""}
                </span>
                {currentChapter?.scanlationGroup && (
                  <span className="hidden md:inline-block px-1.5 py-0.2 rounded bg-white/5 text-[10px] text-violet-300">
                    {currentChapter.scanlationGroup}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Center: Chapter Quick Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 shadow-inner">
            <Button
              variant="ghost"
              size="icon"
              disabled={!prevChapter || !prevChapter.readable}
              onClick={() => prevChapter && router.push(`/read/${mangaId}/${prevChapter.id}`)}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer disabled:opacity-30"
              title="Previous Chapter"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-3 py-1 text-xs font-bold text-white hover:bg-white/10 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer max-w-[170px] truncate">
                  <span className="truncate">Ch. {currentChapter?.chapter || "Select"}</span>
                  <Menu className="h-3 w-3 shrink-0 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-64 max-h-80 overflow-y-auto bg-[#101b2a] border-white/10 text-white shadow-2xl p-1.5 scrollbar-thin"
              >
                <DropdownMenuLabel className="text-[11px] text-white/50 uppercase tracking-wider px-2 py-1">
                  Chapters ({sortedChapters.length})
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10 my-1" />
                {sortedChapters.map((ch) => (
                  <DropdownMenuItem
                    key={ch.id}
                    disabled={!ch.readable}
                    onClick={() => router.push(`/read/${mangaId}/${ch.id}`)}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-2 text-xs rounded-lg cursor-pointer transition-all",
                      ch.id === chapterId
                        ? "bg-violet-600 text-white font-bold"
                        : ch.readable
                        ? "text-white/80 hover:bg-white/10 hover:text-white"
                        : "text-white/30 cursor-not-allowed"
                    )}
                  >
                    <span className="truncate">
                      Ch. {ch.chapter} {ch.title ? `• ${ch.title}` : ""}
                    </span>
                    {!ch.readable && <span className="text-[10px] text-amber-400">External</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              disabled={!nextChapter || !nextChapter.readable}
              onClick={() => nextChapter && router.push(`/read/${mangaId}/${nextChapter.id}`)}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer disabled:opacity-30"
              title="Next Chapter"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Mode & Reader Settings */}
          <div className="flex items-center gap-1.5">
            {/* Mode Switcher Toggle */}
            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => setMode("webtoon")}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                  mode === "webtoon"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-white/50 hover:text-white"
                )}
                title="Continuous Vertical (Webtoon Mode)"
              >
                <Layers className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setMode("single")}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                  mode === "single"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-white/50 hover:text-white"
                )}
                title="Single Page Flip"
              >
                <FileText className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setMode("double")}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                  mode === "double"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-white/50 hover:text-white"
                )}
                title="Double Page Spread"
              >
                <Columns className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Reader Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
                  title="Reader Preferences"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-[#101b2a] border-white/10 text-white shadow-2xl p-2"
              >
                <DropdownMenuLabel className="text-[11px] text-white/50 uppercase tracking-wider">
                  Reading Mode
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={mode} onValueChange={(v) => setMode(v as ReaderMode)}>
                  <DropdownMenuRadioItem value="webtoon" className="text-xs cursor-pointer">
                    Vertical Webtoon
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="single" className="text-xs cursor-pointer">
                    Single Page
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="double" className="text-xs cursor-pointer">
                    Double Page Spread
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator className="bg-white/10 my-1.5" />

                {mode === "webtoon" ? (
                  <>
                    <DropdownMenuLabel className="text-[11px] text-white/50 uppercase tracking-wider">
                      Strip Width
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={stripWidth}
                      onValueChange={(v) => setStripWidth(v as any)}
                    >
                      <DropdownMenuRadioItem value="narrow" className="text-xs cursor-pointer">
                        Compact (Max 600px)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="normal" className="text-xs cursor-pointer">
                        Standard (Max 768px)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="wide" className="text-xs cursor-pointer">
                        Widescreen (Max 1024px)
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel className="text-[11px] text-white/50 uppercase tracking-wider">
                      Direction
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={readingDirection}
                      onValueChange={(v) => setReadingDirection(v as any)}
                    >
                      <DropdownMenuRadioItem value="rtl" className="text-xs cursor-pointer">
                        Right-to-Left (Manga)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="ltr" className="text-xs cursor-pointer">
                        Left-to-Right (Western)
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </>
                )}

                <DropdownMenuSeparator className="bg-white/10 my-1.5" />

                <div className="flex items-center justify-between px-2 py-1 text-xs">
                  <span className="text-white/80">Data Saver</span>
                  <input
                    type="checkbox"
                    checked={useDataSaver}
                    onChange={(e) => setUseDataSaver(e.target.checked)}
                    className="rounded border-white/20 accent-violet-600 cursor-pointer"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* 2. MAIN READING CANVAS */}
      <main className="pt-16 pb-24 min-h-screen flex flex-col items-center justify-center">
        {loadingPages ? (
          <div className="flex flex-col items-center justify-center gap-3 py-40">
            <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
            <p className="text-sm font-semibold text-white/50 animate-pulse">
              Summoning chapter pages from MangaDex...
            </p>
          </div>
        ) : pageError || pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32 px-4 text-center max-w-md mx-auto">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <BookOpen className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-white font-display">Chapter Unavailable in Reader</h2>
            <p className="text-xs text-white/50 leading-relaxed">
              {pageError ||
                "This chapter is hosted externally on official partner platforms (e.g. MangaPlus) or has no direct image data available."}
            </p>
            {currentChapter?.externalUrl ? (
              <a
                href={currentChapter.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2"
              >
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white rounded-xl gap-2 font-bold px-6">
                  <span>Open on Official Source</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </a>
            ) : (
              <Link href={`/manga/${mangaId}`}>
                <Button variant="outline" className="border-white/10 text-white rounded-xl mt-2">
                  Return to Manga Overview
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* MODE A: WEBTOON / CONTINUOUS VERTICAL */}
            {mode === "webtoon" && (
              <div className={cn("w-full mx-auto flex flex-col items-center px-2 sm:px-4", stripWidthClass)}>
                {pages.map((url, idx) => (
                  <div
                    key={idx}
                    className="w-full relative bg-[#060a0f] flex justify-center shadow-lg"
                    style={{ minHeight: "280px" }}
                  >
                    <img
                      src={url}
                      alt={`Page ${idx + 1}`}
                      loading={idx < 3 ? "eager" : "lazy"}
                      className="w-full h-auto object-contain select-none"
                    />
                  </div>
                ))}

                {/* End of Chapter Card */}
                <div className="w-full mt-12 mb-6 p-8 rounded-3xl bg-[#0f1926]/90 border border-white/10 backdrop-blur-md text-center flex flex-col items-center gap-4 shadow-2xl">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">
                      Chapter {currentChapter?.chapter} Completed!
                    </h3>
                    <p className="text-xs text-white/50 mt-1">
                      Reading progress saved to your Grimoire library.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    {nextChapter && nextChapter.readable ? (
                      <Button
                        onClick={() => router.push(`/read/${mangaId}/${nextChapter.id}`)}
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 text-white font-bold rounded-xl px-6 h-11 shadow-lg shadow-violet-600/30 gap-2 cursor-pointer"
                      >
                        <span>Next: Ch. {nextChapter.chapter}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Link href={`/manga/${mangaId}`}>
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl px-6 h-11">
                          Back to Manga Overview
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MODE B: SINGLE PAGE FLIP */}
            {mode === "single" && (
              <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center px-4">
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    if (clickX < rect.width / 2) {
                      readingDirection === "rtl" ? goToNextPage() : goToPrevPage();
                    } else {
                      readingDirection === "rtl" ? goToPrevPage() : goToNextPage();
                    }
                  }}
                  className="relative max-h-[82vh] flex items-center justify-center cursor-pointer select-none rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-[#060a0f]"
                >
                  <img
                    src={pages[currentPage - 1]}
                    alt={`Page ${currentPage}`}
                    className="max-h-[82vh] w-auto object-contain"
                  />
                </div>

                {/* Page Navigation Indicator */}
                <div className="mt-4 flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={goToPrevPage}
                    className="border-white/10 text-white/80 hover:text-white rounded-xl cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>

                  <span className="text-xs font-mono font-semibold text-white/70">
                    {currentPage} / {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages && !nextChapter}
                    onClick={goToNextPage}
                    className="border-white/10 text-white/80 hover:text-white rounded-xl cursor-pointer"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* MODE C: DOUBLE PAGE SPREAD */}
            {mode === "double" && (
              <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center px-4">
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    if (clickX < rect.width / 2) {
                      readingDirection === "rtl" ? goToNextPage() : goToPrevPage();
                    } else {
                      readingDirection === "rtl" ? goToPrevPage() : goToNextPage();
                    }
                  }}
                  className="flex items-center justify-center max-h-[82vh] cursor-pointer select-none gap-1 bg-[#060a0f] p-2 rounded-2xl border border-white/5 shadow-2xl"
                >
                  {/* Left Page (in RTL: later page; in LTR: earlier page) */}
                  {readingDirection === "rtl" ? (
                    <>
                      {currentPage < totalPages && (
                        <img
                          src={pages[currentPage]}
                          alt={`Page ${currentPage + 1}`}
                          className="max-h-[80vh] w-auto object-contain"
                        />
                      )}
                      <img
                        src={pages[currentPage - 1]}
                        alt={`Page ${currentPage}`}
                        className="max-h-[80vh] w-auto object-contain"
                      />
                    </>
                  ) : (
                    <>
                      <img
                        src={pages[currentPage - 1]}
                        alt={`Page ${currentPage}`}
                        className="max-h-[80vh] w-auto object-contain"
                      />
                      {currentPage < totalPages && (
                        <img
                          src={pages[currentPage]}
                          alt={`Page ${currentPage + 1}`}
                          className="max-h-[80vh] w-auto object-contain"
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Double Spread Navigation */}
                <div className="mt-4 flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={goToPrevPage}
                    className="border-white/10 text-white/80 hover:text-white rounded-xl cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev Spread
                  </Button>

                  <span className="text-xs font-mono font-semibold text-white/70">
                    Pages {currentPage}
                    {currentPage < totalPages ? `-${currentPage + 1}` : ""} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages && !nextChapter}
                    onClick={goToNextPage}
                    className="border-white/10 text-white/80 hover:text-white rounded-xl cursor-pointer"
                  >
                    Next Spread <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. BOTTOM STICKY PROGRESS BAR */}
      <footer
        className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300",
          showControls && totalPages > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="rounded-full bg-[#0e1724]/90 backdrop-blur-xl border border-white/10 px-4 py-2 shadow-2xl flex items-center gap-3 text-xs font-mono">
          <span className="text-white/70">
            Page <strong className="text-white">{currentPage}</strong> / {totalPages}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-violet-400 font-bold">
            {totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0}%
          </span>
        </div>
      </footer>
    </div>
  );
}
