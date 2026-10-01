"use client";

import { useMemo, useState } from "react";
import {
  LayoutGrid,
  List,
  ArrowDownWideNarrow,
  Search,
  BookOpen,
  Trophy,
  Clock,
  Tv,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { ItemType, MediaItem } from "@/lib/types";
import { LibraryMangaCard } from "./library-manga-card";
import { LibraryMangaRow } from "./library-manga-row";
import { LibraryDetailDrawer } from "./library-detail-drawer";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/hooks/use-library";

type FilterKey = "ALL" | ItemType;
type StatusFilterKey = "ALL" | "reading" | "completed" | "plan_to_read" | "on_hold" | "dropped";
type SortKey = "updated" | "rating" | "progress" | "chapters" | "title";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "updated", label: "Recently updated" },
  { key: "progress", label: "Reading progress" },
  { key: "rating", label: "Personal score" },
  { key: "chapters", label: "Chapters read" },
  { key: "title", label: "Title (A–Z)" },
];

const STATUS_FILTERS: { key: StatusFilterKey; label: string }[] = [
  { key: "ALL", label: "All Statuses" },
  { key: "reading", label: "Reading" },
  { key: "completed", label: "Completed" },
  { key: "plan_to_read", label: "Plan to Read" },
  { key: "on_hold", label: "On Hold" },
  { key: "dropped", label: "Dropped" },
];

type LibraryViewProps = {
  query?: string;
  items?: MediaItem[];
  title?: string;
  subtitle?: string;
  defaultStatusFilter?: StatusFilterKey;
};

export function LibraryView({
  query: propQuery = "",
  items: propItems,
  title = "Your Library",
  subtitle,
  defaultStatusFilter = "ALL",
}: LibraryViewProps) {
  const { libraryItems, getLibraryEntry } = useLibrary();
  const items = propItems || libraryItems;

  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>(defaultStatusFilter);
  const [sort, setSort] = useState<SortKey>("updated");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState(propQuery);
  const [selectedManga, setSelectedManga] = useState<MediaItem | null>(null);

  // Available formats
  const availableTypes = useMemo(() => {
    const set = new Set<ItemType>();
    items.forEach((i) => set.add(i.type));
    return (["MANGA", "MANHWA", "MANHUA", "ANIME"] as ItemType[]).filter((t) =>
      set.has(t),
    );
  }, [items]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "ALL", label: "All Formats" },
    ...availableTypes.map((t) => ({
      key: t as FilterKey,
      label:
        t === "MANGA"
          ? "Manga"
          : t === "MANHWA"
            ? "Manhwa"
            : t === "MANHUA"
              ? "Manhua"
              : "Anime",
    })),
  ];

  const visible = useMemo(() => {
    let list = [...items];

    // Format filter
    if (filter !== "ALL" && availableTypes.includes(filter as ItemType)) {
      list = list.filter((i) => i.type === filter);
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter((i) => {
        const rawStatus = (getLibraryEntry(i.id)?.status || "reading").toLowerCase();
        return rawStatus === statusFilter;
      });
    }

    // Search query
    const q = (searchQuery || propQuery).trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.author && i.author.toLowerCase().includes(q)) ||
          i.genres.some((g) => g.toLowerCase().includes(q)),
      );
    }

    // Sorting
    switch (sort) {
      case "rating":
        list.sort((a, b) => {
          const rA = getLibraryEntry(a.id)?.rating ?? a.rating ?? 0;
          const rB = getLibraryEntry(b.id)?.rating ?? b.rating ?? 0;
          return rB - rA;
        });
        break;
      case "progress":
        list.sort((a, b) => {
          const pA = a.totalChapters && a.totalChapters > 0 ? ((a.currentChapter || 0) / a.totalChapters) * 100 : a.progress;
          const pB = b.totalChapters && b.totalChapters > 0 ? ((b.currentChapter || 0) / b.totalChapters) * 100 : b.progress;
          return pB - pA;
        });
        break;
      case "chapters":
        list.sort((a, b) => {
          const cA = getLibraryEntry(a.id)?.currentChapter ?? a.currentChapter ?? 0;
          const cB = getLibraryEntry(b.id)?.currentChapter ?? b.currentChapter ?? 0;
          return cB - cA;
        });
        break;
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "updated":
      default:
        break;
    }
    return list;
  }, [items, filter, statusFilter, sort, searchQuery, propQuery, availableTypes, getLibraryEntry]);

  const resolvedSubtitle =
    subtitle ?? `${visible.length} ${visible.length === 1 ? "title" : "titles"} in your collection`;

  return (
    <section className="space-y-5">
      {/* Top Header & Multi-Control Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            title={title}
            subtitle={resolvedSubtitle}
            actionLabel=""
            onAction={() => {}}
          />

          {/* Right Controls: View Switcher & Sort */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
                  viewMode === "grid"
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                    : "text-white/50 hover:text-white"
                )}
                title="Grid Poster View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
                  viewMode === "list"
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                    : "text-white/50 hover:text-white"
                )}
                title="List Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Sort Selector */}
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-9 w-[165px] gap-2 rounded-xl border-white/[0.08] bg-white/[0.03] text-xs font-semibold text-white hover:bg-white/[0.06] focus:ring-violet-400/20">
                <ArrowDownWideNarrow className="h-3.5 w-3.5 text-violet-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#141624]/95 backdrop-blur-xl">
                {SORTS.map((s) => (
                  <SelectItem
                    key={s.key}
                    value={s.key}
                    className="text-xs focus:bg-violet-500/20 focus:text-white"
                  >
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Pills & In-Library Instant Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Format / Status Pills */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
            {STATUS_FILTERS.map((sf) => (
              <button
                key={sf.key}
                type="button"
                onClick={() => setStatusFilter(sf.key)}
                className={cn(
                  "relative shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === sf.key
                    ? "text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                {statusFilter === sf.key && (
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-sm" />
                )}
                <span className="relative">{sf.label}</span>
              </button>
            ))}
          </div>

          {/* Instant Search Bar */}
          <div className="relative sm:w-64 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in library..."
              className="h-9 pl-9 pr-4 text-xs rounded-xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/40 focus-visible:border-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Main List / Grid Display */}
      {visible.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.04] text-violet-400 border border-white/10">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">No titles match your filter</h4>
            <p className="mt-1 text-xs text-white/50 max-w-sm">
              {searchQuery
                ? `No titles found matching "${searchQuery}". Try a different keyword.`
                : "No manga found under this status filter. Add titles from discovery to get started."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setFilter("ALL");
                setSearchQuery("");
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <Link
              href="/top-100"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition-all cursor-pointer shadow-sm"
            >
              Browse Top 100
            </Link>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((item, i) => (
            <LibraryMangaCard
              key={item.id}
              item={item}
              index={i}
              onSelect={(m) => setSelectedManga(m)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((item, i) => (
            <LibraryMangaRow
              key={item.id}
              item={item}
              index={i}
              onSelect={(m) => setSelectedManga(m)}
            />
          ))}
        </div>
      )}

      {/* In-Library Detail Drawer & Reader Launchpad */}
      <LibraryDetailDrawer
        item={selectedManga}
        open={Boolean(selectedManga)}
        onClose={() => setSelectedManga(null)}
      />
    </section>
  );
}
