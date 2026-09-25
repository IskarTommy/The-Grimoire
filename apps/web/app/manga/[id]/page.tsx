"use client";

import { useState, useEffect } from "react";
import { useTrendingManga, useSeasonalManga, usePopularNewManga } from "@/hooks/use-anilist";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Play, Tv, BookOpen, Check, Bookmark, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";
import { UserMenu } from "@/components/navigation/user-menu";
import { useAuth } from "@/contexts/auth-context";
import { useLibrary } from "@/hooks/use-library";

export default function MangaDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated } = useAuth();
  const { isInLibrary, addToLibrary } = useLibrary();
  const [addingToLibrary, setAddingToLibrary] = useState(false);

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
            setFetchedItem({
              id: String(data.id),
              title: data.title?.english || data.title?.romaji || "Unknown Title",
              author: "Various",
              cover: data.coverImage?.extraLarge || data.coverImage?.large || "",
              bannerImage: data.bannerImage,
              synopsis: data.description,
              origin: data.countryOfOrigin,
              type: data.countryOfOrigin === "KR" ? "MANHWA" : data.countryOfOrigin === "CN" ? "MANHUA" : "MANGA",
              status: data.status === "RELEASING" ? "ONGOING" : "COMPLETED",
              progress: 0,
              currentChapter: data.chapters || 0,
              totalChapters: data.chapters || null,
              rating: (data.averageScore || 0) / 10,
              genres: data.genres || [],
              accent: "violet",
              lastUpdated: "Recently",
              year: new Date().getFullYear(),
              trending: true,
              hasAnime: data.relations?.edges?.some((e: any) => e.node?.type === "ANIME") || false,
            });
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
        
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full px-4 gap-2 backdrop-blur-md bg-black/40">
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>
          </Link>
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
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                if (!item) return;
                if (!isAuthenticated) {
                  router.push(`/login?redirect=/manga/${item.id}`);
                  return;
                }
                if (isInLibrary(item.id)) {
                  router.push('/dashboard');
                  return;
                }
                try {
                  setAddingToLibrary(true);
                  await addToLibrary({
                    mangaId: item.id,
                    title: item.title,
                    coverUrl: item.cover,
                  });
                } catch (err) {
                  console.error('Failed to add to library:', err);
                } finally {
                  setAddingToLibrary(false);
                }
              }}
              disabled={addingToLibrary}
              className={cn(
                "flex-1 font-bold h-10 rounded-sm transition-all gap-1.5 cursor-pointer shadow-md",
                isInLibrary(item.id)
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 text-white shadow-violet-600/25"
              )}
            >
              {addingToLibrary ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : isInLibrary(item.id) ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>In Library</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  <span>+ Add to Library</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-10 px-0 bg-[#152232] border border-white/10 hover:bg-[#152232]/80 text-white rounded-sm"
              title="Rating"
            >
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            </Button>
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
