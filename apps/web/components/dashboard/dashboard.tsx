"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { useAuth } from "@/contexts/auth-context";
import { useLibrary } from "@/hooks/use-library";
import { useTrendingManga } from "@/hooks/use-anilist";
import { GrimoireLogo } from "@/components/ui/grimoire-logo";
import { GrimoireBrand } from "@/components/ui/grimoire-brand";
import {
  BookOpen,
  LogIn,
  UserPlus,
  Sparkles,
  Trophy,
  Clock,
  Tv,
  ArrowRight,
  Bookmark,
  Compass,
} from "lucide-react";

type ViewMeta = {
  title: string;
  subtitle: string;
};

const VIEW_META: Record<NavKey, ViewMeta> = {
  library: {
    title: "My Library",
    subtitle: "Your personal manga sanctuary",
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

function filterForNav(nav: NavKey, items: MediaItem[]): MediaItem[] | null {
  switch (nav) {
    case "ongoing":
      return items.filter((i) => i.status === "ONGOING");
    case "completed":
      return items.filter((i) => i.status === "COMPLETED");
    case "planned":
      return items.filter((i) => i.status === "PLANNED");
    case "anime":
      return items.filter((i) => i.hasAnime || i.type === "ANIME");
    default:
      return null;
  }
}

export function Dashboard() {
  const [nav, setNav] = useState<NavKey>("library");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { libraryItems, loading: libraryLoading } = useLibrary();
  const { media: trendingFallback } = useTrendingManga();

  // If user is authenticated, use their real library; otherwise empty for guest
  const activeItems = isAuthenticated ? libraryItems : [];

  const counts = useMemo(
    () => ({
      library: activeItems.length,
      ongoing: activeItems.filter((i) => i.status === "ONGOING").length,
      completed: activeItems.filter((i) => i.status === "COMPLETED").length,
      planned: activeItems.filter((i) => i.status === "PLANNED").length,
      anime: activeItems.filter((i) => i.hasAnime || i.type === "ANIME").length,
    }),
    [activeItems],
  );

  const meta = VIEW_META[nav];

  const handleNavigate = (key: NavKey) => {
    setNav(key);
    setMobileOpen(false);
    setQuery("");
  };

  const branchItems = filterForNav(nav, activeItems);

  // Guest State Screen
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0a0b12] text-foreground">
        {/* Navigation Bar */}
        <header className="flex h-16 items-center justify-between px-6 sm:px-12 border-b border-white/5 bg-background/80 backdrop-blur-md">
          <GrimoireBrand href="/" size="sm" />
          <div className="flex items-center gap-2.5">
            <Link
              href="/login?redirect=/dashboard"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/90 hover:border-violet-500/50 hover:bg-violet-600/10 hover:text-white transition-all shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5 text-violet-400" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/signup?redirect=/dashboard"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-600/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </Link>
          </div>
        </header>

        {/* Hero Guest Sanctuary Message */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
          <div className="mb-6 relative inline-block">
            <div className="absolute -inset-4 rounded-full bg-violet-600/25 blur-2xl animate-pulse" />
            <GrimoireLogo size={84} className="relative drop-shadow-[0_0_30px_rgba(168,85,247,0.45)]" />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Your Personal Library Sanctuary
          </h1>
          <p className="mt-3 text-sm text-white/60 leading-relaxed max-w-md">
            Create an account or sign in to save your personal manga collection, track reading chapter progress, and organize your favorite titles.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Link
              href="/login?redirect=/dashboard"
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/25 hover:brightness-110 transition-all cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/signup?redirect=/dashboard"
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4 text-fuchsia-400" />
              <span>Create Account</span>
            </Link>
          </div>

          {/* Open Discovery Note */}
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/50 max-w-md">
            <p className="font-medium text-white/80 mb-1">Looking to read without an account?</p>
            <p>All manga discovery, search, Top 100 rankings, and chapter reading are 100% free and open for everyone.</p>
            <div className="mt-3 flex justify-center gap-4 text-violet-400 font-semibold">
              <Link href="/top-100" className="hover:text-violet-300 transition-colors flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Top 100
              </Link>
              <Link href="/latest-updates" className="hover:text-violet-300 transition-colors flex items-center gap-1">
                <Clock className="h-3 w-3" /> Latest Updates
              </Link>
              <Link href="/seasonal" className="hover:text-violet-300 transition-colors flex items-center gap-1">
                <Tv className="h-3 w-3" /> Seasonal
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {/* If user is logged in but has no items in library tabs */}
            {(["library", "ongoing", "completed", "planned", "anime"].includes(nav)) && activeItems.length === 0 ? (
              <div className="flex min-h-[380px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 sm:p-12 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
                  <Bookmark className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-white">
                    Welcome, {user?.username}! Your library is empty.
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-white/60 max-w-md">
                    Start building your personal collection by browsing top-rated manga, latest updates, or seasonal anime adaptations.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                  <Link
                    href="/#discover"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/25 hover:brightness-110 transition-all cursor-pointer"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Discover Manga</span>
                  </Link>
                  <Link
                    href="/top-100"
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    <span>Browse Top 100</span>
                  </Link>
                  <Link
                    href="/latest-updates"
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Latest Updates</span>
                  </Link>
                  <Link
                    href="/seasonal"
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Tv className="h-3.5 w-3.5 text-fuchsia-400" />
                    <span>Seasonal Anime Manga</span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {nav === "library" && (
                  <>
                    <StatCards />
                    <LibraryView query={query} items={activeItems} />
                  </>
                )}

                {nav === "ongoing" && (
                  <LibraryView
                    query={query}
                    items={branchItems ?? []}
                    title="Ongoing Series"
                    defaultStatusFilter="reading"
                  />
                )}

                {nav === "completed" && (
                  <LibraryView
                    query={query}
                    items={branchItems ?? []}
                    title="Completed"
                    defaultStatusFilter="completed"
                  />
                )}

                {nav === "planned" && (
                  <LibraryView
                    query={query}
                    items={branchItems ?? []}
                    title="Plan to Read"
                    defaultStatusFilter="plan_to_read"
                  />
                )}

                {nav === "anime" && (
                  <LibraryView
                    query={query}
                    items={branchItems ?? []}
                    title="Anime Watchlist"
                    subtitle={`${(branchItems ?? []).length} adaptations in your collection`}
                  />
                )}

                {nav === "discover" && <DiscoverView query={query} />}

                {nav === "stats" && <StatsView />}

                {nav === "settings" && <SettingsView />}
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
