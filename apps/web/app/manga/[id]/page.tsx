"use client";

import { useTrendingManga, useSeasonalManga } from "@/hooks/use-anilist";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Play, Tv, BookOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MangaDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { media, loading: trendingLoading } = useTrendingManga();
  const { seasonal, loading: seasonalLoading } = useSeasonalManga();
  const loading = trendingLoading && seasonalLoading;

  // Find the manga in either trending or seasonal list
  const item = media.find((m) => m.id === id) || seasonal.find((m) => m.id === id);

  if (loading) {
    return <div className="min-h-screen bg-background animate-pulse" />;
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Manga Not Found</h1>
        <p className="text-muted-foreground">This manga might not be in the trending list right now.</p>
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
      </div>

      {/* Main Content Layout */}
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-[215px_1fr] gap-10 -mt-32 relative z-10 pb-20">
        
        {/* Left Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="w-full aspect-[3/4] rounded-sm overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-[#152232]">
            <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex gap-2">
            <Button className="flex-1 bg-[#3db4f2] hover:bg-[#3db4f2]/90 text-white font-bold h-10 rounded-sm">
              Add to List
            </Button>
            <Button variant="outline" className="w-10 px-0 bg-[#152232] border-none hover:bg-[#152232]/80 text-white rounded-sm">
              <Star className="h-4 w-4" />
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
