"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Flame,
  Tv,
  Star,
  Clock,
  Bookmark,
  BookOpen,
  Plus,
  ChevronRight,
  Filter,
  Loader2,
  Compass,
} from "lucide-react";
import {
  useTrendingManga,
  useSeasonalManga,
  usePopularNewManga,
  useLatestUpdatesManga,
} from "@/hooks/use-anilist";
import { MangaCard } from "./manga-card";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";
import { useLibrary } from "@/hooks/use-library";
import { useAuth } from "@/contexts/auth-context";

type DiscoverTab = "all" | "trending" | "seasonal" | "debuts" | "updates";

const ORIGINS = [
  { label: "All Origins", value: "" },
  { label: "🇯🇵 Manga", value: "JP" },
  { label: "🇰🇷 Manhwa", value: "KR" },
  { label: "🇨🇳 Manhua", value: "CN" },
];

const POPULAR_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Supernatural",
  "Thriller",
];

type DiscoverViewProps = {
  query?: string;
};

export function DiscoverView({ query = "" }: DiscoverViewProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isInLibrary, addToLibrary } = useLibrary();

  const [activeTab, setActiveTab] = useState<DiscoverTab>("all");
  const [selectedOrigin, setSelectedOrigin] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [addingId, setAddingId] = useState<string | null>(null);

  // Live queries
  const { media: trendingList, loading: trendingLoading } = useTrendingManga();
  const { seasonal: seasonalList, loading: seasonalLoading } = useSeasonalManga();
  const { popularNew: debutList, loading: debutLoading } = usePopularNewManga();
  const { updates: updateList, loading: updateLoading } = useLatestUpdatesManga();

  const loading = trendingLoading && seasonalLoading && debutLoading;

  // Filter helper
  const filterItems = (list: MediaItem[]) => {
    return list.filter((item) => {
      // Query match
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchGenre = item.genres.some((g) => g.toLowerCase().includes(q));
        if (!matchTitle && !matchGenre) return false;
      }
      // Origin match
      if (selectedOrigin && item.origin !== selectedOrigin) {
        return false;
      }
      // Genre match
      if (selectedGenre && !item.genres.includes(selectedGenre)) {
        return false;
      }
      return true;
    });
  };

  const filteredTrending = useMemo(() => filterItems(trendingList), [trendingList, query, selectedOrigin, selectedGenre]);
  const filteredSeasonal = useMemo(() => filterItems(seasonalList), [seasonalList, query, selectedOrigin, selectedGenre]);
  const filteredDebuts = useMemo(() => filterItems(debutList), [debutList, query, selectedOrigin, selectedGenre]);
  const filteredUpdates = useMemo(() => filterItems(updateList), [updateList, query, selectedOrigin, selectedGenre]);

  // Spotlight item (first trending with banner or first trending)
  const spotlightItem = useMemo(() => {
    return trendingList.find((m) => m.bannerImage) || trendingList[0] || null;
  }, [trendingList]);

  const spotlightInLibrary = spotlightItem ? isInLibrary(spotlightItem.id) : false;

  const handleSpotlightAdd = async () => {
    if (!spotlightItem) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/dashboard?nav=discover`);
      return;
    }
    if (spotlightInLibrary) {
      router.push("/dashboard");
      return;
    }
    try {
      setAddingId(spotlightItem.id);
      await addToLibrary({
        mangaId: spotlightItem.id,
        title: spotlightItem.title,
        coverUrl: spotlightItem.cover,
      });
    } catch (err) {
      console.error("Failed to add spotlight to library:", err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Featured Spotlight Banner */}
      {spotlightItem && !query && activeTab === "all" && !selectedGenre && (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-background to-background p-6 sm:p-8 lg:p-10 shadow-2xl">
          {/* Ambient Glow & Banner Blur */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {spotlightItem.bannerImage && (
              <img
                src={spotlightItem.bannerImage}
                alt=""
                className="w-full h-full object-cover blur-2xl opacity-20 scale-110"
              />
            )}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 lg:gap-8">
            {/* Cover Card */}
            <Link
              href={`/manga/${spotlightItem.id}`}
              className="relative shrink-0 group/cover rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black w-[130px] h-[190px] sm:w-[160px] sm:h-[235px] transition-transform duration-300 group-hover/cover:scale-[1.03]"
            >
              <img
                src={spotlightItem.cover}
                alt={spotlightItem.title}
                className={cn(
                  "h-full w-full object-cover transition-all duration-500",
                  spotlightInLibrary && "opacity-55 saturate-50 contrast-90"
                )}
              />
              <div className="absolute bottom-2 right-2 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-bold">
                {spotlightItem.origin === "KR" ? "🇰🇷" : spotlightItem.origin === "CN" ? "🇨🇳" : "🇯🇵"}
              </div>
            </Link>

            {/* Details & Actions */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300 shadow-inner">
                  <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  Featured Spotlight
                </span>
                {spotlightItem.hasAnime && (
                  <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-200">
                    <Tv className="h-3 w-3 inline mr-1" />
                    Anime Adaptation
                  </span>
                )}
                {spotlightInLibrary && (
                  <span className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                    <Bookmark className="h-3 w-3 fill-emerald-400" />
                    In Library
                  </span>
                )}
              </div>

              <Link href={`/manga/${spotlightItem.id}`}>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight hover:text-violet-300 transition-colors">
                  {spotlightItem.title}
                </h2>
              </Link>

              <p className="mt-2 text-xs sm:text-sm text-white/70 line-clamp-2 leading-relaxed max-w-2xl">
                {spotlightItem.synopsis || "Dive into an extraordinary story packed with action, drama, and gorgeous visuals."}
              </p>

              {/* Badges & Stats */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/60">
                <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {spotlightItem.rating.toFixed(1)}
                </span>
                <span>{spotlightItem.type}</span>
                <span>•</span>
                <span>{spotlightItem.status}</span>
                {spotlightItem.genres.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSpotlightAdd}
                  disabled={addingId === spotlightItem.id}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg transition-all cursor-pointer",
                    spotlightInLibrary
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                      : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 text-white shadow-violet-600/30"
                  )}
                >
                  {addingId === spotlightItem.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : spotlightInLibrary ? (
                    <>
                      <BookOpen className="h-4 w-4" />
                      <span>View in Library</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>+ Add to Library</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/manga/${spotlightItem.id}`}
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-all"
                >
                  <span>Details & Chapters</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Navigation & Filter Controls */}
      <div className="space-y-4">
        {/* Category Tabs & Origin Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "Curated Showcase", icon: Sparkles },
              { id: "trending", label: "Trending", icon: Flame },
              { id: "seasonal", label: "Seasonal Anime", icon: Tv },
              { id: "debuts", label: "Fresh Debuts", icon: Compass },
              { id: "updates", label: "Latest Drops", icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DiscoverTab)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer",
                    isActive
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-white/50")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Origin Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            {ORIGINS.map((origin) => {
              const isActive = selectedOrigin === origin.value;
              return (
                <button
                  key={origin.value}
                  onClick={() => setSelectedOrigin(isActive ? "" : origin.value)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                    isActive
                      ? "bg-white/20 text-white border border-white/30"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  {origin.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-white/40 uppercase tracking-wider mr-1 shrink-0">
            <Filter className="h-3 w-3" /> Genres:
          </span>
          <button
            onClick={() => setSelectedGenre("")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all shrink-0 cursor-pointer",
              !selectedGenre
                ? "bg-fuchsia-600 text-white shadow-sm"
                : "border border-white/5 bg-white/[0.02] text-white/60 hover:text-white"
            )}
          >
            All Genres
          </button>
          {POPULAR_GENRES.map((g) => {
            const isSelected = selectedGenre === g;
            return (
              <button
                key={g}
                onClick={() => setSelectedGenre(isSelected ? "" : g)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-fuchsia-600 text-white shadow-sm"
                    : "border border-white/5 bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Rendering based on Tab */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4.8] rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse"
            />
          ))}
        </div>
      ) : activeTab === "all" && !selectedGenre && !query ? (
        /* Showcase mode: Sections for Trending, Seasonal, Fresh Debuts, and Latest Drops */
        <div className="space-y-10">
          {/* Section 1: Trending Now */}
          <section className="space-y-4">
            <SectionHeader
              title="Trending Now"
              subtitle="The most popular series being read right now"
              accent="text-rose-400"
              actionLabel="View all trending"
              onAction={() => setActiveTab("trending")}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {filteredTrending.slice(0, 5).map((item, index) => (
                <MangaCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </section>

          {/* Section 2: Seasonal Anime Manga */}
          <section className="space-y-4">
            <SectionHeader
              title="Seasonal Anime Adaptations"
              subtitle="Original manga series with anime currently broadcasting"
              accent="text-sky-400"
              actionLabel="View all seasonal"
              onAction={() => setActiveTab("seasonal")}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {filteredSeasonal.slice(0, 5).map((item, index) => (
                <MangaCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </section>

          {/* Section 3: Fresh Debuts */}
          <section className="space-y-4">
            <SectionHeader
              title="Fresh Debuts & Rising Stars"
              subtitle="Newly launched titles gaining massive popularity"
              accent="text-teal-400"
              actionLabel="View all debuts"
              onAction={() => setActiveTab("debuts")}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {filteredDebuts.slice(0, 5).map((item, index) => (
                <MangaCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </section>

          {/* Section 4: Latest Chapter Updates */}
          <section className="space-y-4">
            <SectionHeader
              title="Latest Chapter Drops"
              subtitle="Fresh chapters recently translated and published"
              accent="text-violet-400"
              actionLabel="View all updates"
              onAction={() => setActiveTab("updates")}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {filteredUpdates.slice(0, 5).map((item, index) => (
                <MangaCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* Dedicated Grid View for Active Tab or Filtered Results */
        <div>
          {(() => {
            const list =
              activeTab === "trending"
                ? filteredTrending
                : activeTab === "seasonal"
                ? filteredSeasonal
                : activeTab === "debuts"
                ? filteredDebuts
                : activeTab === "updates"
                ? filteredUpdates
                : [...filteredTrending, ...filteredSeasonal, ...filteredDebuts];

            // Deduplicate
            const uniqueMap = new Map<string, MediaItem>();
            list.forEach((item) => {
              if (!uniqueMap.has(item.id)) {
                uniqueMap.set(item.id, item);
              }
            });
            const displayList = Array.from(uniqueMap.values());

            if (displayList.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
                  <Compass className="h-10 w-10 text-white/30 mb-3" />
                  <h3 className="text-base font-bold text-white">No manga found</h3>
                  <p className="mt-1 text-xs text-white/50 max-w-sm">
                    No titles matched your current filter criteria. Try clearing the genre or origin filter.
                  </p>
                  {(selectedGenre || selectedOrigin || query) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGenre("");
                        setSelectedOrigin("");
                      }}
                      className="mt-4 rounded-xl border border-violet-500/30 bg-violet-600/20 px-4 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition-colors cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {displayList.map((item, index) => (
                  <MangaCard key={item.id} item={item} index={index} />
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
