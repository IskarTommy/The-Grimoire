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
        format
        isAdult
        relations {
            edges {
                relationType(version: 2)
                node { type format status isAdult genres }
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

        const cacheKey = `seasonal_manga_pure_${season}_${year}`;
        const cached = this.getCached<any[]>(cacheKey);
        if (cached && cached.length > 0) return cached;

        try {
            const query = `
                query ($s: MediaSeason, $y: Int) {
                    p1: Page(page: 1, perPage: 50) {
                        media(type: ANIME, season: $s, seasonYear: $y, isAdult: false, sort: POPULARITY_DESC) {
                            id
                            title { romaji english }
                            isAdult
                            genres
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
                    p2: Page(page: 2, perPage: 50) {
                        media(type: ANIME, season: $s, seasonYear: $y, isAdult: false, sort: POPULARITY_DESC) {
                            id
                            title { romaji english }
                            isAdult
                            genres
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
            const data = await this.queryAniList(query, { s: season, y: year });
            const airingAnime = [...(data?.p1?.media || []), ...(data?.p2?.media || [])];
            const mangaList: any[] = [];
            const seenIds = new Set<number>();
            const seenTitles = new Set<string>();

            for (const anime of airingAnime) {
                if (anime.isAdult || anime.genres?.includes('Hentai')) continue;
                const edges = anime.relations?.edges || [];
                const mangaEdges = edges.filter(
                    (e: any) => {
                        const n = e.node;
                        if (!n || n.type !== 'MANGA') return false;
                        if (n.format === 'NOVEL') return false; // Exclude Light Novels
                        if (n.isAdult || n.genres?.includes('Hentai')) return false; // Strictly non-adult
                        return ['SOURCE', 'ADAPTATION', 'ALTERNATIVE', 'PARENT'].includes(e.relationType);
                    }
                );

                // Prioritize SOURCE over others
                mangaEdges.sort((a: any, b: any) => {
                    if (a.relationType === 'SOURCE' && b.relationType !== 'SOURCE') return -1;
                    if (b.relationType === 'SOURCE' && a.relationType !== 'SOURCE') return 1;
                    return 0;
                });

                for (const edge of mangaEdges) {
                    const titleKey = (edge.node.title?.english || edge.node.title?.romaji || '').toLowerCase().trim();
                    if (!seenIds.has(edge.node.id) && (!titleKey || !seenTitles.has(titleKey))) {
                        seenIds.add(edge.node.id);
                        if (titleKey) seenTitles.add(titleKey);
                        mangaList.push({
                            ...edge.node,
                            airingAnimeTitle: anime.title.english || anime.title.romaji,
                            currentSeason: `${season} ${year}`,
                        });
                        break; // 1 primary manga per anime adaptation
                    }
                }
            }

            if (mangaList && mangaList.length > 0) {
                this.setCached(cacheKey, mangaList, 30 * 60 * 1000);
                return mangaList;
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
                        media(type: MANGA, sort: POPULARITY_DESC, startDate_greater: ${startDateGreater}, isAdult: false) {
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

    async getTop100(params: { page?: number; perPage?: number; country?: string; genre?: string }) {
        const page = Number(params.page) || 1;
        const perPage = Math.min(Number(params.perPage) || 50, 50);
        const country = params.country?.trim() || undefined;
        const genre = params.genre?.trim() || undefined;

        const cacheKey = `top100_${page}_${perPage}_${country || 'all'}_${genre || 'all'}`;
        const cached = this.getCached<any[]>(cacheKey);
        if (cached) return cached;

        try {
            const query = `
                query ($page: Int, $perPage: Int, $country: CountryCode, $genre: String) {
                    Page(page: $page, perPage: $perPage) {
                        media(type: MANGA, sort: SCORE_DESC, countryOfOrigin: $country, genre: $genre, isAdult: false) {
                            ${this.MEDIA_FIELDS}
                        }
                    }
                }
            `;

            const variables: Record<string, any> = { page, perPage };
            if (country) variables.country = country;
            if (genre) variables.genre = genre;

            const data = await this.queryAniList(query, variables);
            const results = data?.Page?.media || [];

            if (results.length > 0) {
                this.setCached(cacheKey, results, 30 * 60 * 1000);
                return results;
            }

            return this.getStaleFallback(cacheKey) || [];
        } catch (error) {
            console.error('AniList Top 100 Fetch Error:', (error as any)?.message || error);
            const stale = this.getStaleFallback<any[]>(cacheKey);
            if (stale) return stale;
            return [];
        }
    }

    async getMangaById(id: number) {
        const cacheKey = `manga_detail_${id}`;
        const cached = this.getCached<any>(cacheKey);
        if (cached) return cached;

        try {
            const query = `
                query ($id: Int) {
                    Media(id: $id, type: MANGA) {
                        ${this.MEDIA_FIELDS}
                    }
                }
            `;
            const data = await this.queryAniList(query, { id });
            const result = data?.Media;
            if (result) {
                this.setCached(cacheKey, result, 30 * 60 * 1000);
                return result;
            }
            return null;
        } catch (error) {
            console.error('AniList Manga By ID Fetch Error:', (error as any)?.message || error);
            const stale = this.getStaleFallback<any>(cacheKey);
            if (stale) return stale;
            return null;
        }
    }

    async getLatestUpdates(params: { page?: number; perPage?: number; country?: string; genre?: string }) {
        const page = Number(params.page) || 1;
        const perPage = Math.min(Number(params.perPage) || 50, 50);
        const country = params.country?.trim() || undefined;
        const genre = params.genre?.trim() || undefined;

        const cacheKey = `latest_updates_${page}_${perPage}_${country || 'all'}_${genre || 'all'}`;
        const cached = this.getCached<any[]>(cacheKey);
        if (cached) return cached;

        try {
            const query = `
                query ($page: Int, $perPage: Int, $country: CountryCode, $genre: String) {
                    Page(page: $page, perPage: $perPage) {
                        media(type: MANGA, sort: [UPDATED_AT_DESC], status: RELEASING, countryOfOrigin: $country, genre: $genre, isAdult: false) {
                            ${this.MEDIA_FIELDS}
                        }
                    }
                }
            `;

            const variables: Record<string, any> = { page, perPage };
            if (country) variables.country = country;
            if (genre) variables.genre = genre;

            const data = await this.queryAniList(query, variables);
            const results = data?.Page?.media || [];

            if (results.length > 0) {
                this.setCached(cacheKey, results, 10 * 60 * 1000);
                return results;
            }

            return this.getStaleFallback(cacheKey) || [];
        } catch (error) {
            console.error('AniList Latest Updates Fetch Error:', (error as any)?.message || error);
            const stale = this.getStaleFallback<any[]>(cacheKey);
            if (stale) return stale;
            return [];
        }
    }

    async getUpcomingSeasonal() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        let nextSeason: string;
        let nextYear = year;
        if (month >= 1 && month <= 3) {
            nextSeason = 'SPRING';
        } else if (month >= 4 && month <= 6) {
            nextSeason = 'SUMMER';
        } else if (month >= 7 && month <= 9) {
            nextSeason = 'FALL';
        } else {
            nextSeason = 'WINTER';
            nextYear = year + 1;
        }

        const cacheKey = `upcoming_seasonal_pure_${nextSeason}_${nextYear}`;
        const cached = this.getCached<any[]>(cacheKey);
        if (cached && cached.length > 0) return cached;

        try {
            const query = `
                query ($season: MediaSeason, $year: Int) {
                    p1: Page(page: 1, perPage: 50) {
                        media(type: ANIME, season: $season, seasonYear: $year, isAdult: false, sort: POPULARITY_DESC) {
                            id
                            title { english romaji }
                            isAdult
                            genres
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
                    p2: Page(page: 2, perPage: 50) {
                        media(type: ANIME, season: $season, seasonYear: $year, isAdult: false, sort: POPULARITY_DESC) {
                            id
                            title { english romaji }
                            isAdult
                            genres
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

            const data = await this.queryAniList(query, { season: nextSeason, year: nextYear });
            const upcomingAnime = [...(data?.p1?.media || []), ...(data?.p2?.media || [])];

            const mangaList: any[] = [];
            const seenIds = new Set<number>();
            const seenTitles = new Set<string>();

            for (const anime of upcomingAnime) {
                if (anime.isAdult || anime.genres?.includes('Hentai')) continue;
                const edges = anime.relations?.edges || [];
                const mangaEdges = edges.filter(
                    (e: any) => {
                        const n = e.node;
                        if (!n || n.type !== 'MANGA') return false;
                        if (n.format === 'NOVEL') return false; // Strictly Manga, no Light Novels
                        if (n.isAdult || n.genres?.includes('Hentai')) return false; // No Adult / Hentai
                        return ['SOURCE', 'ADAPTATION', 'ALTERNATIVE', 'PARENT'].includes(e.relationType);
                    }
                );

                // Prioritize SOURCE over other relation types
                mangaEdges.sort((a: any, b: any) => {
                    if (a.relationType === 'SOURCE' && b.relationType !== 'SOURCE') return -1;
                    if (b.relationType === 'SOURCE' && a.relationType !== 'SOURCE') return 1;
                    return 0;
                });

                for (const edge of mangaEdges) {
                    const titleKey = (edge.node.title?.english || edge.node.title?.romaji || '').toLowerCase().trim();
                    if (!seenIds.has(edge.node.id) && (!titleKey || !seenTitles.has(titleKey))) {
                        seenIds.add(edge.node.id);
                        if (titleKey) seenTitles.add(titleKey);
                        mangaList.push({
                            ...edge.node,
                            airingAnimeTitle: anime.title.english || anime.title.romaji,
                            upcomingSeason: `${nextSeason} ${nextYear}`,
                        });
                        break; // 1 primary manga per anime adaptation to eliminate duplicate cards
                    }
                }
            }

            if (mangaList.length > 0) {
                this.setCached(cacheKey, mangaList, 60 * 60 * 1000);
                return mangaList;
            }

            return this.getStaleFallback(cacheKey) || [];
        } catch (error) {
            console.error('AniList Upcoming Seasonal Fetch Error:', (error as any)?.message || error);
            const stale = this.getStaleFallback<any[]>(cacheKey);
            if (stale) return stale;
            return [];
        }
    }

    getGenres() {
        return this.GENRES_LIST;
    }
}
