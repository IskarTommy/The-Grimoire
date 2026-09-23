import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

@Injectable()
export class AnilistService {
    constructor(private readonly httpService: HttpService) { }

    private readonly cache = new Map<string, CacheEntry<any>>();

    private getCached<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        const isExpired = Date.now() - entry.timestamp > entry.ttl;
        if (isExpired) return null;
        return entry.data;
    }

    private getStaleFallback<T>(key: string): T | null {
        const entry = this.cache.get(key);
        return entry ? entry.data : null;
    }

    private setCached<T>(key: string, data: T, ttlMs = 10 * 60 * 1000) {
        this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
    }

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

    private readonly GENRES_LIST = [
        'Action',
        'Adventure',
        'Comedy',
        'Drama',
        'Ecchi',
        'Fantasy',
        'Horror',
        'Mahou Shoujo',
        'Mecha',
        'Music',
        'Mystery',
        'Psychological',
        'Romance',
        'Sci-Fi',
        'Slice of Life',
        'Sports',
        'Supernatural',
        'Thriller',
    ];

    private async queryAniList(query: string, variables?: Record<string, any>) {
        const response = await firstValueFrom(
            this.httpService.post(
                'https://graphql.anilist.co',
                { query, variables },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'User-Agent': 'GrimoireApp/1.0',
                    },
                    timeout: 20000,
                }
            )
        );
        return response.data?.data;
    }

    async getTrending() {
        const cacheKey = 'trending_manga';
        const cached = this.getCached<any[]>(cacheKey);
        if (cached && cached.length > 0) return cached;

        try {
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

            if (results && results.length > 0) {
                this.setCached(cacheKey, results, 10 * 60 * 1000);
                return results;
            }

            return this.getStaleFallback(cacheKey) || [];
        } catch (error) {
            console.error('AniList Fetch Error:', (error as any)?.message || error);
            const stale = this.getStaleFallback<any[]>(cacheKey);
            if (stale && stale.length > 0) {
                console.warn('Returning stale cached trending data');
                return stale;
            }
            return [];
        }
    }

    async getSeasonal() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        let season: string;
        if (month >= 1 && month <= 3) season = 'WINTER';
        else if (month >= 4 && month <= 6) season = 'SPRING';
        else if (month >= 7 && month <= 9) season = 'SUMMER';
        else season = 'FALL';

        const cacheKey = `seasonal_manga_${season}_${year}`;
        const cached = this.getCached<any[]>(cacheKey);
        if (cached && cached.length > 0) return cached;

        try {
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

            if (seasonalManga && seasonalManga.length > 0) {
                this.setCached(cacheKey, seasonalManga, 15 * 60 * 1000);
                return seasonalManga;
            }

            return this.getStaleFallback(cacheKey) || [];
        } catch (error) {
            console.error('AniList Seasonal Fetch Error:', (error as any)?.message || error);
            const stale = this.getStaleFallback<any[]>(cacheKey);
            if (stale && stale.length > 0) {
                console.warn('Returning stale cached seasonal data');
                return stale;
            }
            return [];
        }
    }

    async getPopularNew() {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 3;
        const startDateGreater = `${startYear}0101`;
        const cacheKey = `popular_new_${startDateGreater}`;

        const cached = this.getCached<any[]>(cacheKey);
        if (cached && cached.length > 0) return cached;

        try {
            const query = `
                query {
                    Page(page: 1, perPage: 25) {
                        media(type: MANGA, sort: POPULARITY_DESC, startDate_greater: ${startDateGreater}) {
                            ${this.MEDIA_FIELDS}
                        }
                    }
                }
            `;

            const data = await this.queryAniList(query);
            const results = data?.Page?.media || [];

            if (results.length > 0) {
                this.setCached(cacheKey, results, 15 * 60 * 1000);
                return results;
            }

            return this.getStaleFallback(cacheKey) || [];
        } catch (error) {
            console.error('AniList Popular New Fetch Error:', (error as any)?.message || error);
            const stale = this.getStaleFallback<any[]>(cacheKey);
            if (stale && stale.length > 0) {
                console.warn('Returning stale cached popular new data');
                return stale;
            }
            return [];
        }
    }

    async searchManga(params: {
        q?: string;
        genre?: string;
        country?: string;
        sort?: string;
        page?: number;
        perPage?: number;
    }) {
        const page = Number(params.page) || 1;
        const perPage = Math.min(Number(params.perPage) || 20, 50);
        const q = params.q?.trim() || undefined;
        const genre = params.genre?.trim() || undefined;
        const country = params.country?.trim() || undefined;

        // Build sort array
        let sortList: string[] = ['POPULARITY_DESC'];
        if (params.sort) {
            sortList = [params.sort];
        } else if (q) {
            sortList = ['SEARCH_MATCH', 'POPULARITY_DESC'];
        }

        const cacheKey = `search_${q || ''}_${genre || ''}_${country || ''}_${sortList.join('_')}_${page}_${perPage}`;
        const cached = this.getCached<any[]>(cacheKey);
        if (cached) return cached;

        try {
            const query = `
                query ($search: String, $genre: String, $country: CountryCode, $sort: [MediaSort], $page: Int, $perPage: Int) {
                    Page(page: $page, perPage: $perPage) {
                        media(type: MANGA, search: $search, genre: $genre, countryOfOrigin: $country, sort: $sort, isAdult: false) {
                            ${this.MEDIA_FIELDS}
                        }
                    }
                }
            `;

            const variables: Record<string, any> = {
                page,
                perPage,
                sort: sortList,
            };
            if (q) variables.search = q;
            if (genre) variables.genre = genre;
            if (country) variables.country = country;

            const data = await this.queryAniList(query, variables);
            const results = data?.Page?.media || [];

            this.setCached(cacheKey, results, 5 * 60 * 1000);
            return results;
        } catch (error) {
            console.error('AniList Search Error:', (error as any)?.message || error);
            const stale = this.getStaleFallback<any[]>(cacheKey);
            if (stale) return stale;
            return [];
        }
    }

    getGenres() {
        return this.GENRES_LIST;
    }
}
