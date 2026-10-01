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
  animeStatus?: string;
  airingBadge?: string;
  currentSeason?: string;
  upcomingSeason?: string;
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

export type CharacterItem = {
  id: number;
  name: {
    full: string;
    native?: string;
    alternative?: string[];
  };
  image: {
    large: string;
    medium?: string;
  };
  role: "MAIN" | "SUPPORTING" | "BACKGROUND";
  voiceActor?: {
    id: number;
    name: {
      full: string;
      native?: string;
    };
    image: {
      large: string;
      medium?: string;
    };
    languageV2?: string;
  };
};

export type StaffItem = {
  id: number;
  name: {
    full: string;
    native?: string;
  };
  image: {
    large: string;
    medium?: string;
  };
  role: string;
};

export type RelationItem = {
  id: number;
  relationType: string;
  type: string;
  format?: string;
  status?: string;
  title: {
    romaji: string;
    english?: string;
    native?: string;
  };
  coverImage?: {
    large: string;
    medium?: string;
    color?: string;
  };
  bannerImage?: string;
  chapters?: number | null;
  episodes?: number | null;
  averageScore?: number | null;
  startDate?: {
    year?: number;
  };
};

export type TagItem = {
  id: number;
  name: string;
  description?: string;
  category?: string;
  rank?: number;
  isMediaSpoiler?: boolean;
};

export type ExternalLinkItem = {
  id: number;
  url: string;
  site: string;
  icon?: string;
  color?: string;
};

export type MangaDetail = MediaItem & {
  nativeTitle?: string;
  volumes?: number | null;
  meanScore?: number | null;
  popularity?: number;
  favourites?: number;
  tags?: TagItem[];
  characters?: CharacterItem[];
  staff?: StaffItem[];
  relations?: RelationItem[];
  externalLinks?: ExternalLinkItem[];
  rankings?: Array<{
    id: number;
    rank: number;
    type: string;
    allTime?: boolean;
    context: string;
    year?: number;
  }>;
};

export type MangaDexChapter = {
  id: string;
  chapter: string;
  volume: string | null;
  title: string | null;
  pages: number;
  readable: boolean;
  externalUrl: string | null;
  publishAt: string;
  scanlationGroup: string | null;
  translatedLanguage: string;
};

export type ChapterPagesResponse = {
  chapterId: string;
  baseUrl: string;
  hash: string;
  pages: string[];
  dataSaverPages: string[];
  total: number;
};

export type ReaderMode = 'webtoon' | 'single' | 'double';
export type FitMode = 'width' | 'height' | 'original';

