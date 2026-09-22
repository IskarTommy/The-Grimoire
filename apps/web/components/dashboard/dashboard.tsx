"use client";

import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DesktopSidebar, SidebarContent } from "./sidebar";
import { Header } from "./header";
import { Hero } from "./hero";
import { StatCards } from "./stat-cards";
import { ContinueReading } from "./continue-reading";
import { LibraryView } from "./library-view";
import { DiscoverView } from "./discover-view";
import { StatsView } from "./stats-view";
import { SettingsView } from "./settings-view";
import { Footer } from "./footer";
import { continueReading } from "@/lib/data";
import type { NavKey, MediaItem } from "@/lib/types";
import { useTrendingManga } from "@/hooks/use-anilist";

type ViewMeta = {
  title: string;
  subtitle: string;
};

const VIEW_META: Record<NavKey, ViewMeta> = {
  library: {
    title: "My Library",
    subtitle: "Your personal manga & anime sanctuary",
  },
  ongoing: {
    title: "Ongoing",
    subtitle: "Series you're actively following",
  },
  completed: {
    title: "Completed",
    subtitle: "Stories you've finished",
  },
  planned: {
    title: "Plan to Read",
    subtitle: "Your reading backlog",
  },
  anime: {
    title: "Anime",
    subtitle: "Your animated watchlist",
  },
  discover: {
    title: "Discover",
    subtitle: "Find your next obsession",
  },
  stats: {
    title: "Statistics",
    subtitle: "Insights into your reading habits",
  },
  settings: {
    title: "Settings",
    subtitle: "Make Grimoire yours",
  },
};

function filterForNav(nav: NavKey, items:
  MediaItem[]): MediaItem[] | null {
  switch (nav) {
    case 'ongoing':
      return items.filter((i) => i.status === 'ONGOING')
    case 'completed':
      return items.filter((i) => i.status === 'COMPLETED')
    case 'planned':
      return items.filter((i) => i.status === 'PLANNED')
    case 'anime':
      return items.filter((i) => i.type === 'ANIME')
    default:
      return null;
  }
}


export function Dashboard() {
  const [nav, setNav] = useState<NavKey>("library");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { media, loading } = useTrendingManga()

  const counts = useMemo(
    () => ({
      library: media.length,
      ongoing: media.filter((i) => i.status === "ONGOING").length,
      completed: media.filter((i) => i.status === "COMPLETED").length,
      planned: media.filter((i) => i.status === "PLANNED").length,
      anime: media.filter((i) => i.type === "ANIME").length,
    }),
    [media],
  );

  const meta = VIEW_META[nav];

  const handleNavigate = (key: NavKey) => {
    setNav(key);
    setMobileOpen(false);
    setQuery("");
  };

  const branchItems = filterForNav(nav, media);
  const continueItems =
    nav === "anime"
      ? continueReading(media).filter((i) => i.type === "ANIME")
      : continueReading(media);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <DesktopSidebar
          active={nav}
          onNavigate={handleNavigate}
          counts={counts}
        />

        {/* Mobile nav drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-[280px] border-white/10 bg-background/80 p-0 backdrop-blur-2xl"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent
              active={nav}
              onNavigate={handleNavigate}
              counts={counts}
            />
          </SheetContent>
        </Sheet>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            query={query}
            onQueryChange={setQuery}
            onOpenMobileNav={() => setMobileOpen(true)}
            title={meta.title}
            subtitle={meta.subtitle}
          />

          <main className="flex-1 space-y-8 px-4 py-6 sm:px-6 sm:py-8">
            {nav === "library" && (
              <>
                <Hero item={media[0]} />
                <StatCards />
                <ContinueReading items={continueItems} />
                <LibraryView query={query} items={media} />
              </>
            )}

            {nav === "ongoing" && (
              <>
                <ContinueReading items={continueItems} />
                <LibraryView
                  query={query}
                  items={branchItems ?? []}
                  title="Ongoing Series"
                />
              </>
            )}

            {nav === "completed" && (
              <LibraryView
                query={query}
                items={branchItems ?? []}
                title="Completed"
              />
            )}

            {nav === "planned" && (
              <LibraryView
                query={query}
                items={branchItems ?? []}
                title="Plan to Read"
              />
            )}

            {nav === "anime" && (
              <>
                <ContinueReading items={continueItems} />
                <LibraryView
                  query={query}
                  items={branchItems ?? []}
                  title="Anime Watchlist"
                />
              </>
            )}

            {nav === "discover" && <DiscoverView items={media} />}

            {nav === "stats" && <StatsView />}

            {nav === "settings" && <SettingsView />}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
