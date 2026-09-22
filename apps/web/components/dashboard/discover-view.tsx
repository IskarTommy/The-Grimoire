"use client";

import { Flame, Sparkles } from "lucide-react";
import { MangaGrid } from "./manga-grid";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

const GENRES = [
  { name: "Dark Fantasy", count: 5, color: "from-violet-500 to-fuchsia-500" },
  { name: "Action", count: 7, color: "from-rose-500 to-orange-500" },
  { name: "Fantasy", count: 4, color: "from-amber-400 to-yellow-500" },
  { name: "Sci-Fi", count: 3, color: "from-teal-400 to-cyan-500" },
  { name: "Drama", count: 4, color: "from-pink-500 to-rose-500" },
  { name: "Mystery", count: 2, color: "from-indigo-400 to-violet-500" },
];

type DiscoverViewProps = {
  items: MediaItem[];
};

export function DiscoverView({ items }: DiscoverViewProps) {
  // We can just use the first 5 for trending, and the rest for new releases
  const trending = items.slice(0, 5);
  const newReleases = items.slice(5, 11);

  return (
    <div className="space-y-8">
      {/* Hero strip */}
      <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
            <Sparkles className="h-3 w-3" /> Discover
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Find your next obsession
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Trending series, fresh releases, and hidden gems curated for your
            taste.
          </p>
        </div>
      </div>

      {/* Trending */}
      <section className="space-y-4">
        <SectionHeader
          title="Trending Now"
          subtitle="What everyone is reading this week"
          accent="text-rose-400"
          actionLabel="Explore"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {trending.map((item, i) => (
            <div key={item.id} className="relative">
              <span className="absolute -left-1 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 font-display text-xs font-bold text-white shadow-lg">
                {i + 1}
              </span>
              <MangaGrid items={[item]} className="!grid-cols-1" />
            </div>
          ))}
        </div>
      </section>

      {/* Genres */}
      <section className="space-y-4">
        <SectionHeader
          title="Browse by Genre"
          subtitle="Jump into your favorite worlds"
          accent="text-violet-300"
          actionLabel="All genres"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {GENRES.map((g) => (
            <button
              key={g.name}
              type="button"
              className="group relative h-24 overflow-hidden rounded-2xl border border-white/[0.07] p-4 text-left transition hover:border-white/20 hover:-translate-y-0.5"
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-25 transition-opacity group-hover:opacity-40",
                  g.color,
                )}
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative flex h-full flex-col justify-between">
                <Flame className="h-4 w-4 text-white/80" />
                <div>
                  <p className="font-display text-sm font-semibold text-white">
                    {g.name}
                  </p>
                  <p className="text-[11px] text-white/60">{g.count} titles</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* New releases */}
      <section className="space-y-4">
        <SectionHeader
          title="Fresh Releases"
          subtitle="Recently added to the catalogue"
          accent="text-teal-300"
          actionLabel="View all"
        />
        <MangaGrid items={newReleases} dense />
      </section>
    </div>
  );
}
