import { useState, useEffect } from "react";
import { MediaItem } from "../lib/types";


export function useTrendingManga() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTrending() {
            try {
                // Hit the nestjs api
                const response = await
                    fetch('http://localhost:3000/anilist/trending');
                const json = await response.json();

                // Transform Anilist format into our format
                const mappedItems: MediaItem[] =
                    json.map((item: any) => {

                        // Loop through relations to see if an anime adaptation exists
                        const hasAnime =
                            item.relations?.edges?.some(
                                (edge: any) =>
                                    edge.relationType === 'ADAPTATION' &&
                                    edge.node?.type === 'ANIME'

                            ) || false;

                        return {
                            id: String(item.id),
                            title: item.title.english || item.title.romaji,
                            author: 'Various',
                            cover: item.coverImage.extraLarge,
                            type: 'MANGA',
                            status: item.status === 'RELEASING' ? 'ONGOING' :
                                'COMPLETED',
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
                        };

                    });

                setMedia(mappedItems);

            } catch (error) {
                console.error('Failed to fetch manga', error);
            } finally {
                setLoading(false);
            }
        }

        fetchTrending();
    }, []);

    return { media, loading };
}