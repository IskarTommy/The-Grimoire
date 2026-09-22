import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AnilistService {
    // Inject the HttpService so we can make network requests
    constructor(private readonly httpService: HttpService) { }

    private readonly MEDIA_FIELDS = `
        id
        title { romaji english }
        coverImage { extraLarge color }
        bannerImage
        countryOfOrigin
        description(asHtml: false)
        status
        chapters
        averageScore
        genres
        type
        relations {
            edges {
                relationType(version: 2)
                node { type format status }
            }
        }
    `;

    private async queryAniList(query: string) {
        const response = await firstValueFrom(
            this.httpService.post(
                'https://graphql.anilist.co',
                { query },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'User-Agent': 'GrimoireApp/1.0',
                    },
                    timeout: 10000,
                })
        );
        return response.data.data;
    }

    async getTrending() {
        try {
            // Try TRENDING_DESC first, fall back to POPULARITY_DESC if empty
            const trendingQuery = `
                query {
                    Page(page: 1, perPage: 50) {
                        media(type: MANGA, sort: TRENDING_DESC) {
                            ${this.MEDIA_FIELDS}
                        }
                    }
                }
            `;

            const data = await this.queryAniList(trendingQuery);
            let results = data?.Page?.media;

            // AniList's trending can sometimes return empty — fall back to popularity
            if (!results || results.length === 0) {
                console.warn('TRENDING_DESC returned empty, falling back to POPULARITY_DESC');
                const fallbackQuery = `
                    query {
                        Page(page: 1, perPage: 50) {
                            media(type: MANGA, sort: POPULARITY_DESC) {
                                ${this.MEDIA_FIELDS}
                            }
                        }
                    }
                `;
                const fallbackData = await this.queryAniList(fallbackQuery);
                results = fallbackData?.Page?.media;
            }

            return results || [];
        } catch (error) {
            console.error('AniList Fetch Error:', error);
            throw new HttpException('Failed to fetch from AniList', 500);
        }
    }

    async getSeasonal() {
        try {
            // Determine current anime season
            const now = new Date();
            const month = now.getMonth() + 1; // 1-12
            const year = now.getFullYear();
            let season: string;
            if (month >= 1 && month <= 3) season = 'WINTER';
            else if (month >= 4 && month <= 6) season = 'SPRING';
            else if (month >= 7 && month <= 9) season = 'SUMMER';
            else season = 'FALL';

            // Function to query anime and extract source manga
            const fetchSeasonManga = async (s: string, y: number) => {
                const query = `
                    query {
                        Page(page: 1, perPage: 30) {
                            media(type: ANIME, season: ${s}, seasonYear: ${y}, sort: POPULARITY_DESC) {
                                id
                                title { romaji english }
                                coverImage { extraLarge }
                                source
                                relations {
                                    edges {
                                        relationType(version: 2)
                                        node {
                                            ${this.MEDIA_FIELDS}
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;
                const data = await this.queryAniList(query);
                const airingAnime = data?.Page?.media || [];
                const mangaList: any[] = [];
                const seenIds = new Set<number>();

                for (const anime of airingAnime) {
                    const edges = anime.relations?.edges || [];
                    const sourceEdges = edges.filter(
                        (e: any) =>
                            (e.relationType === 'SOURCE' || e.relationType === 'ADAPTATION') &&
                            e.node?.type === 'MANGA'
                    );
                    for (const edge of sourceEdges) {
                        if (!seenIds.has(edge.node.id)) {
                            seenIds.add(edge.node.id);
                            mangaList.push({
                                ...edge.node,
                                airingAnimeTitle: anime.title.english || anime.title.romaji,
                            });
                        }
                    }
                }
                return mangaList;
            };

            let seasonalManga = await fetchSeasonManga(season, year);

            // If season transition has few titles, also check adjacent season
            if (seasonalManga.length < 5) {
                const nextSeason = season === 'SUMMER' ? 'FALL' : season === 'WINTER' ? 'SPRING' : season === 'SPRING' ? 'SUMMER' : 'WINTER';
                const nextYear = season === 'FALL' ? year + 1 : year;
                const nextSeasonManga = await fetchSeasonManga(nextSeason, nextYear);
                const seenIds = new Set(seasonalManga.map((m: any) => m.id));
                for (const item of nextSeasonManga) {
                    if (!seenIds.has(item.id)) {
                        seenIds.add(item.id);
                        seasonalManga.push(item);
                    }
                }
            }

            return seasonalManga;
        } catch (error) {
            console.error('AniList Seasonal Fetch Error:', error);
            throw new HttpException('Failed to fetch seasonal from AniList', 500);
        }
    }
}
