"use client";

import { useRef, useState, useEffect } from "react";
import { useTrendingManga, useSeasonalManga } from "@/hooks/use-anilist";
import { MangaGrid } from "@/components/dashboard/manga-grid";
import { Button } from "@/components/ui/button";
import { BookOpen, Tv, Search, User, ChevronLeft, ChevronRight } from "lucide-react";
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

function cleanSynopsis(synopsis?: string) {
  if (!synopsis) return "";
  return synopsis.replace(/<[^>]*>?/gm, "").trim();
}

function PopularMangaList({ items }: { items: MediaItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <Link
          key={item.id}
          href={`/manga/${item.id}`}
          className="group flex items-center gap-3.5 rounded-xl p-2 transition-all duration-200 hover:bg-white/[0.04]"
        >
          <div className="relative h-19 w-14 sm:h-20 sm:w-15 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-md">
            <img
              src={item.cover}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute top-0 left-0 rounded-br-lg bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-sm">
              #{i + 1}
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col py-0.5 justify-center">
            <h4 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-violet-300">
              {item.title}
            </h4>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-[11px]">
                <BookOpen className="h-3 w-3" /> {item.status}
              </span>
              <span className="text-[11px] font-semibold text-amber-400">
                ★ {item.rating.toFixed(1)}
              </span>
            </div>
            <div className="mt-1.5 flex gap-1.5 truncate">
              {item.genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-white/60"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const { media, loading } = useTrendingManga();
  const { seasonal, loading: seasonalLoading } = useSeasonalManga();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

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

  // Guarantee hero items even if bannerImage is not set on all
  const itemsWithBanner = media.filter((m) => m.bannerImage);
  const heroItems = (itemsWithBanner.length >= 4 ? itemsWithBanner : media).slice(0, 6);
  const latestUpdates = media.slice(6, 16);
  // 6 items so popular sidebar exactly matches the height of 2 rows of latest updates
  const popularSidebar = [...media].sort((a, b) => b.rating - a.rating).slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header with Grimoire Branding + Search (Ctrl K) + Profile Avatar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-6 sm:px-12 lg:px-20 backdrop-blur-md border-b border-white/5 bg-background/70">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Grimoire
          </span>
        </div>

        {/* Search Bar + Profile from Screenshot 2 */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60 hover:border-white/20 transition-colors"
          >
            <Search className="h-3.5 w-3.5 text-white/50" />
            <span>Search</span>
            <kbd className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/70">Ctrl K</kbd>
          </Link>
          <Link href="/dashboard">
            <div className="h-8 w-8 rounded-full border border-white/15 bg-white/10 flex items-center justify-center text-white text-xs font-semibold shadow hover:bg-white/20 transition-colors" title="My Account">
              <User className="h-4 w-4" />
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {/* Full-bleed Hero Carousel (No Card Wrapper) */}
        <div className="relative h-[78vh] w-full min-h-[580px] max-h-[720px]">
          {loading ? (
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

        {/* Dual Column Layout */}
        <div className="mt-10 px-6 sm:px-12 lg:px-20 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            
            {/* Main Column: Latest Updates */}
            <section className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold font-display text-white">Latest Updates</h2>
                 <Link href="/dashboard" className="text-sm font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1">
                   View all <ChevronRight className="h-4 w-4" />
                 </Link>
              </div>
              {loading ? (
                <div className="h-[500px] bg-white/5 rounded-2xl animate-pulse" />
              ) : (
                <MangaGrid items={latestUpdates} />
              )}
            </section>

            {/* Right Sidebar: Popular Manga */}
            <aside className="w-full lg:w-[320px] shrink-0">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold font-display text-white">Most Popular</h2>
              </div>
              {loading ? (
                <div className="h-[500px] bg-white/5 rounded-2xl animate-pulse" />
              ) : (
                <>
                  <PopularMangaList items={popularSidebar} />
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full mt-4 border-white/10 bg-white/[0.02] text-white hover:bg-white/10">
                      View Top 100
                    </Button>
                  </Link>
                </>
              )}
            </aside>
            
          </div>
        </div>

        {/* Seasonal Section: Manga whose anime is currently airing */}
        <section className="mt-10 sm:mt-12 px-6 sm:px-12 lg:px-20 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
                <h2 className="text-2xl font-bold font-display text-white">This Season&apos;s Manga</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-violet-400/30 bg-violet-500/15 text-violet-300">
                  Anime Adaptations
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Read the original source manga behind this season&apos;s hottest anime releases
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 self-start sm:self-auto"
            >
              View all in Library <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {seasonalLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <MangaGrid items={seasonal.slice(0, 15)} />
          )}
        </section>
      </main>
    </div>
  );
}
