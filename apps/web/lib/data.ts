import type { MediaItem, ItemType, ItemStatus } from "./types";

/**
 * Mock data shaped to mirror a typical NestJS library API.
 * To wire up the real backend, replace the exports below with `fetch()` calls
 * to the equivalent endpoints (e.g. GET /items, GET /items/trending, etc.).
 */

export const FEATURED_ITEM: MediaItem = {
  id: "feat-1",
  title: "Crimson Eclipse",
  author: "Ren Kawahara",
  cover: "/covers/hero.png",
  type: "MANGA",
  status: "ONGOING",
  progress: 68,
  currentChapter: 142,
  totalChapters: null,
  rating: 9.4,
  genres: ["Dark Fantasy", "Action", "Adventure"],
  accent: "crimson",
  lastUpdated: "2 hours ago",
  year: 2021,
  featured: true,
  synopsis:
    "When the shattered moon bleeds crimson, a forgotten swordsman awakens in a valley of floating ruins. Hunted by the Eclipse Court, he must reclaim the seven broken blades before the world is swallowed by eternal dusk.",
};

export const MEDIA_ITEMS: MediaItem[] = [
  {
    id: "1",
    title: "Blade of Falling Petals",
    author: "Hayami Tsukuda",
    cover: "/covers/cover-1.png",
    type: "MANGA",
    status: "ONGOING",
    progress: 82,
    currentChapter: 96,
    totalChapters: null,
    rating: 9.1,
    genres: ["Action", "Historical", "Drama"],
    accent: "crimson",
    lastUpdated: "1 hour ago",
    year: 2020,
    trending: true,
  },
  {
    id: "2",
    title: "Violet Arcanum",
    author: "Saya Mizuki",
    cover: "/covers/cover-2.png",
    type: "MANGA",
    status: "ONGOING",
    progress: 45,
    currentChapter: 58,
    totalChapters: null,
    rating: 8.8,
    genres: ["Fantasy", "Magic", "Mystery"],
    accent: "violet",
    lastUpdated: "5 hours ago",
    year: 2022,
    trending: true,
  },
  {
    id: "3",
    title: "Neon Requiem",
    author: "Kaito Arata",
    cover: "/covers/cover-3.png",
    type: "MANHWA",
    status: "ONGOING",
    progress: 30,
    currentChapter: 34,
    totalChapters: null,
    rating: 9.0,
    genres: ["Cyberpunk", "Mecha", "Sci-Fi"],
    accent: "teal",
    lastUpdated: "Yesterday",
    year: 2023,
    trending: true,
  },
  {
    id: "4",
    title: "Throne of Embers",
    author: "Mirei Asakura",
    cover: "/covers/cover-4.png",
    type: "MANGA",
    status: "ONGOING",
    progress: 91,
    currentChapter: 120,
    totalChapters: null,
    rating: 9.3,
    genres: ["Dark Fantasy", "Supernatural", "Drama"],
    accent: "crimson",
    lastUpdated: "3 hours ago",
    year: 2019,
    trending: true,
  },
  {
    id: "5",
    title: "Skybound Aria",
    author: "Yui Hoshino",
    cover: "/covers/cover-5.png",
    type: "MANGA",
    status: "COMPLETED",
    progress: 100,
    currentChapter: 84,
    totalChapters: 84,
    rating: 8.6,
    genres: ["Adventure", "Fantasy", "Slice of Life"],
    accent: "amber",
    lastUpdated: "Completed 2024",
    year: 2018,
  },
  {
    id: "6",
    title: "Shadow Operative",
    author: "Goro Minase",
    cover: "/covers/cover-6.png",
    type: "MANHWA",
    status: "ONGOING",
    progress: 57,
    currentChapter: 72,
    totalChapters: null,
    rating: 8.9,
    genres: ["Action", "Thriller", "Urban"],
    accent: "violet",
    lastUpdated: "8 hours ago",
    year: 2021,
  },
  {
    id: "7",
    title: "Kitsune Shrine",
    author: "Nanami Shirase",
    cover: "/covers/cover-7.png",
    type: "MANGA",
    status: "PLANNED",
    progress: 0,
    currentChapter: 0,
    totalChapters: null,
    rating: 8.4,
    genres: ["Supernatural", "Romance", "Mythology"],
    accent: "rose",
    lastUpdated: "Plan to read",
    year: 2024,
  },
  {
    id: "8",
    title: "Obsidian Crusader",
    author: "Toma Eishi",
    cover: "/covers/cover-8.png",
    type: "MANHUA",
    status: "ONGOING",
    progress: 22,
    currentChapter: 19,
    totalChapters: null,
    rating: 9.2,
    genres: ["Dark Fantasy", "Action", "Military"],
    accent: "crimson",
    lastUpdated: "Yesterday",
    year: 2023,
    trending: true,
  },
  {
    id: "9",
    title: "Blade of Falling Petals",
    author: "Hayami Tsukuda",
    cover: "/covers/cover-1.png",
    type: "ANIME",
    status: "ONGOING",
    progress: 64,
    currentEpisode: 16,
    totalEpisodes: 24,
    currentChapter: 16,
    totalChapters: 24,
    rating: 8.7,
    genres: ["Action", "Historical", "Drama"],
    accent: "crimson",
    lastUpdated: "Streaming now",
    year: 2024,
  },
  {
    id: "10",
    title: "Violet Arcanum",
    author: "Saya Mizuki",
    cover: "/covers/cover-2.png",
    type: "ANIME",
    status: "COMPLETED",
    progress: 100,
    currentEpisode: 12,
    totalEpisodes: 12,
    currentChapter: 12,
    totalChapters: 12,
    rating: 8.9,
    genres: ["Fantasy", "Magic", "Mystery"],
    accent: "violet",
    lastUpdated: "Final season aired",
    year: 2023,
  },
  {
    id: "11",
    title: "Neon Requiem",
    author: "Kaito Arata",
    cover: "/covers/cover-3.png",
    type: "MANHWA",
    status: "HIATUS",
    progress: 48,
    currentChapter: 52,
    totalChapters: null,
    rating: 8.5,
    genres: ["Cyberpunk", "Mecha", "Sci-Fi"],
    accent: "teal",
    lastUpdated: "On hiatus",
    year: 2022,
  },
  {
    id: "12",
    title: "Throne of Embers",
    author: "Mirei Asakura",
    cover: "/covers/cover-4.png",
    type: "MANGA",
    status: "PLANNED",
    progress: 0,
    currentChapter: 0,
    totalChapters: null,
    rating: 9.3,
    genres: ["Dark Fantasy", "Supernatural", "Drama"],
    accent: "crimson",
    lastUpdated: "Plan to read",
    year: 2019,
  },
];

