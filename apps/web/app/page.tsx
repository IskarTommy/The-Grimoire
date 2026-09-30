"use client";

import { useRef, useState, useEffect } from "react";
import {
  useTrendingManga,
  useSeasonalManga,
  usePopularNewManga,
  useLatestUpdatesManga,
  searchMangaApi,
} from "@/hooks/use-anilist";
import { MangaGrid } from "@/components/dashboard/manga-grid";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Tv,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Flame,
  Clock,
  Filter,
  Compass,
  X,
  Sparkles,
  Loader2,
  Star,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import type { MediaItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SearchModal } from "@/components/search/search-modal";
import { UserMenu } from "@/components/navigation/user-menu";
import { GrimoireLogo } from "@/components/ui/grimoire-logo";
import { GrimoireBrand } from "@/components/ui/grimoire-brand";
import { useLibrary } from "@/hooks/use-library";

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

function cleanSynopsis(synopsis?: string) {
  if (!synopsis) return "";
  return synopsis.replace(/<[^>]*>?/gm, "").trim();
}



export default function LandingPage() {
  const { media, loading } = useTrendingManga();
  const { seasonal, loading: seasonalLoading } = useSeasonalManga();
  const { popularNew, loading: popularNewLoading } = usePopularNewManga();
  const { updates: latestUpdatesList, loading: latestUpdatesLoading } = useLatestUpdatesManga();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

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

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const plugin = useRef(
    Autoplay({ delay: 6000, stopOnInteraction: true })
  );

  // Dedicated Popular New Titles for the hero carousel
  const heroSource = popularNew.length > 0 ? popularNew : media;
  const itemsWithBanner = heroSource.filter((m) => m.bannerImage);
  const heroItems = (itemsWithBanner.length >= 4 ? itemsWithBanner : heroSource).slice(0, 6);
  const heroLoading = popularNewLoading && heroSource.length === 0;

  // Dynamic Live Discovery state querying the full AniList catalogue
  type DiscoverSort = "TRENDING_DESC" | "POPULARITY_DESC" | "SCORE_DESC" | "UPDATED_AT_DESC";
  const [discoverSort, setDiscoverSort] = useState<DiscoverSort>("TRENDING_DESC");
  const [discoverOrigin, setDiscoverOrigin] = useState("");
  const [discoverGenre, setDiscoverGenre] = useState("");
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [discoverResults, setDiscoverResults] = useState<MediaItem[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [discoverLoadingMore, setDiscoverLoadingMore] = useState(false);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Live query AniList API whenever search, genre, origin, or sort changes
  useEffect(() => {
    let isCancelled = false;
    setDiscoverLoading(true);
    setDiscoverPage(1);

    const timer = setTimeout(async () => {
      try {
        const data = await searchMangaApi({
          q: discoverSearch.trim() || undefined,
          genre: discoverGenre || undefined,
          country: discoverOrigin || undefined,
          sort: discoverSort,
          page: 1,
          perPage: 24,
        });

        if (!isCancelled) {
          setDiscoverResults(data);
          setHasMore(data.length >= 24);
        }
      } catch (err) {
        console.error("Discovery query failed:", err);
        if (!isCancelled) setDiscoverResults([]);
      } finally {
        if (!isCancelled) setDiscoverLoading(false);
      }
    }, discoverSearch ? 350 : 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [discoverSearch, discoverGenre, discoverOrigin, discoverSort]);

  const handleLoadMore = async () => {
    if (discoverLoadingMore || !hasMore) return;
    setDiscoverLoadingMore(true);
    const nextPage = discoverPage + 1;
    try {
      const data = await searchMangaApi({
        q: discoverSearch.trim() || undefined,
        genre: discoverGenre || undefined,
        country: discoverOrigin || undefined,
        sort: discoverSort,
        page: nextPage,
        perPage: 24,
      });

      if (data.length > 0) {
        setDiscoverResults((prev) => [...prev, ...data]);
        setDiscoverPage(nextPage);
        setHasMore(data.length >= 24);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more discovery titles:", err);
    } finally {
      setDiscoverLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header with Grimoire Branding + Search (Ctrl K) + Profile Avatar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-6 sm:px-12 lg:px-20 backdrop-blur-md border-b border-white/5 bg-background/80">
        <div className="flex items-center gap-6">
          <GrimoireBrand href="/" size="sm" />
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-white/70">
            <Link href="/" className="text-violet-400 font-bold">
              Home
            </Link>
            <Link href="/top-100" className="hover:text-violet-400 transition-colors">
              Top 100
            </Link>
            <Link href="/seasonal" className="hover:text-violet-400 transition-colors">
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

        {/* Search Bar + Profile from Screenshot 2 */}
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
      <main className="pb-20">
        {/* Full-bleed Hero Carousel (No Card Wrapper) */}
        <div className="relative h-[78vh] w-full min-h-[580px] max-h-[720px]">
          {heroLoading ? (
            <div className="h-full w-full bg-white/5 animate-pulse" />
          ) : (
            <Carousel
              setApi={setApi}
              plugins={[plugin.current]}
              className="w-full h-full"
              opts={{
                loop: true,
              }}
            >
              <CarouselContent className="h-full">
                {heroItems.map((item) => (
                  <CarouselItem key={item.id} className="relative h-[78vh] min-h-[580px] max-h-[720px] w-full">
                    {/* Background Cover / Banner with cinematic dark overlays */}
                    <div className="absolute inset-0">
                      <img
                        src={item.bannerImage || item.cover}
                        alt={item.title}
                        className={`h-full w-full object-cover ${
                          !item.bannerImage ? "blur-md opacity-35 scale-105" : "opacity-55"
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/20" />
                      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent sm:w-2/3" />
                    </div>

                    {/* Hero Content positioned naturally at bottom */}
                    <div className="absolute bottom-[6%] sm:bottom-[8%] left-0 right-0 px-6 sm:px-12 lg:px-20 flex flex-col justify-end">
                      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-8 max-w-4xl">
                        {/* Clickable Cover Card with country flag badge */}
                        <Link href={`/manga/${item.id}`} className="shrink-0 group/cover block">
                          <div className="relative w-[130px] h-[190px] sm:w-[165px] sm:h-[240px] lg:w-[185px] lg:h-[265px] rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black transition-transform duration-300 group-hover/cover:scale-[1.03]">
                            <img
                              src={item.cover}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                            {/* Country Flag Badge (bottom right) */}
                            <div className="absolute bottom-1.5 right-1.5 rounded bg-white/95 px-1 py-0.5 shadow flex items-center justify-center">
                              <span className="text-[11px] leading-none">
                                {item.origin === "KR" ? "🇰🇷" : item.origin === "CN" ? "🇨🇳" : "🇯🇵"}
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* Title, Badges, Synopsis & Author */}
                        <div className="flex flex-col min-w-0 pb-1">
                          {/* Clickable Title */}
                          <Link href={`/manga/${item.id}`}>
                            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight hover:text-violet-300 transition-colors cursor-pointer drop-shadow-lg">
                              {item.title}
                            </h1>
                          </Link>

                          {/* Genre Badges: First is orange, rest are dark pills */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            {item.genres.slice(0, 4).map((genre, gIdx) => (
                              <span
                                key={genre}
                                className={cn(
                                  "px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded",
                                  gIdx === 0
                                    ? "bg-amber-600 text-white shadow-sm"
                                    : "bg-black/60 border border-white/10 text-white/90 backdrop-blur-md"
                                )}
                              >
                                {genre}
                              </span>
                            ))}
                            {item.hasAnime && (
                              <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded bg-sky-600/80 text-sky-100 border border-sky-400/30 backdrop-blur-md flex items-center gap-1">
                                <Tv className="h-3 w-3" /> Anime
                              </span>
                            )}
                          </div>

                          {/* Description Synopsis */}
                          <p className="mt-3 text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-2xl drop-shadow">
                            {cleanSynopsis(item.synopsis) ||
                              "Experience absolute freedom to read. Dive into thousands of beautifully formatted manga with no restrictions."}
                          </p>

                          {/* Author in italics */}
                          <p className="mt-3 text-xs sm:text-sm italic font-medium text-white/90">
                            {item.author || "Various"}
                          </p>
                        </div>
                      </div>

                      {/* Bottom-right carousel controls: NO. X and < > arrows */}
                      <div className="flex items-center justify-end pt-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold tracking-widest text-white/90">
                            NO. {current + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => api?.scrollPrev()}
                              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                              aria-label="Previous slide"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => api?.scrollNext()}
                              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                              aria-label="Next slide"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}
        </div>

        {/* ======================================================== */}
        {/* REBUILT DISCOVERY & BROWSE BY GENRE HUB */}
        {/* ======================================================== */}
        <section id="discover" className="mt-12 px-6 sm:px-12 lg:px-20 relative z-10 scroll-mt-24 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/30">
                  <Compass className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                  Catalogue Explorer
                </span>
              </div>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Discover Manga & Browse by Genre
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-white/60">
                Explore thousands of curated titles, filter by country of origin, or select your favorite genre.
              </p>
            </div>

            {/* In-Page Quick Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                value={discoverSearch}
                onChange={(e) => setDiscoverSearch(e.target.value)}
                placeholder="Filter by title or genre..."
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/40 focus:border-violet-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
              />
              {discoverSearch && (
                <button
                  onClick={() => setDiscoverSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-white/40 hover:text-white"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Controls: Feeds + Origins */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Feeds Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: "TRENDING_DESC", label: "Trending Now", icon: Flame },
                { id: "POPULARITY_DESC", label: "Most Popular", icon: Star },
                { id: "SCORE_DESC", label: "Top Rated", icon: Trophy },
                { id: "UPDATED_AT_DESC", label: "Latest Drops", icon: Clock },
              ].map((feed) => {
                const Icon = feed.icon;
                const isActive = discoverSort === feed.id;
                return (
                  <button
                    key={feed.id}
                    onClick={() => setDiscoverSort(feed.id as DiscoverSort)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer",
                      isActive
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-white/50")} />
                    <span>{feed.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Origin Pills */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {ORIGINS.map((origin) => {
                const isActive = discoverOrigin === origin.value;
                return (
                  <button
                    key={origin.value}
                    onClick={() => setDiscoverOrigin(isActive ? "" : origin.value)}
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

          {/* Browse by Genre Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-white/40 uppercase tracking-wider mr-1 shrink-0">
              <Filter className="h-3 w-3" /> Genres:
            </span>
            <button
              onClick={() => setDiscoverGenre("")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all shrink-0 cursor-pointer",
                !discoverGenre
                  ? "bg-fuchsia-600 text-white shadow-sm"
                  : "border border-white/5 bg-white/[0.02] text-white/60 hover:text-white"
              )}
            >
              All Genres
            </button>
            {POPULAR_GENRES.map((g) => {
              const isSelected = discoverGenre === g;
              return (
                <button
                  key={g}
                  onClick={() => setDiscoverGenre(isSelected ? "" : g)}
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

          {/* Manga Grid Results */}
          {discoverLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="aspect-[3/4.3] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : discoverResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
              <Compass className="h-10 w-10 text-white/30 mb-3" />
              <h3 className="text-base font-bold text-white">No manga found</h3>
              <p className="mt-1 text-xs text-white/50 max-w-sm">
                No titles matched your current genre, origin, or search filter in the global AniList catalogue.
              </p>
              {(discoverGenre || discoverOrigin || discoverSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setDiscoverGenre("");
                    setDiscoverOrigin("");
                    setDiscoverSearch("");
                  }}
                  className="mt-4 rounded-xl border border-violet-500/30 bg-violet-600/20 px-4 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <MangaGrid items={discoverResults} />

              {/* Discovery Footer: Counts, Load More from Global Catalogue */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
                <span className="text-xs text-white/50">
                  Showing {discoverResults.length} titles from global catalogue
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {hasMore && (
                    <Button
                      onClick={handleLoadMore}
                      disabled={discoverLoadingMore}
                      variant="outline"
                      className="rounded-xl border-violet-500/30 bg-violet-600/10 text-violet-200 hover:bg-violet-600 hover:text-white px-5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-2"
                    >
                      {discoverLoadingMore ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Loading More...</span>
                        </>
                      ) : (
                        <span>Load More Titles (+24)</span>
                      )}
                    </Button>
                  )}
                  <Link
                    href="/top-100"
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    <span>Top 100 Hall of Fame</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/latest-updates"
                    className="text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5 text-violet-400" />
                    <span>Latest Updates</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Seasonal Section: Manga whose anime is currently airing */}
        <section className="mt-10 sm:mt-12 px-6 sm:px-12 lg:px-20 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
                <h2 className="text-2xl font-bold font-display text-white">This Season&apos;s Manga</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-violet-400/30 bg-violet-500/15 text-violet-300">
                  {seasonal[0]?.currentSeason ? `${seasonal[0].currentSeason} Anime` : "Anime Adaptations"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Read the original source manga behind this season&apos;s anime broadcasts, including shows premiering this week &amp; next week
              </p>
            </div>
            <Link
              href="/seasonal"
              className="text-sm font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              Browse All Adaptations <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {seasonalLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <MangaGrid items={seasonal.slice(0, 10)} />
          )}
        </section>
      </main>

      {/* Global Search & Filter Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        initialItems={media}
      />
    </div>
  );
}
