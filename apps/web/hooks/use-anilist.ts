import { useState, useEffect } from "react";
import { MediaItem } from "../lib/types";


function mapAnilistItem(item: any): MediaItem {
    // Loop through relations to see if an anime adaptation exists
    const hasAnime =
        Boolean(item.airingAnimeTitle) ||
        item.relations?.edges?.some(
            (edge: any) =>
                (edge.relationType === 'ADAPTATION' || edge.relationType === 'SOURCE') &&
                edge.node?.type === 'ANIME'
        ) || false;

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