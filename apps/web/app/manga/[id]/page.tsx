"use client";

import { useState, useEffect } from "react";
import { useTrendingManga, useSeasonalManga, usePopularNewManga, mapAnilistItem } from "@/hooks/use-anilist";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Star, Play, Tv, BookOpen, Check, Bookmark, Loader2, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";
import { UserMenu } from "@/components/navigation/user-menu";
import { GrimoireBrand } from "@/components/ui/grimoire-brand";
import { useAuth } from "@/contexts/auth-context";
import { useLibrary } from "@/hooks/use-library";

const READING_STATUSES = [
  { key: "reading", label: "Reading", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
  { key: "plan_to_read", label: "Plan to Read", color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
  { key: "completed", label: "Completed", color: "text-violet-400 bg-violet-500/15 border-violet-500/30" },
  { key: "on_hold", label: "On Hold", color: "text-slate-300 bg-slate-500/15 border-slate-500/30" },
  { key: "dropped", label: "Dropped", color: "text-rose-400 bg-rose-500/15 border-rose-500/30" },
];

export default function MangaDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated } = useAuth();
  const { isInLibrary, getLibraryEntry, addToLibrary, updateStatus } = useLibrary();
  const [addingToLibrary, setAddingToLibrary] = useState(false);

  const entry = getLibraryEntry(id);
  const inLib = isInLibrary(id);
  const rawStatus = (entry?.status || "reading").toLowerCase();
  const currentStatusObj = READING_STATUSES.find((s) => s.key === rawStatus) ?? READING_STATUSES[0]!;

  const handleAddWithStatus = async (statusChoice: string) => {
    if (!item) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/manga/${item.id}`);
      return;
    }
    try {
      setAddingToLibrary(true);
      await addToLibrary({
        mangaId: item.id,
        title: item.title,
        coverUrl: item.cover,
        status: statusChoice,
      });
    } catch (err) {
      console.error('Failed to add to library:', err);
    } finally {
      setAddingToLibrary(false);
    }
  };

  const { media, loading: trendingLoading } = useTrendingManga();
  const { seasonal, loading: seasonalLoading } = useSeasonalManga();
  const { popularNew, loading: popularNewLoading } = usePopularNewManga();
  const [fetchedItem, setFetchedItem] = useState<MediaItem | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Find the manga in trending, seasonal, or popular-new list
  const cachedItem =
    media.find((m) => m.id === id) ||
    seasonal.find((m) => m.id === id) ||
    popularNew.find((m) => m.id === id);

  useEffect(() => {
    if (!cachedItem && id) {
      setFetchLoading(true);
      fetch(`http://127.0.0.1:3000/anilist/manga/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.id) {
            setFetchedItem(mapAnilistItem(data));
          }
        })
        .catch(console.error)
        .finally(() => setFetchLoading(false));
    }
  }, [id, cachedItem]);

  const item = cachedItem || fetchedItem;
  const loading = (trendingLoading && seasonalLoading && popularNewLoading) || (fetchLoading && !item);

  if (loading) {
    return <div className="min-h-screen bg-background animate-pulse" />;
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Manga Not Found</h1>
        <p className="text-muted-foreground">This manga could not be loaded.</p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1622] text-[#9fadbd]">
      {/* AniList Style Banner */}
      <div className="relative h-[400px] w-full">
        {/* We use the cover as a banner if a banner image doesn't exist */}
        <img 
          src={item.cover} 
          alt="Banner" 
          className="w-full h-full object-cover blur-sm opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1622] to-transparent" />
        
        {/* Brand Home Navigation */}
        <div className="absolute top-6 left-6 z-10">
          <div className="rounded-full px-3 py-1.5 backdrop-blur-md bg-black/60 border border-white/10 hover:border-white/20 transition-all flex items-center shadow-lg">
            <GrimoireBrand href="/" size="sm" />
          </div>
        </div>

        {/* User Account Menu */}
        <div className="absolute top-6 right-6 z-10">
          <UserMenu />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-[215px_1fr] gap-10 -mt-32 relative z-10 pb-20">
        
        {/* Left Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="w-full aspect-[3/4] rounded-sm overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-[#152232]">
            <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {!inLib ? (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAddWithStatus('reading')}
                  disabled={addingToLibrary}
                  className="flex-1 font-bold h-10 rounded-sm transition-all gap-1.5 cursor-pointer shadow-md bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 text-white shadow-violet-600/25"
                  title="Add to Reading"
                >
                  {addingToLibrary ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>+ Reading</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleAddWithStatus('plan_to_read')}
                  disabled={addingToLibrary}
                  variant="outline"
                  className="px-3 bg-[#152232] border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 rounded-sm font-semibold gap-1.5 cursor-pointer shadow-md"
                  title="Add to Plan to Read"
                >
                  <Bookmark className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs">Plan to Read</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rawStatus === 'plan_to_read' ? (
                  <>
                    <Button
                      onClick={() => updateStatus(item.id, 'reading')}
                      className="flex-1 min-w-[130px] font-bold h-10 rounded-sm transition-all gap-1.5 cursor-pointer shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white shadow-violet-600/25"
                      title="Move from Plan to Read to Reading status"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Start Reading</span>
                    </Button>
                    <Button
                      onClick={() => router.push('/dashboard?nav=planned')}
                      variant="outline"
                      className="px-3 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-bold h-10 rounded-sm transition-all gap-1.5 cursor-pointer shadow-md"
                      title="View in Planned Library"
                    >
                      <Bookmark className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="hidden sm:inline">Planned</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 font-bold h-10 rounded-sm transition-all gap-1.5 cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>View in Library</span>
                  </Button>
                )}

                {/* Status Picker Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "px-3 rounded-sm font-bold text-xs gap-1.5 border transition-all cursor-pointer h-10",
                        currentStatusObj.color
                      )}
                      title="Change reading status"
                    >
                      <span>{currentStatusObj.label}</span>
                      <ChevronDown className="h-3 w-3 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="border-white/10 bg-[#161826]/95 backdrop-blur-xl min-w-[140px] text-xs">
                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Update Status
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {READING_STATUSES.map((st) => (
                      <DropdownMenuItem
                        key={st.key}
                        onClick={() => updateStatus(item.id, st.key)}
                        className={cn(
                          "flex items-center justify-between gap-2 cursor-pointer focus:bg-violet-600/20",
                          rawStatus === st.key && "font-bold text-white bg-white/5"
                        )}
                      >
                        <span>{st.label}</span>
                        {rawStatus === st.key && <Check className="h-3.5 w-3.5 text-violet-400" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <div className="bg-[#152232] rounded-sm p-4 text-sm flex flex-col gap-3">
            <div>
              <span className="font-semibold text-white/90">Format</span>
              <p>{item.type}</p>
            </div>
            <div>
              <span className="font-semibold text-white/90">Status</span>
              <p>{item.status}</p>
            </div>
            <div>
              <span className="font-semibold text-white/90">Average Score</span>
              <p>{Math.round(item.rating * 10)}%</p>
            </div>
            {item.hasAnime && (
              <div>
                <span className="font-semibold text-white/90">Adaptation</span>
                <p className="flex items-center gap-1 text-sky-400 mt-1"><Tv className="h-3 w-3" /> Anime</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Column */}
        <div className="flex flex-col gap-6 pt-6">
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-white">
            {item.title}
          </h1>

          <p className="text-sm leading-relaxed text-[#9fadbd]">
            {item.synopsis || "No description available for this manga."}
          </p>

          {/* Chapters Placeholder for Phase 3 */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Chapters</h2>
            </div>
            <div className="bg-[#152232] rounded-sm p-8 text-center flex flex-col items-center gap-3 border border-white/5">
              <BookOpen className="h-8 w-8 text-white/20" />
              <p className="text-sm">Chapters will be loaded from MangaDex in Phase 3.</p>
              <Button disabled variant="outline" className="border-white/10 bg-white/5 text-white/50 rounded-sm mt-2">
                <Play className="h-4 w-4 mr-2" /> Read First Chapter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
