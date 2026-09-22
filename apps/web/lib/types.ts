export type ItemType = "MANGA" | "MANHWA" | "MANHUA" | "ANIME";

export type ItemStatus =
  | "ONGOING"
  | "COMPLETED"
  | "PLANNED"
  | "HIATUS"
  | "DROPPED";

export type MediaItem = {
  id: string;
  title: string;
  author: string;
  cover: string;
  type: ItemType;
  status: ItemStatus;
  /** 0 - 100 */
  progress: number;
  currentChapter: number;
  totalChapters: number | null; // null = still publishing
  currentEpisode?: number;
  totalEpisodes?: number | null;
  rating: number; // 0 - 10
  genres: string[];
  accent: "violet" | "crimson" | "amber" | "teal" | "rose";
  lastUpdated: string; // human readable
  year: number;
  trending?: boolean;
  featured?: boolean;
  bannerImage?: string;
  synopsis?: string;
  origin?: string;
  hasAnime?: boolean;
  airingAnimeTitle?: string;
};

export type NavKey =
  | "library"
  | "ongoing"
  | "completed"
  | "planned"
  | "discover"
  | "stats"
  | "anime"
  | "settings";
