import { useState, useEffect } from "react";
import { MediaItem } from "../lib/types";


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


