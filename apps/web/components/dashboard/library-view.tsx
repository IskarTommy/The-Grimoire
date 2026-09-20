"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, ArrowDownWideNarrow } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEDIA_ITEMS } from "@/lib/data";
import type { ItemType, MediaItem } from "@/lib/types";
import { MangaGrid } from "./manga-grid";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/utils";

type FilterKey = "ALL" | ItemType;

type SortKey = "updated" | "rating" | "progress" | "title";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "updated", label: "Recently updated" },
  { key: "rating", label: "Top rated" },
  { key: "progress", label: "Reading progress" },
  { key: "title", label: "Title (A–Z)" },
];

type LibraryViewProps = {
  query: string;
  items?: MediaItem[];
  title?: string;
  subtitle?: string;
};

export function LibraryView({
  query,
  items = MEDIA_ITEMS,
  title = "Your Library",
  subtitle,
}: LibraryViewProps) {
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [sort, setSort] = useState<SortKey>("updated");

  // Only show type pills for types that actually exist in the dataset.
  const availableTypes = useMemo(() => {
    const set = new Set<ItemType>();
    items.forEach((i) => set.add(i.type));
    return (["MANGA", "MANHWA", "MANHUA", "ANIME"] as ItemType[]).filter((t) =>
      set.has(t),
    );
  }, [items]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "ALL", label: "All" },
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
    if (filter !== "ALL" && availableTypes.includes(filter as ItemType)) {
      list = list.filter((i) => i.type === filter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.author.toLowerCase().includes(q) ||
          i.genres.some((g) => g.toLowerCase().includes(q)),
      );
    }
    switch (sort) {
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "progress":
        list.sort((a, b) => b.progress - a.progress);
        break;
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "updated":
      default:
        break;
    }
    return list;
  }, [items, filter, sort, query, availableTypes]);

  const resolvedSubtitle =
    subtitle ?? `${visible.length} ${visible.length === 1 ? "title" : "titles"} in your collection`;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          title={title}
          subtitle={resolvedSubtitle}
          actionLabel=""
          onAction={() => {}}
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter pills */}
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "relative shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.key
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {filter === f.key && (
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500/80 to-fuchsia-500/70 shadow-[0_4px_14px_-4px_oklch(0.62_0.24_295_/_0.6)]" />
                )}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>

          {/* Sort */}
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-[170px] gap-2 rounded-xl border-white/[0.07] bg-white/[0.02] text-xs font-medium text-foreground hover:bg-white/[0.04] focus:ring-violet-400/20">
              <ArrowDownWideNarrow className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-popover/95 backdrop-blur-xl">
              {SORTS.map((s) => (
                <SelectItem
                  key={s.key}
                  value={s.key}
                  className="text-xs focus:bg-violet-500/15"
                >
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-muted-foreground">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              No titles match your search
            </p>
            <p className="text-xs text-muted-foreground">
              Try a different filter or keyword.
            </p>
          </div>
        </div>
      ) : (
        <MangaGrid items={visible} dense />
      )}
    </section>
  );
}