export type StatusMeta = {
  label: string;
  dotClass: string;
  textClass: string;
  ringClass: string;
};

export const STATUS_META: Record<ItemStatus, StatusMeta> = {
  ONGOING: {
    label: "Ongoing",
    dotClass: "bg-emerald-400 text-emerald-400",
    textClass: "text-emerald-300",
    ringClass: "shadow-[0_0_12px_2px_oklch(0.78_0.18_160_/_0.6)]",
  },
  COMPLETED: {
    label: "Completed",
    dotClass: "bg-sky-400 text-sky-400",
    textClass: "text-sky-300",
    ringClass: "shadow-[0_0_12px_2px_oklch(0.7_0.15_230_/_0.55)]",
  },
  PLANNED: {
    label: "Plan to Read",
    dotClass: "bg-amber-400 text-amber-400",
    textClass: "text-amber-300",
    ringClass: "shadow-[0_0_12px_2px_oklch(0.8_0.16_80_/_0.55)]",
  },
  HIATUS: {
    label: "On Hiatus",
    dotClass: "bg-fuchsia-400 text-fuchsia-400",
    textClass: "text-fuchsia-300",
    ringClass: "shadow-[0_0_12px_2px_oklch(0.72_0.2_320_/_0.55)]",
  },
  DROPPED: {
    label: "Dropped",
    dotClass: "bg-rose-500 text-rose-500",
    textClass: "text-rose-300",
    ringClass: "shadow-[0_0_12px_2px_oklch(0.65_0.22_16_/_0.55)]",
  },
};

