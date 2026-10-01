import { useState, useEffect } from "react";
import {
  MediaItem,
  MangaDetail,
  CharacterItem,
  StaffItem,
  RelationItem,
  TagItem,
  ExternalLinkItem,
} from "../lib/types";


export function detectHasAnime(item: any): boolean {
    if (!item) return false;
    if (typeof item.hasAnime === 'boolean') return item.hasAnime;
    if (Boolean(item.airingAnimeTitle)) return true;

    const edges = item.relations?.edges;
    if (!Array.isArray(edges) || edges.length === 0) return false;

    // 1. Direct anime relation (excluding purely character cameos)
    const hasDirectAnime = edges.some(
        (edge: any) => edge?.node?.type === 'ANIME' && edge?.relationType !== 'CHARACTER'
    );
    if (hasDirectAnime) return true;

    // 2. Indirect anime via source novel, parent, or alternative original work
    const hasIndirectAnime = edges.some((edge: any) => {
        if (!['SOURCE', 'ALTERNATIVE', 'PARENT'].includes(edge?.relationType)) {
            return false;
        }
        const nestedEdges = edge?.node?.relations?.edges;
        if (!Array.isArray(nestedEdges)) return false;

        return nestedEdges.some(
            (subEdge: any) => subEdge?.node?.type === 'ANIME' && subEdge?.relationType !== 'CHARACTER'
        );
    });

    return hasIndirectAnime;
}

export function mapAnilistItem(item: any): MediaItem {
    const hasAnime = detectHasAnime(item);

    return {
        id: String(item.id),
        title: item.title?.english || item.title?.romaji || 'Unknown Title',
        author: 'Various',
        cover: item.coverImage?.extraLarge || item.coverImage?.large || '',
        bannerImage: item.bannerImage,
        synopsis: item.description,
        origin: item.countryOfOrigin,
        type: item.countryOfOrigin === 'KR' ? 'MANHWA' : item.countryOfOrigin === 'CN' ? 'MANHUA' : 'MANGA',
        status: item.status === 'RELEASING' ? 'ONGOING' : 'COMPLETED',
        progress: 0,
        currentChapter: item.chapters || 0,
        totalChapters: item.chapters || null,
        rating: (item.averageScore || 0) / 10,
        genres: item.genres || [],
        accent: 'violet',
        lastUpdated: 'Recently',
        year: new Date().getFullYear(),
        trending: true,
        hasAnime: hasAnime,
        airingAnimeTitle: item.airingAnimeTitle,
        animeStatus: item.animeStatus,
        airingBadge: item.airingBadge,
        currentSeason: item.currentSeason,
        upcomingSeason: item.upcomingSeason,
    };
}

