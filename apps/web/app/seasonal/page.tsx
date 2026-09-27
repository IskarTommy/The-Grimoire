"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Tv,
  Calendar,
  Sparkles,
  Star,
  Search,
  User,
  ChevronRight,
  Filter,
  ArrowLeft,
  LayoutGrid,
  List,
  Bookmark,
  Plus,
  Loader2,
} from "lucide-react";
import { useSeasonalManga, useUpcomingSeasonalManga, fetchGenresApi } from "@/hooks/use-anilist";
import { useLibrary } from "@/hooks/use-library";
import { useAuth } from "@/contexts/auth-context";
import { SearchModal } from "@/components/search/search-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/navigation/user-menu";
import { GrimoireBrand } from "@/components/ui/grimoire-brand";

function cleanSynopsis(synopsis?: string) {
  if (!synopsis) return "";
  return synopsis.replace(/<[^>]*>?/gm, "").trim();
}

const ORIGINS = [
  { label: "All Origins", value: "" },
  { label: "🇯🇵 Manga", value: "JP" },
  { label: "🇰🇷 Manhwa", value: "KR" },
  { label: "🇨🇳 Manhua", value: "CN" },
];

export default function SeasonalPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isInLibrary, getLibraryEntry, addToLibrary, updateStatus } = useLibrary();
  const [addingId, setAddingId] = useState<string | number | null>(null);

  const [activeTab, setActiveTab] = useState<"current" | "upcoming">("current");
  const [country, setCountry] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [genres, setGenres] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleQuickAdd = async (
    e: React.MouseEvent,
    item: any,
    targetStatus: string = "reading"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?redirect=/seasonal`);
      return;
    }

    if (isInLibrary(item.id)) {
      const entry = getLibraryEntry(item.id);
      const isPlan = (entry?.status || "").toLowerCase() === "plan_to_read";
      router.push(isPlan ? "/dashboard?nav=planned" : "/dashboard");
      return;
    }

    try {
      setAddingId(item.id);
      await addToLibrary({
        mangaId: String(item.id),
        title: item.title,
        coverUrl: item.cover,
        status: targetStatus,
      });
    } catch (err) {
      console.error("Failed to add to library:", err);
    } finally {
      setAddingId(null);
    }
  };

  const handleStartReading = async (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAddingId(item.id);
      await updateStatus(item.id, "reading");
    } catch (err) {
      console.error("Failed to start reading:", err);
    } finally {
      setAddingId(null);
    }
  };

  const { seasonal: currentSeasonal, loading: currentLoading } = useSeasonalManga();
  const { upcoming: upcomingSeasonal, loading: upcomingLoading } = useUpcomingSeasonalManga();

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

  const rawList = activeTab === "current" ? currentSeasonal : upcomingSeasonal;
  const loading = activeTab === "current" ? currentLoading : upcomingLoading;

  // Filter list by country and genre
  const filteredList = rawList.filter((item) => {
    if (country && item.origin !== country) return false;
    if (selectedGenre && !item.genres.includes(selectedGenre)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Sticky Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-6 sm:px-12 lg:px-20 backdrop-blur-md border-b border-white/5 bg-background/80">
        <div className="flex items-center gap-6">
          <GrimoireBrand href="/" size="sm" />
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-white/70">
            <Link href="/" className="hover:text-violet-400 transition-colors">
              Home
            </Link>
            <Link href="/top-100" className="hover:text-violet-400 transition-colors">
              Top 100
            </Link>
            <Link href="/seasonal" className="text-violet-400 font-bold">
              Seasonal
            </Link>
            <Link href="/latest-updates" className="hover:text-violet-400 transition-colors">
              Latest Updates
            </Link>
            <Link href="/dashboard" className="hover:text-violet-400 transition-colors">
              My Library
            </Link>
          </nav>
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
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-fuchsia-950/20 via-background to-background p-6 sm:p-10 mb-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-300 mb-3 shadow-inner">
                <Tv className="h-3.5 w-3.5" />
                Anime Adaptations
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
                Seasonal Anime Manga
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/60 max-w-2xl">
                Read the original source manga behind your favorite anime series, including currently airing adaptations and upcoming releases.
              </p>
            </div>

            {/* Current vs Upcoming Tabs */}
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 self-start sm:self-center shrink-0">
              <button
                onClick={() => setActiveTab("current")}
                className={cn(
                  "rounded-lg px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  activeTab === "current"
                    ? "bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Tv className="h-3.5 w-3.5" />
                Currently Airing
              </button>
              <button
                onClick={() => setActiveTab("upcoming")}
                className={cn(
                  "rounded-lg px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  activeTab === "upcoming"
                    ? "bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                Upcoming Next Season
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
                  onClick={() => setCountry(country === o.value ? "" : o.value)}
                  className={cn(
                    "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 border cursor-pointer",
                    country === o.value
                      ? "border-fuchsia-500/50 bg-fuchsia-600/20 text-fuchsia-300 shadow-sm"
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
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-fuchsia-500 cursor-pointer"
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
                    className="text-xs text-fuchsia-400 hover:text-fuchsia-300 underline ml-1 cursor-pointer"
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
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    viewMode === "grid"
                      ? "bg-fuchsia-600 text-white shadow-sm"
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
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    viewMode === "list"
                      ? "bg-fuchsia-600 text-white shadow-sm"
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
        ) : filteredList.length > 0 ? (
          viewMode === "grid" ? (
            /* ===== GRID FORM ===== */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
              {filteredList.map((item) => (
                <Link
                  key={item.id}
                  href={`/manga/${item.id}`}
                  className={cn(
                    "group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1.5",
                    isInLibrary(item.id)
                      ? "border-emerald-500/25 bg-emerald-950/[0.08]"
                      : "border-white/10 bg-[#0d1017] hover:border-fuchsia-500/50 hover:shadow-2xl hover:shadow-fuchsia-900/20"
                  )}
                >
                  {/* Cover */}
                  <div className="relative aspect-[3/4.3] w-full overflow-hidden bg-black">
                    <img
                      src={item.cover}
                      alt={item.title}
                      className={cn(
                        "h-full w-full object-cover transition-all duration-500 group-hover:scale-105",
                        isInLibrary(item.id) && "opacity-55 saturate-50 contrast-90 group-hover:opacity-95 group-hover:saturate-100"
                      )}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-transparent to-transparent opacity-80" />

                    {/* Anime Adapted Pill + In Library (Top Left) */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <div className="rounded-md bg-fuchsia-600/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow">
                        {activeTab === "current" ? "Airing Now" : "Upcoming Anime"}
                      </div>
                      {isInLibrary(item.id) && (
                        <div className="flex items-center gap-0.5 rounded-md bg-emerald-600/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wider shadow">
                          <Bookmark className="h-2.5 w-2.5 fill-white" />
                          Saved
                        </div>
                      )}
                    </div>

                    {/* Score Badge (Top Right) */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 px-2 py-0.5 text-xs font-bold text-amber-400 shadow">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span>{item.rating > 0 ? item.rating.toFixed(1) : "N/A"}</span>
                    </div>

                    {/* Anime Title Pill (Bottom) */}
                    {item.airingAnimeTitle && (
                      <div className="absolute bottom-2 inset-x-2 rounded-lg bg-black/85 backdrop-blur-sm p-1.5 border border-white/10 shadow">
                        <p className="text-[10px] font-semibold text-fuchsia-300 truncate">
                          📺 {item.airingAnimeTitle}
                        </p>
                      </div>
                    )}

                    {/* Hover Quick Action Buttons */}
                    <div
                      className={cn(
                        "absolute left-2 z-20 flex items-center gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100",
                        item.airingAnimeTitle ? "bottom-10 translate-y-1 group-hover:translate-y-0" : "bottom-2.5 translate-y-1 group-hover:translate-y-0"
                      )}
                    >
                      {isInLibrary(item.id) && (getLibraryEntry(item.id)?.status || "").toLowerCase() === "plan_to_read" ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleStartReading(e, item)}
                            disabled={addingId === item.id}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold shadow-lg backdrop-blur-md transition-all cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white shadow-violet-600/40 border border-white/15"
                            title="Move from Plan to Read to Reading status"
                          >
                            {addingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <BookOpen className="h-3 w-3 text-white" />
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
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold shadow-lg backdrop-blur-md transition-all cursor-pointer bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-400/40"
                            title="View in Planned Library"
                          >
                            <Bookmark className="h-3 w-3 fill-white text-white" />
                            <span>Plan</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(e, item, "reading")}
                            disabled={addingId === item.id}
                            className={cn(
                              "flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold shadow-lg backdrop-blur-md transition-all cursor-pointer",
                              isInLibrary(item.id)
                                ? "bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/30"
                                : "bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:brightness-110 text-white shadow-fuchsia-600/40 border border-white/15"
                            )}
                            title={isInLibrary(item.id) ? "View in Library" : "Add to Reading"}
                          >
                            {addingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isInLibrary(item.id) ? (
                              <>
                                <BookOpen className="h-3 w-3 text-white" />
                                <span>In Library</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 text-white" />
                                <span>+ Reading</span>
                              </>
                            )}
                          </button>

                          {!isInLibrary(item.id) && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickAdd(e, item, "plan_to_read")}
                              disabled={addingId === item.id}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold shadow-lg backdrop-blur-md transition-all cursor-pointer bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-400/40"
                              title="Save to Plan to Read"
                            >
                              <Bookmark className="h-3 w-3 fill-white text-white" />
                              <span>Plan</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                    <div>
                      <h3 className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-fuchsia-300">
                        {item.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-white/50">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {item.type}
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
              ))}
            </div>
          ) : (
            /* ===== LIST FORM ===== */
            <div className="space-y-3.5">
              {filteredList.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-fuchsia-500/30 hover:bg-white/[0.05] p-4 transition-all duration-200 shadow-md"
                >
                  <Link
                    href={`/manga/${item.id}`}
                    className="relative h-24 w-17 sm:h-28 sm:w-20 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black shrink-0 group/cover"
                  >
                    <img
                      src={item.cover}
                      alt={item.title}
                      className={cn(
                        "h-full w-full object-cover transition-all duration-300 group-hover/cover:scale-105",
                        isInLibrary(item.id) && "opacity-55 saturate-50 contrast-90 group-hover/cover:opacity-95 group-hover/cover:saturate-100"
                      )}
                    />
                    <div className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.5 text-[9px] font-bold">
                      {item.origin === "KR" ? "🇰🇷" : item.origin === "CN" ? "🇨🇳" : "🇯🇵"}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/manga/${item.id}`}
                        className="text-base sm:text-lg font-bold text-white hover:text-fuchsia-300 transition-colors truncate max-w-xl"
                      >
                        {item.title}
                      </Link>
                      {item.airingAnimeTitle && (
                        <span className="rounded bg-fuchsia-500/20 border border-fuchsia-500/30 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-300">
                          Source for: {item.airingAnimeTitle}
                        </span>
                      )}
                      {isInLibrary(item.id) && (
                        <span className="flex items-center gap-1 rounded bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                          <Bookmark className="h-3 w-3 fill-emerald-400" />
                          In Library
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-white/60">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        {item.rating > 0 ? `${item.rating.toFixed(1)} / 10` : "N/A"}
                      </span>
                      <span>{item.type}</span>
                      <span>{item.status}</span>
                      {item.totalChapters && <span>{item.totalChapters} Chapters</span>}
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

                  <div className="shrink-0 pt-2 sm:pt-0 self-end sm:self-center flex flex-wrap items-center gap-2">
                    {isInLibrary(item.id) && (getLibraryEntry(item.id)?.status || "").toLowerCase() === "plan_to_read" ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleStartReading(e, item)}
                          disabled={addingId === item.id}
                          className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:brightness-110 border border-white/10"
                          title="Move to Reading"
                        >
                          {addingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <BookOpen className="h-3.5 w-3.5" />
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
                          className="rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-sm bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30"
                          title="View in Planned Library"
                        >
                          <Bookmark className="h-3.5 w-3.5 fill-current" />
                          <span>Plan</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, item, "reading")}
                          disabled={addingId === item.id}
                          className={cn(
                            "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm",
                            isInLibrary(item.id)
                              ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30"
                              : "bg-gradient-to-r from-fuchsia-600/30 to-violet-600/30 text-white border border-white/10 hover:border-fuchsia-500/50"
                          )}
                        >
                          {addingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isInLibrary(item.id) ? (
                            <>
                              <BookOpen className="h-3.5 w-3.5" />
                              <span>View in Library</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              <span>+ Reading</span>
                            </>
                          )}
                        </button>

                        {!isInLibrary(item.id) && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(e, item, "plan_to_read")}
                            disabled={addingId === item.id}
                            className="rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-sm bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30"
                            title="Plan to Read"
                          >
                            <Bookmark className="h-3.5 w-3.5 fill-current" />
                            <span>Plan</span>
                          </button>
                        )}
                      </>
                    )}

                    <Link href={`/manga/${item.id}`}>
                      <Button
                        size="sm"
                        className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-600/20 text-fuchsia-200 hover:bg-fuchsia-600 hover:text-white transition-all text-xs font-semibold px-4 cursor-pointer"
                      >
                        Read Source
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-20 rounded-3xl border border-white/5 bg-white/[0.02]">
            <Tv className="h-10 w-10 text-white/30 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Adaptations Found</h3>
            <p className="text-xs text-white/50 mt-1">Try clearing your filters to see more anime source manga.</p>
          </div>
        )}
      </main>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
