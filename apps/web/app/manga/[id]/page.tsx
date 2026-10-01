"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Play,
  Tv,
  BookOpen,
  Check,
  Bookmark,
  Loader2,
  ChevronDown,
  Plus,
  Users,
  Mic,
  Palette,
  GitBranch,
  ExternalLink,
  Eye,
  EyeOff,
  Calendar,
  Globe,
  Award,
  Heart,
  TrendingUp,
  Layers,
  Sparkles,
  Info,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { MangaDetail, CharacterItem, StaffItem, RelationItem, MangaDexChapter } from "@/lib/types";
import { useMangaDetail } from "@/hooks/use-anilist";
import { useMangaChapters } from "@/hooks/use-mangadex";
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

type DetailTab = "overview" | "chapters" | "characters" | "staff" | "relations";

function cleanSynopsis(synopsis?: string) {
  if (!synopsis) return "";
  return synopsis
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>?/gm, "")
    .trim();
}

export default function MangaDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated } = useAuth();
  const { isInLibrary, getLibraryEntry, addToLibrary, updateStatus } = useLibrary();

  const [addingToLibrary, setAddingToLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");

  // Fetch full enriched manga details
  const { manga: item, loading, error } = useMangaDetail(id);

  // Fetch MangaDex chapters
  const {
    chapters,
    loading: loadingChapters,
    total: totalChaptersCount,
    order: chapterOrder,
    toggleOrder,
  } = useMangaChapters(item?.title, id);

  const entry = getLibraryEntry(id);
  const inLib = isInLibrary(id);
  const rawStatus = (entry?.status || "reading").toLowerCase();
  const currentStatusObj = READING_STATUSES.find((s) => s.key === rawStatus) ?? READING_STATUSES[0]!;

  // Earliest readable chapter (for Start Reading button)
  const earliestReadableChapter = useMemo(() => {
    const asc = [...chapters].sort(
      (a, b) => (parseFloat(a.chapter) || 0) - (parseFloat(b.chapter) || 0)
    );
    return asc.find((c) => c.readable);
  }, [chapters]);

  // Next chapter based on user's current progress
  const nextProgressChapter = useMemo(() => {
    if (!entry?.currentChapter) return null;
    const curr = entry.currentChapter;
    const asc = [...chapters].sort(
      (a, b) => (parseFloat(a.chapter) || 0) - (parseFloat(b.chapter) || 0)
    );
    return asc.find((c) => (parseFloat(c.chapter) || 0) > curr && c.readable);
  }, [chapters, entry]);

  // Filtered chapters for chapter list tab
  const filteredChapters = useMemo(() => {
    if (!chapterSearch.trim()) return chapters;
    const q = chapterSearch.trim().toLowerCase();
    return chapters.filter(
      (c) =>
        c.chapter.toLowerCase().includes(q) ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.scanlationGroup && c.scanlationGroup.toLowerCase().includes(q))
    );
  }, [chapters, chapterSearch]);

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
      console.error("Failed to add to library:", err);
    } finally {
      setAddingToLibrary(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1622] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
        <p className="text-sm font-semibold text-white/50 animate-pulse">Loading grimoire entry...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#0b1622] flex flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold text-white font-display">Manga Not Found</h1>
        <p className="text-sm text-white/50 max-w-md">
          {error || "We could not find this title in the global Grimoire archives."}
        </p>
        <Link href="/">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-6">Return Home</Button>
        </Link>
      </div>
    );
  }

  // Filter spoiler tags unless toggled
  const regularTags = (item.tags || []).filter((t) => !t.isMediaSpoiler);
  const spoilerTags = (item.tags || []).filter((t) => t.isMediaSpoiler);
  const visibleTags = showSpoilers ? item.tags || [] : regularTags;

  const characters = item.characters || [];
  const staff = item.staff || [];
  const relations = item.relations || [];
  const externalLinks = item.externalLinks || [];

  return (
    <div className="min-h-screen bg-[#0b1622] text-[#9fadbd] selection:bg-violet-600/30 selection:text-white">
      {/* 1. Hero Ambient Banner (Seamless Vignettes - No Cutoff Line) */}
      <div className="relative h-[420px] w-full overflow-hidden bg-[#0b1622]">
        <img
          src={item.bannerImage || item.cover}
          alt={item.title}
          className={cn(
            "w-full h-full object-cover",
            item.bannerImage ? "opacity-45" : "blur-lg scale-110 opacity-30"
          )}
        />

        {/* Top Navigation Aura */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />

        {/* Multi-Stop Bottom Ambient Fade (Smoothly transitions to 100% solid #0b1622) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1622] via-[#0b1622]/80 via-40% to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0b1622] from-35% via-[#0b1622]/95 to-transparent pointer-events-none" />

        {/* Brand Home Navigation */}
        <div className="absolute top-6 left-6 z-20">
          <div className="rounded-full px-3 py-1.5 backdrop-blur-md bg-black/60 border border-white/10 hover:border-white/20 transition-all flex items-center shadow-lg">
            <GrimoireBrand href="/" size="sm" />
          </div>
        </div>

        {/* User Account Menu */}
        <div className="absolute top-6 right-6 z-20">
          <UserMenu />
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-[230px_1fr] gap-8 lg:gap-12 -mt-36 relative z-10 pb-28">
        {/* Left Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Cover Artwork */}
          <div className="w-full aspect-[3/4.2] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-[#152232] group relative">
            <img
              src={item.cover}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {item.origin && (
              <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/85 backdrop-blur-md border border-white/10 px-2 py-0.5 text-xs font-bold shadow">
                {item.origin === "KR" ? "🇰🇷 Manhwa" : item.origin === "CN" ? "🇨🇳 Manhua" : "🇯🇵 Manga"}
              </div>
            )}
          </div>

          {/* Quick Add / Library Action Controls */}
          <div className="flex flex-col gap-2.5">
            {/* Direct Reader Launch Button */}
            {(nextProgressChapter || earliestReadableChapter) && (
              <Button
                onClick={() => {
                  const target = nextProgressChapter || earliestReadableChapter;
                  if (target) router.push(`/read/${item.id}/${target.id}`);
                }}
                className="w-full font-bold h-11 rounded-xl transition-all gap-2 cursor-pointer shadow-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 text-white shadow-violet-600/30"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>
                  {nextProgressChapter
                    ? `Continue Ch. ${nextProgressChapter.chapter}`
                    : `Read Ch. ${earliestReadableChapter?.chapter}`}
                </span>
              </Button>
            )}

            {!inLib ? (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAddWithStatus("reading")}
                  disabled={addingToLibrary}
                  className="flex-1 font-bold h-11 rounded-xl transition-all gap-1.5 cursor-pointer shadow-md bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 text-white shadow-violet-600/25"
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
                  onClick={() => handleAddWithStatus("plan_to_read")}
                  disabled={addingToLibrary}
                  variant="outline"
                  className="px-3.5 bg-[#152232]/80 border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 rounded-xl font-semibold gap-1.5 cursor-pointer shadow-md h-11"
                  title="Add to Plan to Read"
                >
                  <Bookmark className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs">Plan</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rawStatus === "plan_to_read" ? (
                  <>
                    <Button
                      onClick={() => updateStatus(item.id, "reading")}
                      className="flex-1 min-w-[130px] font-bold h-11 rounded-xl transition-all gap-1.5 cursor-pointer shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white shadow-violet-600/25"
                      title="Move from Plan to Read to Reading status"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Start Reading</span>
                    </Button>
                    <Button
                      onClick={() => router.push("/dashboard?nav=planned")}
                      variant="outline"
                      className="px-3 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-bold h-11 rounded-xl transition-all gap-1.5 cursor-pointer shadow-md"
                      title="View in Planned Library"
                    >
                      <Bookmark className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="hidden sm:inline">Planned</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="flex-1 font-bold h-11 rounded-xl transition-all gap-1.5 cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>In Library</span>
                  </Button>
                )}

                {/* Status Picker Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "px-3 rounded-xl font-bold text-xs gap-1.5 border transition-all cursor-pointer h-11",
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

          {/* Quick Stats Sidebar Card */}
          <div className="bg-[#121b28]/90 backdrop-blur-md rounded-2xl p-5 text-xs flex flex-col gap-3.5 border border-white/10 shadow-xl">
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider border-b border-white/10 pb-2">
              Information
            </h3>

            <div>
              <span className="text-white/40 block text-[11px] font-medium">Format</span>
              <p className="font-semibold text-white mt-0.5">{item.type}</p>
            </div>

            <div>
              <span className="text-white/40 block text-[11px] font-medium">Status</span>
              <p className="font-semibold text-emerald-400 mt-0.5">{item.status}</p>
            </div>

            {item.totalChapters && (
              <div>
                <span className="text-white/40 block text-[11px] font-medium">Chapters</span>
                <p className="font-semibold text-white mt-0.5">{item.totalChapters} Chapters</p>
              </div>
            )}

            {item.volumes && (
              <div>
                <span className="text-white/40 block text-[11px] font-medium">Volumes</span>
                <p className="font-semibold text-white mt-0.5">{item.volumes} Volumes</p>
              </div>
            )}

            <div>
              <span className="text-white/40 block text-[11px] font-medium">Average Score</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-amber-300 text-sm">
                  {Math.round(item.rating * 10)}%
                </span>
                <span className="text-white/40 text-[10px]">
                  ({item.rating > 0 ? (item.rating).toFixed(1) : "N/A"}/10)
                </span>
              </div>
            </div>

            {Boolean(item.popularity) && (
              <div>
                <span className="text-white/40 block text-[11px] font-medium">Popularity</span>
                <div className="flex items-center gap-1.5 text-white/80 mt-0.5">
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{item.popularity?.toLocaleString()} readers</span>
                </div>
              </div>
            )}

            {Boolean(item.favourites) && (
              <div>
                <span className="text-white/40 block text-[11px] font-medium">Favorites</span>
                <div className="flex items-center gap-1.5 text-white/80 mt-0.5">
                  <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />
                  <span>{item.favourites?.toLocaleString()}</span>
                </div>
              </div>
            )}

            {item.hasAnime && (
              <div className="pt-2 border-t border-white/5">
                <span className="text-white/40 block text-[11px] font-medium">Anime Adaptation</span>
                <p className="flex items-center gap-1.5 text-sky-400 font-semibold mt-1">
                  <Tv className="h-3.5 w-3.5" />
                  <span>{item.airingAnimeTitle || "Adapted into Anime"}</span>
                </p>
              </div>
            )}

            {item.rankings && item.rankings.length > 0 && (
              <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
                <span className="text-white/40 block text-[11px] font-medium">Rankings</span>
                {item.rankings.slice(0, 2).map((rk) => (
                  <div key={rk.id} className="flex items-center gap-1.5 text-[11px] text-amber-300">
                    <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>
                      #{rk.rank} {rk.context}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Column */}
        <div className="flex flex-col gap-6 pt-2">
          {/* Header Title & Native Alias */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-md border border-violet-500/30 bg-violet-600/15 px-2 py-0.5 text-[11px] font-bold text-violet-300">
                {item.type}
              </span>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-600/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                {item.status}
              </span>
              {item.airingBadge && (
                <span className="flex items-center gap-1 rounded-md border border-indigo-400/40 bg-indigo-500/20 px-2 py-0.5 text-[11px] font-bold text-indigo-300 shadow">
                  <Tv className="h-3 w-3" />
                  {item.airingBadge}
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {item.title}
            </h1>
            {item.nativeTitle && (
              <p className="mt-1 text-sm font-medium text-white/40 font-mono">
                {item.nativeTitle}
              </p>
            )}
            {item.author && item.author !== "Various" && (
              <p className="mt-1 text-xs text-white/60">
                Created by <span className="font-semibold text-white/90">{item.author}</span>
              </p>
            )}
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
            {[
              { id: "overview", label: "Overview", icon: BookOpen },
              {
                id: "chapters",
                label: `Chapters (${totalChaptersCount || chapters.length})`,
                icon: Layers,
              },
              { id: "characters", label: `Characters (${characters.length})`, icon: Users },
              { id: "staff", label: `Staff & Creators (${staff.length})`, icon: Palette },
              { id: "relations", label: `Franchise & Relations (${relations.length})`, icon: GitBranch },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DetailTab)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer",
                    isActive
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-8">
              {/* Synopsis */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-2.5">
                  Synopsis
                </h2>
                <p className="text-sm leading-relaxed text-[#9fadbd] whitespace-pre-line bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                  {cleanSynopsis(item.synopsis) || "No detailed synopsis available for this title."}
                </p>
              </div>

              {/* Characters Preview Section */}
              {characters.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      Characters
                    </h2>
                    <button
                      onClick={() => setActiveTab("characters")}
                      className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                    >
                      View All ({characters.length}) &rarr;
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {characters.slice(0, 6).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 transition-all"
                      >
                        <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-black/50">
                          <img
                            src={c.image.large || c.image.medium}
                            alt={c.name.full}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate">{c.name.full}</h4>
                          <span className="text-[10px] text-white/50 block capitalize">
                            {c.role.toLowerCase()}
                          </span>
                          {c.voiceActor && (
                            <span className="text-[10px] text-sky-400 flex items-center gap-1 truncate mt-0.5">
                              <Mic className="h-2.5 w-2.5 shrink-0" />
                              {c.voiceActor.name.full}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Relations Preview */}
              {relations.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      Franchise & Relations
                    </h2>
                    <button
                      onClick={() => setActiveTab("relations")}
                      className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                    >
                      View Full Tree ({relations.length}) &rarr;
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {relations.slice(0, 3).map((rel) => (
                      <Link
                        key={rel.id}
                        href={rel.type === "MANGA" ? `/manga/${rel.id}` : "#"}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-violet-500/30 transition-all",
                          rel.type === "MANGA" ? "cursor-pointer" : "cursor-default"
                        )}
                      >
                        <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-black/50">
                          {rel.coverImage?.large ? (
                            <img
                              src={rel.coverImage.large}
                              alt={rel.title.romaji}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                              <Tv className="h-4 w-4 text-white/30" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-violet-400 block">
                            {rel.relationType.replace(/_/g, " ")}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate">
                            {rel.title.english || rel.title.romaji}
                          </h4>
                          <span className="text-[10px] text-white/50 block">
                            {rel.format} {rel.status && `• ${rel.status}`}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags & Content Cloud */}
              {visibleTags.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      Genres & Tags
                    </h2>
                    {spoilerTags.length > 0 && (
                      <button
                        onClick={() => setShowSpoilers((prev) => !prev)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        {showSpoilers ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Hide Spoilers</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            <span>Show Spoilers ({spoilerTags.length})</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {visibleTags.map((tag) => (
                      <span
                        key={tag.id}
                        className={cn(
                          "rounded-xl px-3 py-1 text-xs font-medium border transition-all",
                          tag.isMediaSpoiler
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                            : "border-white/5 bg-white/[0.03] text-white/70 hover:text-white"
                        )}
                        title={tag.description}
                      >
                        {tag.name}
                        {tag.rank && (
                          <span className="ml-1 text-[10px] opacity-60">
                            {tag.rank}%
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External & Official Links */}
              {externalLinks.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3">
                    Official & External Links
                  </h2>
                  <div className="flex flex-wrap gap-2.5">
                    {externalLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all shadow-sm"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-violet-400" />
                        <span>{link.site}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Chapters Reader Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Latest Chapters
                  </h2>
                  <button
                    onClick={() => setActiveTab("chapters")}
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                  >
                    View All ({totalChaptersCount || chapters.length}) &rarr;
                  </button>
                </div>

                {loadingChapters ? (
                  <div className="bg-[#121b28]/60 rounded-2xl p-6 text-center flex items-center justify-center gap-2 border border-white/5 text-xs text-white/50">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                    <span>Indexing chapters from MangaDex...</span>
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="bg-[#121b28]/60 rounded-2xl p-6 text-center border border-white/5 text-xs text-white/40">
                    No English chapters catalogued on MangaDex yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {chapters.slice(0, 6).map((ch) => (
                      <div
                        key={ch.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-violet-500/30 transition-all group"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                              Chapter {ch.chapter}
                            </span>
                            {ch.scanlationGroup && (
                              <span className="text-[10px] text-white/40 truncate max-w-[120px]">
                                • {ch.scanlationGroup}
                              </span>
                            )}
                          </div>
                          {ch.title && (
                            <p className="text-[11px] text-white/50 truncate mt-0.5">{ch.title}</p>
                          )}
                          <span className="text-[10px] text-white/40 block mt-0.5">
                            {ch.pages > 0 ? `${ch.pages} pages` : "Official"}
                          </span>
                        </div>

                        {ch.readable ? (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/read/${item.id}/${ch.id}`)}
                            className="h-8 px-3 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white shrink-0 cursor-pointer"
                          >
                            Read
                          </Button>
                        ) : ch.externalUrl ? (
                          <a
                            href={ch.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-[11px] font-semibold rounded-lg border-white/10 hover:bg-white/10 text-white/70"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" /> External
                            </Button>
                          </a>
                        ) : (
                          <span className="text-[10px] text-white/30 pr-2">Unavailable</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CHAPTERS FULL BROWSER */}
          {activeTab === "chapters" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">All Chapters</h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    {totalChaptersCount || chapters.length} available chapters aggregated from MangaDex.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search chapter..."
                      value={chapterSearch}
                      onChange={(e) => setChapterSearch(e.target.value)}
                      className="h-9 w-44 sm:w-56 pl-8 pr-3 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleOrder}
                    className="h-9 px-3 text-xs rounded-xl border-white/10 text-white/80 hover:bg-white/5 cursor-pointer gap-1.5"
                    title={`Currently: ${chapterOrder === "desc" ? "Newest First" : "Oldest First"}`}
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>{chapterOrder === "desc" ? "Newest" : "Oldest"}</span>
                  </Button>
                </div>
              </div>

              {loadingChapters ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3 border border-white/5 rounded-2xl bg-white/[0.02]">
                  <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                  <p className="text-xs text-white/50">Fetching chapters from MangaDex...</p>
                </div>
              ) : filteredChapters.length === 0 ? (
                <div className="py-16 text-center text-white/40 text-xs border border-white/5 rounded-2xl bg-white/[0.02]">
                  {chapterSearch
                    ? `No chapters matching "${chapterSearch}"`
                    : "No chapters found for this title on MangaDex."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredChapters.map((ch: MangaDexChapter) => (
                    <div
                      key={ch.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-violet-500/30 transition-all group"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                            Chapter {ch.chapter}
                          </span>
                        </div>
                        {ch.title && (
                          <p className="text-xs text-white/60 truncate mt-0.5">{ch.title}</p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1">
                          {ch.pages > 0 && <span>{ch.pages} pages</span>}
                          {ch.scanlationGroup && (
                            <span className="truncate max-w-[130px] text-violet-400">
                              {ch.scanlationGroup}
                            </span>
                          )}
                        </div>
                      </div>

                      {ch.readable ? (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/read/${item.id}/${ch.id}`)}
                          className="h-8 px-3.5 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shrink-0 cursor-pointer shadow-md shadow-violet-600/20"
                        >
                          Read
                        </Button>
                      ) : ch.externalUrl ? (
                        <a
                          href={ch.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-[11px] font-semibold rounded-xl border-white/10 hover:bg-white/10 text-white/70"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" /> External
                          </Button>
                        </a>
                      ) : (
                        <span className="text-[10px] text-white/30 pr-2">Unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHARACTERS & VOICE ACTORS */}
          {activeTab === "characters" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-base font-bold text-white">
                  Characters & Voice Actors
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Main and supporting characters from the manga and their corresponding Japanese voice actors (seiyuu).
                </p>
              </div>

              {characters.length === 0 ? (
                <div className="py-16 text-center text-white/40 text-xs border border-white/5 rounded-2xl bg-white/[0.02]">
                  No character roster catalogued for this title yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {characters.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all shadow-md group"
                    >
                      {/* Character Side */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-20 rounded-xl overflow-hidden shrink-0 bg-black/60 shadow border border-white/10">
                          <img
                            src={c.image.large || c.image.medium}
                            alt={c.name.full}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{c.name.full}</h4>
                          {c.name.native && (
                            <span className="text-[11px] text-white/40 block font-mono truncate">
                              {c.name.native}
                            </span>
                          )}
                          <span
                            className={cn(
                              "inline-block mt-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              c.role === "MAIN"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-white/5 text-white/60 border border-white/10"
                            )}
                          >
                            {c.role}
                          </span>
                        </div>
                      </div>

                      {/* Voice Actor Side (If available) */}
                      {c.voiceActor ? (
                        <div className="flex items-center gap-3 text-right shrink-0 pl-3 border-l border-white/10">
                          <div className="min-w-0 max-w-[120px]">
                            <span className="text-[10px] font-semibold text-sky-400 block uppercase tracking-wider">
                              CV / Seiyuu
                            </span>
                            <h5 className="text-xs font-bold text-white truncate">
                              {c.voiceActor.name.full}
                            </h5>
                            {c.voiceActor.name.native && (
                              <span className="text-[10px] text-white/40 block font-mono truncate">
                                {c.voiceActor.name.native}
                              </span>
                            )}
                          </div>
                          <div className="w-12 h-16 rounded-xl overflow-hidden shrink-0 bg-black/60 shadow border border-white/10">
                            <img
                              src={c.voiceActor.image.large || c.voiceActor.image.medium}
                              alt={c.voiceActor.name.full}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-right text-[10px] text-white/30 italic pr-2">
                          Manga Original
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STAFF & CREATORS */}
          {activeTab === "staff" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-base font-bold text-white">Staff & Creators</h2>
                <p className="text-xs text-white/50 mt-1">
                  The talented mangaka, authors, storywriters, and illustrators behind this work.
                </p>
              </div>

              {staff.length === 0 ? (
                <div className="py-16 text-center text-white/40 text-xs border border-white/5 rounded-2xl bg-white/[0.02]">
                  No staff metadata catalogued for this title yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center gap-3.5 p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all shadow-md group"
                    >
                      <div className="w-14 h-18 rounded-xl overflow-hidden shrink-0 bg-black/60 shadow border border-white/10">
                        <img
                          src={st.image.large || st.image.medium}
                          alt={st.name.full}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-violet-400 block uppercase tracking-wider">
                          {st.role}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate">{st.name.full}</h4>
                        {st.name.native && (
                          <span className="text-[11px] text-white/40 block font-mono truncate">
                            {st.name.native}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FRANCHISE & RELATIONS */}
          {activeTab === "relations" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-base font-bold text-white">Franchise & Relations</h2>
                <p className="text-xs text-white/50 mt-1">
                  Connected media across the franchise: anime adaptations, prequels, sequels, side stories, and spin-offs.
                </p>
              </div>

              {relations.length === 0 ? (
                <div className="py-16 text-center text-white/40 text-xs border border-white/5 rounded-2xl bg-white/[0.02]">
                  No related media catalogued for this title.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relations.map((rel) => {
                    const isManga = rel.type === "MANGA";
                    const isAnime = rel.type === "ANIME";
                    return (
                      <Link
                        key={rel.id}
                        href={isManga ? `/manga/${rel.id}` : "#"}
                        className={cn(
                          "group flex gap-3.5 p-3.5 rounded-2xl border transition-all duration-300 shadow-lg",
                          isManga
                            ? "border-white/10 bg-[#121b28]/60 hover:border-violet-500/50 hover:-translate-y-1 hover:shadow-violet-900/20 cursor-pointer"
                            : "border-sky-500/20 bg-sky-950/[0.06] hover:border-sky-500/40 cursor-default"
                        )}
                      >
                        {/* Cover / Poster */}
                        <div className="w-16 h-22 rounded-xl overflow-hidden shrink-0 bg-black/60 shadow border border-white/10 relative">
                          {rel.coverImage?.large ? (
                            <img
                              src={rel.coverImage.large}
                              alt={rel.title.romaji}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                              {isAnime ? <Tv className="h-5 w-5 text-sky-400" /> : <BookOpen className="h-5 w-5 text-violet-400" />}
                            </div>
                          )}
                          <div className="absolute top-1 left-1 rounded bg-black/80 px-1 py-0.5 text-[8px] font-bold text-white uppercase">
                            {rel.format || rel.type}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-400 block mb-1">
                              {rel.relationType.replace(/_/g, " ")}
                            </span>
                            <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-2">
                              {rel.title.english || rel.title.romaji}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-white/50 pt-2 border-t border-white/5">
                            {isAnime && rel.episodes && <span>{rel.episodes} eps</span>}
                            {isManga && rel.chapters && <span>{rel.chapters} chs</span>}
                            {rel.averageScore && (
                              <span className="flex items-center gap-0.5 text-amber-300 font-semibold">
                                <Star className="h-2.5 w-2.5 fill-amber-300" />
                                {rel.averageScore}%
                              </span>
                            )}
                            {rel.startDate?.year && <span>• {rel.startDate.year}</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