export function mapAnilistDetail(item: any): MangaDetail {
    const base = mapAnilistItem(item);

    const characters: CharacterItem[] = (item.characters?.edges || []).map((e: any) => ({
        id: e.node?.id,
        role: e.role || 'SUPPORTING',
        name: {
            full: e.node?.name?.full || 'Unknown',
            native: e.node?.name?.native || undefined,
            alternative: e.node?.name?.alternative || [],
        },
        image: {
            large: e.node?.image?.large || e.node?.image?.medium || '',
            medium: e.node?.image?.medium || '',
        },
        voiceActor: e.voiceActor ? {
            id: e.voiceActor.id,
            name: {
                full: e.voiceActor.name?.full || '',
                native: e.voiceActor.name?.native || undefined,
            },
            image: {
                large: e.voiceActor.image?.large || e.voiceActor.image?.medium || '',
                medium: e.voiceActor.image?.medium || '',
            },
            languageV2: e.voiceActor.languageV2 || 'Japanese',
        } : undefined,
    }));

    const staff: StaffItem[] = (item.staff?.edges || []).map((e: any) => ({
        id: e.node?.id,
        role: e.role || 'Staff',
        name: {
            full: e.node?.name?.full || 'Unknown',
            native: e.node?.name?.native || undefined,
        },
        image: {
            large: e.node?.image?.large || e.node?.image?.medium || '',
            medium: e.node?.image?.medium || '',
        },
    }));

    const relations: RelationItem[] = (item.relations?.edges || []).map((e: any) => ({
        id: e.node?.id,
        relationType: e.relationType || 'RELATED',
        type: e.node?.type || 'MANGA',
        format: e.node?.format || '',
        status: e.node?.status || '',
        title: {
            romaji: e.node?.title?.romaji || '',
            english: e.node?.title?.english || undefined,
            native: e.node?.title?.native || undefined,
        },
        coverImage: e.node?.coverImage ? {
            large: e.node?.coverImage?.large || '',
            medium: e.node?.coverImage?.medium || '',
            color: e.node?.coverImage?.color || undefined,
        } : undefined,
        bannerImage: e.node?.bannerImage || undefined,
        chapters: e.node?.chapters || null,
        episodes: e.node?.episodes || null,
        averageScore: e.node?.averageScore || null,
        startDate: e.node?.startDate ? {
            year: e.node?.startDate?.year || undefined,
        } : undefined,
    }));

    const tags: TagItem[] = (item.tags || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description || undefined,
        category: t.category || undefined,
        rank: t.rank || undefined,
        isMediaSpoiler: Boolean(t.isMediaSpoiler),
    }));

    const externalLinks: ExternalLinkItem[] = (item.externalLinks || []).map((l: any) => ({
        id: l.id,
        url: l.url,
        site: l.site,
        icon: l.icon || undefined,
        color: l.color || undefined,
    }));

    const primaryCreator = staff.find(s => ['Story & Art', 'Story', 'Original Story', 'Author'].includes(s.role)) || staff[0];

    return {
        ...base,
        author: primaryCreator ? primaryCreator.name.full : base.author,
        nativeTitle: item.title?.native,
        volumes: item.volumes || null,
        meanScore: item.meanScore || null,
        popularity: item.popularity || 0,
        favourites: item.favourites || 0,
        tags,
        characters,
        staff,
        relations,
        externalLinks,
        rankings: item.rankings || [],
    };
}

export function useTrendingManga() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTrending() {
            try {
                const response = await
                    fetch('http://127.0.0.1:3000/anilist/trending');

                if (!response.ok) {
                    console.error('API returned status', response.status);
                    setMedia([]);
                    return;
                }

                const json = await response.json();

                if (!Array.isArray(json)) {
                    console.error('Anilist API returned non-array:', json);
                    setMedia([]);
                    return;
                }

                setMedia(json.map(mapAnilistItem));
            } catch (error) {
                console.error('Failed to fetch manga', error);
                setMedia([]);
            } finally {
                setLoading(false);
            }
        }

        fetchTrending();
    }, []);

    return { media, loading };
}


export function useSeasonalManga() {
    const [seasonal, setSeasonal] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSeasonal() {
            try {
                const response = await
                    fetch('http://127.0.0.1:3000/anilist/seasonal');

                if (!response.ok) {
                    console.error('Seasonal API returned status', response.status);
                    setSeasonal([]);
                    return;
                }

                const json = await response.json();

                if (!Array.isArray(json)) {
                    console.error('Seasonal API returned non-array:', json);
                    setSeasonal([]);
                    return;
                }

                setSeasonal(json.map(mapAnilistItem));
            } catch (error) {
                console.error('Failed to fetch seasonal manga', error);
                setSeasonal([]);
            } finally {
                setLoading(false);
            }
        }

        fetchSeasonal();
    }, []);

    return { seasonal, loading: loading };
}


export function usePopularNewManga() {
    const [popularNew, setPopularNew] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPopularNew() {
            try {
                const response = await fetch('http://127.0.0.1:3000/anilist/popular-new');

                if (!response.ok) {
                    console.error('Popular New API returned status', response.status);
                    setPopularNew([]);
                    return;
                }

                const json = await response.json();

                if (!Array.isArray(json)) {
                    console.error('Popular New API returned non-array:', json);
                    setPopularNew([]);
                    return;
                }

                setPopularNew(json.map(mapAnilistItem));
            } catch (error) {
                console.error('Failed to fetch popular new manga', error);
                setPopularNew([]);
            } finally {
                setLoading(false);
            }
        }

        fetchPopularNew();
    }, []);

    return { popularNew, loading };
}

export interface SearchParams {
    q?: string;
    genre?: string;
    country?: string;
    sort?: string;
    page?: number;
    perPage?: number;
}

