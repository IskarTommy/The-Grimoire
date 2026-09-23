"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { Search, X, Loader2, BookOpen, ChevronRight, Sparkles, Filter } from "lucide-react";
import { searchMangaApi, fetchGenresApi, SearchParams } from "@/hooks/use-anilist";
import type { MediaItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems?: MediaItem[];
}

const ORIGIN_OPTIONS = [
  { label: "All Origins", value: "" },
  { label: "🇯🇵 Manga", value: "JP" },
  { label: "🇰🇷 Manhwa", value: "KR" },
  { label: "🇨🇳 Manhua", value: "CN" },
];

const SORT_OPTIONS = [
  { label: "Most Popular", value: "POPULARITY_DESC" },
  { label: "Top Rated", value: "SCORE_DESC" },
  { label: "Trending", value: "TRENDING_DESC" },
];

export function SearchModal({ isOpen, onClose, initialItems = [] }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedSort, setSelectedSort] = useState("POPULARITY_DESC");
  const [genres, setGenres] = useState<string[]>([]);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load genres once on mount
  useEffect(() => {
    fetchGenresApi().then((g) => {
      if (g.length > 0) setGenres(g);
      else {
        setGenres([
          "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
          "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Supernatural"
        ]);
      }
    });
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      // Prepopulate with initial items if results are empty and no query
      if (results.length === 0 && initialItems.length > 0 && !query) {
        setResults(initialItems.slice(0, 10));
      }
    }
  }, [isOpen, initialItems]);

  // Handle ESC key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search effect
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      const params: SearchParams = {
        q: query.trim() || undefined,
        genre: selectedGenre || undefined,
        country: selectedOrigin || undefined,
        sort: selectedSort,
        perPage: 25,
      };

      try {
        const data = await searchMangaApi(params);
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, selectedOrigin, selectedGenre, selectedSort, isOpen]);

  if (!isOpen) return null;

  const hasActiveFilters = Boolean(query || selectedOrigin || selectedGenre || selectedSort !== "POPULARITY_DESC");

  const resetFilters = () => {
    setQuery("");
    setSelectedOrigin("");
    setSelectedGenre("");
    setSelectedSort("POPULARITY_DESC");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 lg:p-12 backdrop-blur-md bg-black/75 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0c0e14] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-foreground">
        
        {/* Search Header */}
        <div className="relative flex items-center border-b border-white/10 px-4 py-3 sm:px-6">
          <Search className="h-5 w-5 text-violet-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manga, manhwa, manhua by title, genre, or keyword..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-white/40 focus:outline-none"
          />
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-violet-400 shrink-0 mr-2" />
          )}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 mr-2 transition-colors"
              title="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="hidden sm:inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-mono text-white/70 hover:bg-white/10 transition-colors"
          >
            <span>ESC</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col gap-2.5 border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-6">
          {/* Origin Tabs & Sort Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {ORIGIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedOrigin(opt.value)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-all shrink-0",
                    selectedOrigin === opt.value
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/40 hidden sm:inline">Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#12151f] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-violet-400 hover:text-violet-300 ml-1 underline transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Genre Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] text-white/40 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Genres:
            </span>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(selectedGenre === g ? "" : g)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] transition-all shrink-0 border",
                  selectedGenre === g
                    ? "border-amber-400/50 bg-amber-500/20 text-amber-300 font-semibold shadow-sm"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {loading && results.length === 0 ? (
            <div className="space-y-3 py-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse">
                  <div className="h-20 w-14 rounded-lg bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                    <div className="h-3 bg-white/10 rounded w-1/4" />
                    <div className="h-3 bg-white/10 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="flex items-center justify-between text-xs text-white/50 px-1 pb-1">
                <span>
                  {query ? `Results for "${query}"` : "Suggested Manga"} ({results.length} found)
                </span>
                <span className="text-[11px]">Click to view details & read</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {results.map((item) => (
                  <Link
                    key={item.id}
                    href={`/manga/${item.id}`}
                    onClick={onClose}
                    className="group flex items-center gap-3.5 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 transition-all duration-200 hover:border-violet-500/40 hover:bg-white/[0.06] hover:shadow-lg"
                  >
                    {/* Cover Thumbnail with Country Flag */}
                    <div className="relative h-20 w-14 sm:h-22 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[9px]">
                        {item.origin === "KR" ? "🇰🇷" : item.origin === "CN" ? "🇨🇳" : "🇯🇵"}
                      </div>
                    </div>

                    {/* Metadata & Title */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm sm:text-base font-semibold text-white transition-colors group-hover:text-violet-300">
                          {item.title}
                        </h4>
                        {item.hasAnime && (
                          <span className="shrink-0 rounded bg-fuchsia-500/20 border border-fuchsia-500/30 px-1.5 py-0.2 text-[10px] font-semibold text-fuchsia-300">
                            Anime
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-white/60">
                        <span className="font-semibold text-amber-400">
                          ★ {item.rating > 0 ? item.rating.toFixed(1) : "N/A"}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <BookOpen className="h-3 w-3" />
                          {item.status}
                        </span>
                        {item.totalChapters && (
                          <span className="text-[11px] text-white/50">
                            {item.totalChapters} Chs
                          </span>
                        )}
                      </div>

                      {/* Genre Tags */}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {item.genres.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/70"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Arrow */}
                    <div className="shrink-0 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-violet-300 pr-1">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 border border-white/10 mb-3">
                <Search className="h-6 w-6 text-white/40" />
              </div>
              <p className="text-sm font-medium text-white/80">No manga found</p>
              <p className="mt-1 text-xs text-white/50 max-w-sm">
                We couldn&apos;t find any manga matching your current search and filter combination.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-4 rounded-xl border border-violet-500/30 bg-violet-600/20 px-4 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-600/30 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.01] px-4 py-2.5 sm:px-6 text-[11px] text-white/40">
          <span>Search powered by Grimoire AniList Service</span>
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-white/10 px-1 py-0.5 rounded">↑</kbd> <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded">↓</kbd> to navigate</span>
            <span><kbd className="font-mono bg-white/10 px-1 py-0.5 rounded">ESC</kbd> to exit</span>
          </div>
        </div>

      </div>
    </div>
  );
}
