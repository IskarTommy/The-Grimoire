"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Trophy,
  Crown,
  Star,
  Search,
  User,
  ChevronRight,
  Filter,
  ArrowLeft,
  LayoutGrid,
  List,
} from "lucide-react";
import { useTop100Manga, fetchGenresApi } from "@/hooks/use-anilist";
import { SearchModal } from "@/components/search/search-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/navigation/user-menu";
import { GrimoireLogo } from "@/components/ui/grimoire-logo";

function cleanSynopsis(synopsis?: string) {
  if (!synopsis) return "";
  return synopsis.replace(/<[^>]*>?/gm, "").trim();
}

const ORIGINS = [
  { label: "All Formats", value: "" },
  { label: "🇯🇵 Manga", value: "JP" },
  { label: "🇰🇷 Manhwa", value: "KR" },
  { label: "🇨🇳 Manhua", value: "CN" },
];

export default function Top100Page() {
  const [country, setCountry] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [genres, setGenres] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const { top100, loading } = useTop100Manga(country, selectedGenre, page);

  useEffect(() => {
    fetchGenresApi().then(setGenres);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const rankOffset = (page - 1) * 50;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Sticky Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-6 sm:px-12 lg:px-20 backdrop-blur-md border-b border-white/5 bg-background/80">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <Link href="/" className="flex items-center gap-2.5">
            <GrimoireLogo size={32} />
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Grimoire
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60 hover:border-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 text-violet-400" />
            <span>Search</span>
            <kbd className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/70">Ctrl K</kbd>
          </button>
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-violet-950/20 via-background to-background p-6 sm:p-10 mb-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-3 shadow-inner">
                <Trophy className="h-3.5 w-3.5" />
                Hall of Fame
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
                Top 100 Manga of All Time
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/60 max-w-2xl">
                The most critically acclaimed and highest-rated manga, manhwa, and manhua as rated by millions of readers worldwide.
              </p>
            </div>

            {/* Range Toggle: 1-50 vs 51-100 */}
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 self-start sm:self-center shrink-0">
              <button
                onClick={() => setPage(1)}
                className={cn(
                  "rounded-lg px-4 py-2 text-xs font-bold transition-all",
                  page === 1
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-white/60 hover:text-white"
                )}
              >
                Ranks #1 – #50
              </button>
              <button
                onClick={() => setPage(2)}
                className={cn(
                  "rounded-lg px-4 py-2 text-xs font-bold transition-all",
                  page === 2
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-white/60 hover:text-white"
                )}
              >
                Ranks #51 – #100
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Origin Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {ORIGINS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setCountry(o.value)}
                  className={cn(
                    "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 border",
                    country === o.value
                      ? "border-violet-500/50 bg-violet-600/20 text-violet-300 shadow-sm"
                      : "border-white/5 bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.05]"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Right Controls: Genre Dropdown + View Mode Switcher */}
            <div className="flex items-center gap-3">
              {/* Genre Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 flex items-center gap-1 shrink-0">
                  <Filter className="h-3.5 w-3.5" /> Genre:
                </span>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="" className="bg-[#12151f] text-white">All Genres</option>
                  {genres.map((g) => (
                    <option key={g} value={g} className="bg-[#12151f] text-white">
                      {g}
                    </option>
                  ))}
                </select>
                {selectedGenre && (
                  <button
                    onClick={() => setSelectedGenre("")}
                    className="text-xs text-violet-400 hover:text-violet-300 underline ml-1"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* View Switcher: Grid vs List */}
              <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === "grid"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-white/50 hover:text-white"
                  )}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === "list"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-white/50 hover:text-white"
                  )}
                  title="List View"
                  aria-label="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden aspect-[3/4.8] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-5 p-4 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
                  <div className="w-18 h-26 rounded-xl bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-5 bg-white/10 rounded w-1/3" />
                    <div className="h-3.5 bg-white/10 rounded w-1/4" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : top100.length > 0 ? (
          viewMode === "grid" ? (
            /* ===== GRID FORM (Default) ===== */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
              {top100.map((item, index) => {
                const rank = rankOffset + index + 1;
                const isGold = rank === 1;
                const isSilver = rank === 2;
                const isBronze = rank === 3;

                return (
                  <Link
                    key={item.id}
                    href={`/manga/${item.id}`}
                    className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#0d1017] overflow-hidden hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-900/20 transition-all duration-300 hover:-translate-y-1.5"
                  >
                    {/* Cover Container */}
                    <div className="relative aspect-[3/4.3] w-full overflow-hidden bg-black">
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-transparent to-transparent opacity-80" />

                      {/* Rank Badge (Top Left) */}
                      <div className="absolute top-0 left-0">
                        {isGold ? (
                          <div className="flex items-center gap-1 rounded-br-xl bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-1 text-xs font-black text-black shadow-lg shadow-amber-500/30">
                            <Crown className="h-3.5 w-3.5 fill-black" />
                            <span>#1</span>
                          </div>
                        ) : isSilver ? (
                          <div className="flex items-center gap-1 rounded-br-xl bg-gradient-to-r from-slate-200 to-slate-400 px-2.5 py-1 text-xs font-black text-black shadow-md">
                            <Trophy className="h-3 w-3" />
                            <span>#2</span>
                          </div>
                        ) : isBronze ? (
                          <div className="flex items-center gap-1 rounded-br-xl bg-gradient-to-r from-amber-600 to-amber-700 px-2.5 py-1 text-xs font-black text-white shadow-md">
                            <Trophy className="h-3 w-3" />
                            <span>#3</span>
                          </div>
                        ) : (
                          <div className="rounded-br-xl bg-black/85 backdrop-blur-md px-2.5 py-1 text-xs font-extrabold text-white/90 border-r border-b border-white/10">
                            #{rank}
                          </div>
                        )}
                      </div>

                      {/* Score Badge (Top Right) */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 px-2 py-0.5 text-xs font-bold text-amber-400 shadow">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span>{item.rating > 0 ? item.rating.toFixed(1) : "N/A"}</span>
                      </div>

                      {/* Bottom Indicators: Anime Pill + Country Flag */}
                      <div className="absolute bottom-2 inset-x-2 flex items-center justify-between">
                        {item.hasAnime ? (
                          <span className="rounded bg-fuchsia-600/90 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow">
                            Anime
                          </span>
                        ) : (
                          <span />
                        )}
                        <div className="rounded bg-black/85 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold shadow">
                          {item.origin === "KR" ? "🇰🇷" : item.origin === "CN" ? "🇨🇳" : "🇯🇵"}
                        </div>
                      </div>
                    </div>

                    {/* Content Below Cover */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                      <div>
                        <h3 className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-violet-300">
                          {item.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-white/50">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {item.status}
                          </span>
                          {item.totalChapters && <span>• {item.totalChapters} Chs</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {item.genres.slice(0, 2).map((g) => (
                          <span
                            key={g}
                            className="rounded border border-white/5 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* ===== LIST FORM ===== */
            <div className="space-y-3.5">
              {top100.map((item, index) => {
                const rank = rankOffset + index + 1;
                const isPodium = rank <= 3;
                const podiumBg =
                  rank === 1
                    ? "from-amber-400/20 via-amber-500/10 to-transparent border-amber-500/40 shadow-amber-500/10"
                    : rank === 2
                    ? "from-slate-300/20 via-slate-400/10 to-transparent border-slate-400/30"
                    : rank === 3
                    ? "from-amber-700/20 via-amber-800/10 to-transparent border-amber-700/30"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]";

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 rounded-2xl border p-4 transition-all duration-200 shadow-md",
                      isPodium
                        ? `bg-gradient-to-r ${podiumBg}`
                        : "border-white/5 bg-white/[0.02] hover:border-violet-500/30 hover:bg-white/[0.05] hover:shadow-xl"
                    )}
                  >
                    {/* Left: Rank Badge + Cover */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="grid place-items-center w-11 sm:w-12 text-center shrink-0">
                        {rank === 1 ? (
                          <div className="flex flex-col items-center">
                            <Crown className="h-5 w-5 text-amber-400 fill-amber-400 animate-bounce" />
                            <span className="font-extrabold text-lg text-amber-300">#1</span>
                          </div>
                        ) : rank === 2 ? (
                          <div className="flex flex-col items-center">
                            <Trophy className="h-4 w-4 text-slate-300" />
                            <span className="font-extrabold text-lg text-slate-300">#2</span>
                          </div>
                        ) : rank === 3 ? (
                          <div className="flex flex-col items-center">
                            <Trophy className="h-4 w-4 text-amber-600" />
                            <span className="font-extrabold text-lg text-amber-600">#3</span>
                          </div>
                        ) : (
                          <span className="font-extrabold text-lg sm:text-xl text-white/50">
                            #{rank}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/manga/${item.id}`}
                        className="relative h-24 w-17 sm:h-28 sm:w-20 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black shrink-0 group/cover"
                      >
                        <img
                          src={item.cover}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover/cover:scale-105"
                        />
                        <div className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.5 text-[9px] font-bold">
                          {item.origin === "KR" ? "🇰🇷" : item.origin === "CN" ? "🇨🇳" : "🇯🇵"}
                        </div>
                      </Link>
                    </div>

                    {/* Middle: Manga Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/manga/${item.id}`}
                          className="text-base sm:text-lg font-bold text-white hover:text-violet-300 transition-colors truncate max-w-xl"
                        >
                          {item.title}
                        </Link>
                        {item.hasAnime && (
                          <span className="rounded bg-fuchsia-500/20 border border-fuchsia-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-fuchsia-300 shrink-0">
                            Anime Adapt.
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-white/60">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          {item.rating > 0 ? `${item.rating.toFixed(1)} / 10` : "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {item.status}
                        </span>
                        {item.totalChapters && (
                          <span className="text-white/50">{item.totalChapters} Chapters</span>
                        )}
                        <span className="text-white/40">{item.type}</span>
                      </div>

                      <p className="mt-2 text-xs text-white/70 line-clamp-2 leading-relaxed max-w-3xl">
                        {cleanSynopsis(item.synopsis) || "No synopsis available."}
                      </p>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {item.genres.slice(0, 4).map((g) => (
                          <span
                            key={g}
                            className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/60"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Direct Read / View Action */}
                    <div className="shrink-0 pt-2 sm:pt-0 self-end sm:self-center">
                      <Link href={`/manga/${item.id}`}>
                        <Button
                          size="sm"
                          className="rounded-xl border border-violet-500/30 bg-violet-600/20 text-violet-200 hover:bg-violet-600 hover:text-white transition-all text-xs font-semibold px-4 cursor-pointer"
                        >
                          Read Details
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="text-center py-20 rounded-3xl border border-white/5 bg-white/[0.02]">
            <Trophy className="h-10 w-10 text-white/30 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Manga Found</h3>
            <p className="text-xs text-white/50 mt-1">Try clearing your filters to see the full Top 100 ranking.</p>
          </div>
        )}

        {/* Bottom Pagination Buttons */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => {
              setPage(1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10 cursor-pointer"
          >
            ← Previous 50
          </Button>
          <span className="text-xs font-mono text-white/50 px-2">Page {page} of 2</span>
          <Button
            variant="outline"
            disabled={page === 2}
            onClick={() => {
              setPage(2);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10 cursor-pointer"
          >
            Next 50 →
          </Button>
        </div>
      </main>

      {/* Global Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