export async function searchMangaApi(params: SearchParams): Promise<MediaItem[]> {
    const url = new URL('http://127.0.0.1:3000/anilist/search');
    if (params.q) url.searchParams.set('q', params.q);
    if (params.genre) url.searchParams.set('genre', params.genre);
    if (params.country) url.searchParams.set('country', params.country);
    if (params.sort) url.searchParams.set('sort', params.sort);
    if (params.page) url.searchParams.set('page', String(params.page));
    if (params.perPage) url.searchParams.set('perPage', String(params.perPage));

    try {
        const res = await fetch(url.toString());
        if (!res.ok) return [];
        const json = await res.json();
        if (!Array.isArray(json)) return [];
        return json.map(mapAnilistItem);
    } catch (err) {
        console.error('Failed to search manga:', err);
        return [];
    }
}

export async function fetchGenresApi(): Promise<string[]> {
    try {
        const res = await fetch('http://127.0.0.1:3000/anilist/genres');
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json) ? json : [];
    } catch {
        return [];
    }
}

export function useTop100Manga(country?: string, genre?: string, page = 1) {
    const [top100, setTop100] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchTop100() {
            setLoading(true);
            try {
                const url = new URL('http://127.0.0.1:3000/anilist/top-100');
                url.searchParams.set('page', String(page));
                url.searchParams.set('perPage', '50');
                if (country) url.searchParams.set('country', country);
                if (genre) url.searchParams.set('genre', genre);

                const response = await fetch(url.toString());
                if (!response.ok) {
                    if (isMounted) setTop100([]);
                    return;
                }
                const json = await response.json();
                if (Array.isArray(json) && isMounted) {
                    setTop100(json.map(mapAnilistItem));
                }
            } catch (err) {
                console.error('Failed to fetch Top 100:', err);
                if (isMounted) setTop100([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchTop100();
        return () => { isMounted = false; };
    }, [country, genre, page]);

    return { top100, loading };
}

export function useLatestUpdatesManga(country?: string, genre?: string, page = 1) {
    const [updates, setUpdates] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchUpdates() {
            setLoading(true);
            try {
                const url = new URL('http://127.0.0.1:3000/anilist/latest-updates');
                url.searchParams.set('page', String(page));
                url.searchParams.set('perPage', '50');
                if (country) url.searchParams.set('country', country);
                if (genre) url.searchParams.set('genre', genre);

                const response = await fetch(url.toString());
                if (!response.ok) {
                    if (isMounted) setUpdates([]);
                    return;
                }
                const json = await response.json();
                if (Array.isArray(json) && isMounted) {
                    setUpdates(json.map(mapAnilistItem));
                }
            } catch (err) {
                console.error('Failed to fetch latest updates:', err);
                if (isMounted) setUpdates([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchUpdates();
        return () => { isMounted = false; };
    }, [country, genre, page]);

    return { updates, loading };
}

export function useUpcomingSeasonalManga() {
    const [upcoming, setUpcoming] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchUpcoming() {
            setLoading(true);
            try {
                const response = await fetch('http://127.0.0.1:3000/anilist/upcoming-seasonal');
                if (!response.ok) {
                    if (isMounted) setUpcoming([]);
                    return;
                }
                const json = await response.json();
                if (Array.isArray(json) && isMounted) {
                    setUpcoming(json.map(mapAnilistItem));
                }
            } catch (err) {
                console.error('Failed to fetch upcoming seasonal:', err);
                if (isMounted) setUpcoming([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchUpcoming();
        return () => { isMounted = false; };
    }, []);

    return { upcoming, loading };
}

export function useMangaDetail(id: string) {
    const [manga, setManga] = useState<MangaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        if (!id) {
            setLoading(false);
            return;
        }

        async function fetchDetail() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`http://127.0.0.1:3000/anilist/manga/${id}`);
                if (!response.ok) {
                    if (isMounted) {
                        setError(`Failed to fetch manga (status ${response.status})`);
                        setManga(null);
                    }
                    return;
                }
                const json = await response.json();
                if (isMounted) {
                    if (json && json.id) {
                        setManga(mapAnilistDetail(json));
                    } else {
                        setManga(null);
                        setError('Manga not found');
                    }
                }
            } catch (err: any) {
                console.error('Failed to load manga details:', err);
                if (isMounted) {
                    setError(err?.message || 'Network error');
                    setManga(null);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchDetail();
        return () => { isMounted = false; };
    }, [id]);

    return { manga, loading, error };
}