export const TYPE_META: Record<
  ItemType,
  { label: string; className: string }
> = {
  MANGA: {
    label: "Manga",
    className:
      "bg-violet-500/15 text-violet-200 border-violet-400/30",
  },
  MANHWA: {
    label: "Manhwa",
    className: "bg-teal-500/15 text-teal-200 border-teal-400/30",
  },
  MANHUA: {
    label: "Manhua",
    className: "bg-rose-500/15 text-rose-200 border-rose-400/30",
  },
  ANIME: {
    label: "Anime",
    className: "bg-amber-500/15 text-amber-200 border-amber-400/30",
  },
};

export const ACCENT_CLASSES: Record<
  MediaItem["accent"],
  { from: string; to: string; bar: string; glow: string }
> = {
  violet: {
    from: "from-violet-500/40",
    to: "to-violet-700/0",
    bar: "from-violet-400 to-fuchsia-400",
    glow: "group-hover:shadow-[0_20px_60px_-15px_oklch(0.62_0.24_295_/_0.55)]",
  },
  crimson: {
    from: "from-rose-600/40",
    to: "to-rose-900/0",
    bar: "from-rose-400 to-orange-400",
    glow: "group-hover:shadow-[0_20px_60px_-15px_oklch(0.64_0.24_16_/_0.55)]",
  },
  amber: {
    from: "from-amber-500/40",
    to: "to-amber-800/0",
    bar: "from-amber-300 to-yellow-400",
    glow: "group-hover:shadow-[0_20px_60px_-15px_oklch(0.8_0.16_80_/_0.5)]",
  },
  teal: {
    from: "from-teal-500/40",
    to: "to-teal-800/0",
    bar: "from-teal-300 to-cyan-400",
    glow: "group-hover:shadow-[0_20px_60px_-15px_oklch(0.72_0.14_200_/_0.5)]",
  },
  rose: {
    from: "from-pink-500/40",
    to: "to-pink-800/0",
    bar: "from-pink-300 to-rose-400",
    glow: "group-hover:shadow-[0_20px_60px_-15px_oklch(0.7_0.2_350_/_0.5)]",
  },
};

export function continueReading(items: MediaItem[] = MEDIA_ITEMS) {
  return items
    .filter((i) => i.status === "ONGOING" && i.progress > 0 && i.progress < 100)
    .sort((a, b) => b.progress - a.progress);
}

export function recentlyUpdated(items: MediaItem[] = MEDIA_ITEMS) {
  return items.filter((i) => i.status !== "PLANNED").slice(0, 8);
}

export function trendingItems(items: MediaItem[] = MEDIA_ITEMS) {
  return items.filter((i) => i.trending);
}

export function libraryStats(items: MediaItem[] = MEDIA_ITEMS) {
  const total = items.length;
  const ongoing = items.filter((i) => i.status === "ONGOING").length;
  const completed = items.filter((i) => i.status === "COMPLETED").length;
  const planned = items.filter((i) => i.status === "PLANNED").length;
  const chapters = items.reduce((s, i) => s + i.currentChapter, 0);
  const avgRating =
    Math.round(
      (items.reduce((s, i) => s + i.rating, 0) / Math.max(items.length, 1)) *
        10,
    ) / 10;
  return { total, ongoing, completed, planned, chapters, avgRating };
}
