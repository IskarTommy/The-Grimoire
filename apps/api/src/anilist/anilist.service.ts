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

    public detectHasAnime(item: any): boolean {
        if (!item) return false;
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

    public enrichWithAnimeFlags<T extends any>(data: T): T {
        if (!data) return data;
        if (Array.isArray(data)) {
            for (const item of data) {
                if (item && typeof item === 'object') {
                    item.hasAnime = this.detectHasAnime(item);
                }
            }
            return data;
        }
        if (typeof data === 'object') {
            (data as any).hasAnime = this.detectHasAnime(data);
        }
        return data;
    }

    private setCached<T>(key: string, data: T, ttlMs = 10 * 60 * 1000) {
        const enriched = this.enrichWithAnimeFlags(data);
        this.cache.set(key, { data: enriched, timestamp: Date.now(), ttl: ttlMs });
        return enriched;
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
                node {
                    id
                    type
                }
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

    public getCurrentAnimeSeason(date: Date = new Date()) {
        const month = date.getMonth() + 1; // 1 - 12
        const day = date.getDate();
        const year = date.getFullYear();

        let season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
        let seasonYear = year;
        let nextSeason: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
        let nextYear = year;

        // Broadcast anime season transitions in Japan typically start 7-10 days before quarter end:
        // Fall:   Sep 22 - Dec 21
        // Winter: Dec 22 - Mar 21 (late Dec begins the upcoming year's Winter season)
        // Spring: Mar 22 - Jun 21
        // Summer: Jun 22 - Sep 21
        if ((month === 12 && day >= 22) || month === 1 || month === 2 || (month === 3 && day < 22)) {
            season = 'WINTER';
            seasonYear = (month === 12) ? year + 1 : year;
            nextSeason = 'SPRING';
            nextYear = seasonYear;
        } else if ((month === 3 && day >= 22) || month === 4 || month === 5 || (month === 6 && day < 22)) {
            season = 'SPRING';
            seasonYear = year;
            nextSeason = 'SUMMER';
            nextYear = year;
        } else if ((month === 6 && day >= 22) || month === 7 || month === 8 || (month === 9 && day < 22)) {
            season = 'SUMMER';
            seasonYear = year;
            nextSeason = 'FALL';
            nextYear = year;
        } else {
            season = 'FALL';
            seasonYear = year;
            nextSeason = 'WINTER';
            nextYear = year + 1;
        }

        return {
            season,
            year: seasonYear,
            nextSeason,
            nextYear,
        };
    }

    async getSeasonal() {
        const now = new Date();
        const seasonInfo = this.getCurrentAnimeSeason(now);
        const { season, year } = seasonInfo;

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
                            status
                            startDate { year month day }
                            nextAiringEpisode { episode airingAt }
                            isAdult
                            genres
                            relations {
                                edges {
                                    relationType(version: 2)
                                    node {
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
                                    }
                                }
                            }
                        }
                    }
                    p2: Page(page: 2, perPage: 50) {
                        media(type: ANIME, season: $s, seasonYear: $y, isAdult: false, sort: POPULARITY_DESC) {
                            id
                            title { romaji english }
                            status
                            startDate { year month day }
                            nextAiringEpisode { episode airingAt }
                            isAdult
                            genres
                            relations {
                                edges {
                                    relationType(version: 2)
                                    node {
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
                // Prune anime that have completed broadcast (status: FINISHED)
                if (anime.status === 'FINISHED') continue;

                // Determine airing timeline badge
                let airingBadge = 'Airing Now';
                if (anime.status === 'RELEASING') {
                    if (anime.startDate?.year && anime.startDate?.month && anime.startDate?.day) {
                        const start = new Date(anime.startDate.year, anime.startDate.month - 1, anime.startDate.day);
                        const diffDays = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays >= 0 && diffDays <= 7) {
                            airingBadge = 'Aired This Week';
                        } else {
                            airingBadge = 'Currently Airing';
                        }
                    } else {
                        airingBadge = 'Currently Airing';
                    }
                } else if (anime.status === 'NOT_YET_RELEASED') {
                    if (anime.startDate?.year && anime.startDate?.month && anime.startDate?.day) {
                        const start = new Date(anime.startDate.year, anime.startDate.month - 1, anime.startDate.day);
                        const diffDays = Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays <= 7 && diffDays >= 0) {
                            airingBadge = 'Starts Next Week';
                        } else if (diffDays <= 14 && diffDays > 7) {
                            airingBadge = `Starts in ${diffDays}d`;
                        } else {
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            airingBadge = `Starts ${monthNames[anime.startDate.month - 1]} ${anime.startDate.day}`;
                        }
                    } else {
                        airingBadge = 'Starts Soon';
                    }
                }

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
                            animeStatus: anime.status,
                            animeStartDate: anime.startDate,
                            airingBadge,
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

        // When "Latest Drops" is selected, delegate to the authentic ongoing multi-origin updates engine!
        if (params.sort === 'UPDATED_AT_DESC' && !q) {
            return this.getLatestUpdates({ page, perPage, country, genre });
        }

        // When "Trending Now" is selected without text query or country/genre filters, use fast cached trending feed
        if (params.sort === 'TRENDING_DESC' && !q && !genre && !country) {
            const trending = await this.getTrending();
            if (trending && trending.length > 0) {
                const startIdx = (page - 1) * perPage;
                const slice = trending.slice(startIdx, startIdx + perPage);
                if (slice.length > 0) return slice;
            }
        }

        // Build sort array
        let sortList: string[] = ['POPULARITY_DESC'];
        if (params.sort) {
            if (params.sort === 'TRENDING_DESC') {
                sortList = ['TRENDING_DESC', 'POPULARITY_DESC'];
            } else if (params.sort === 'UPDATED_AT_DESC') {
                sortList = ['UPDATED_AT_DESC', 'POPULARITY_DESC'];
            } else {
                sortList = [params.sort];
            }
        } else if (q) {
            sortList = ['SEARCH_MATCH', 'POPULARITY_DESC'];
        }

        const cacheKey = `search_${q || ''}_${genre || ''}_${country || ''}_${sortList.join('_')}_${page}_${perPage}`;
        const cached = this.getCached<any[]>(cacheKey);
        if (cached) return cached;

        try {
            const queryParams: string[] = ['$page: Int', '$perPage: Int', '$sort: [MediaSort]'];
            // Note: omitting isAdult from GraphQL args prevents AniList unindexed full-table scan timeouts (>20s)
            const mediaArgs: string[] = ['type: MANGA', 'sort: $sort'];
            const variables: Record<string, any> = { page, perPage, sort: sortList };

            if (q) {
                queryParams.push('$search: String');
                mediaArgs.push('search: $search');
                variables.search = q;
            }
            if (genre) {
                queryParams.push('$genre: String');
                mediaArgs.push('genre: $genre');
                variables.genre = genre;
            }
            if (country) {
                queryParams.push('$country: CountryCode');
                mediaArgs.push('countryOfOrigin: $country');
                variables.country = country;
            }

            const query = `
                query (${queryParams.join(', ')}) {
                    Page(page: $page, perPage: $perPage) {
                        media(${mediaArgs.join(', ')}) {
                            ${this.MEDIA_FIELDS}
                        }
                    }
                }
            `;

            let data = await this.queryAniList(query, variables);
            let rawResults = data?.Page?.media || [];

            // If TRENDING_DESC returned empty, fallback to POPULARITY_DESC
            if (rawResults.length === 0 && params.sort === 'TRENDING_DESC') {
                const fallbackVars = { ...variables, sort: ['POPULARITY_DESC'] };
                const fbData = await this.queryAniList(query, fallbackVars);
                rawResults = fbData?.Page?.media || [];
            }

            const results = rawResults.filter((item: any) => !item.isAdult);

            this.setCached(cacheKey, results, 5 * 60 * 1000);
            return results;
        } catch (error) {
            console.error('AniList Search Error:', (error as any)?.message || error);
            // If error was on TRENDING_DESC, try POPULARITY_DESC before giving up
            if (params.sort === 'TRENDING_DESC') {
                try {
                    const fallbackQuery = `
                        query ($page: Int, $perPage: Int) {
                            Page(page: $page, perPage: $perPage) {
                                media(type: MANGA, sort: POPULARITY_DESC) {
                                    ${this.MEDIA_FIELDS}
                                }
                            }
                        }
                    `;
                    const fbData = await this.queryAniList(fallbackQuery, { page, perPage });
                    const results = (fbData?.Page?.media || []).filter((item: any) => !item.isAdult);
                    if (results.length > 0) {
                        this.setCached(cacheKey, results, 5 * 60 * 1000);
                        return results;
                    }
                } catch { }
            }
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
            const queryParams: string[] = ['$page: Int', '$perPage: Int'];
            const mediaArgs: string[] = ['type: MANGA', 'sort: SCORE_DESC', 'isAdult: false'];
            const variables: Record<string, any> = { page, perPage };

            if (country) {
                queryParams.push('$country: CountryCode');
                mediaArgs.push('countryOfOrigin: $country');
                variables.country = country;
            }
            if (genre) {
                queryParams.push('$genre: String');
                mediaArgs.push('genre: $genre');
                variables.genre = genre;
            }

            const query = `
                query (${queryParams.join(', ')}) {
                    Page(page: $page, perPage: $perPage) {
                        media(${mediaArgs.join(', ')}) {
                            ${this.MEDIA_FIELDS}
                        }
                    }
                }
            `;

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
        const cacheKey = `manga_detail_v2_${id}`;
        const cached = this.getCached<any>(cacheKey);
        if (cached) return cached;

        try {
            const query = `
                query ($id: Int) {
                    Media(id: $id, type: MANGA) {
                        id
                        title { romaji english native }
                        coverImage { extraLarge large color }
                        bannerImage
                        countryOfOrigin
                        description(asHtml: false)
                        status
                        chapters
                        volumes
                        averageScore
                        meanScore
                        popularity
                        favourites
                        genres
                        tags {
                            id
                            name
                            description
                            category
                            rank
                            isMediaSpoiler
                        }
                        startDate { year month day }
                        endDate { year month day }
                        rankings {
                            id
                            rank
                            type
                            allTime
                            context
                            year
                        }
                        characters(sort: [ROLE, RELEVANCE, ID], perPage: 24) {
                            edges {
                                role
                                node {
                                    id
                                    name { full native alternative }
                                    image { large medium }
                                }
                            }
                        }
                        staff(sort: [RELEVANCE, ID], perPage: 16) {
                            edges {
                                role
                                node {
                                    id
                                    name { full native }
                                    image { large medium }
                                }
                            }
                        }
                        relations {
                            edges {
                                relationType(version: 2)
                                node {
                                    id
                                    type
                                    format
                                    status
                                    title { romaji english native }
                                    coverImage { large medium color }
                                    bannerImage
                                    chapters
                                    episodes
                                    averageScore
                                    startDate { year }
                                }
                            }
                        }
                        externalLinks {
                            id
                            url
                            site
                            icon
                            color
                        }
                    }
                }
            `;
            const data = await this.queryAniList(query, { id });
            const manga = data?.Media;
            if (!manga) return null;

            // Enrich manga with anime detection flag
            manga.hasAnime = this.detectHasAnime(manga);

            // If an anime adaptation exists, fetch voice actors for the manga's characters
            const animeRelation = manga.relations?.edges?.find(
                (e: any) => e.node?.type === 'ANIME' && ['ADAPTATION', 'ALTERNATIVE', 'PARENT'].includes(e.relationType)
            );

            if (animeRelation?.node?.id) {
                const animeId = animeRelation.node.id;
                const animeVaQuery = `
                    query ($id: Int) {
                        Media(id: $id, type: ANIME) {
                            characters(sort: [ROLE, RELEVANCE, ID], perPage: 30) {
                                edges {
                                    node { id }
                                    voiceActors(language: JAPANESE) {
                                        id
                                        name { full native }
                                        image { large medium }
                                        languageV2
                                    }
                                }
                            }
                        }
                    }
                `;
                try {
                    const animeData = await this.queryAniList(animeVaQuery, { id: animeId });
                    const vaMap = new Map<number, any>();
                    for (const edge of animeData?.Media?.characters?.edges || []) {
                        if (edge.node?.id && Array.isArray(edge.voiceActors) && edge.voiceActors.length > 0) {
                            vaMap.set(edge.node.id, edge.voiceActors[0]);
                        }
                    }

                    for (const charEdge of manga.characters?.edges || []) {
                        const va = vaMap.get(charEdge.node?.id);
                        if (va) {
                            charEdge.voiceActor = va;
                        }
                    }
                } catch (vaErr) {
                    console.warn(`Could not enrich anime voice actors for manga ${id}:`, (vaErr as any)?.message || vaErr);
                }
            }

            this.setCached(cacheKey, manga, 30 * 60 * 1000);
            return manga;
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

        const cacheKey = `latest_updates_v2_${page}_${perPage}_${country || 'all'}_${genre || 'all'}`;
        const cached = this.getCached<any[]>(cacheKey);
        if (cached) return cached;

        try {
            // Case 1: Specific Country requested (e.g. user clicked KR Manhwa, CN Manhua, or JP Manga)
            if (country) {
                const queryParams = ['$page: Int', '$perPage: Int', '$country: CountryCode'];
                const mediaArgs = ['type: MANGA', 'status: RELEASING', 'countryOfOrigin: $country', 'sort: [UPDATED_AT_DESC, POPULARITY_DESC]', 'isAdult: false'];
                const variables: Record<string, any> = { page, perPage, country };

                if (genre) {
                    queryParams.push('$genre: String');
                    mediaArgs.push('genre: $genre');
                    variables.genre = genre;
                }

                const query = `
                    query (${queryParams.join(', ')}) {
                        Page(page: $page, perPage: $perPage) {
                            media(${mediaArgs.join(', ')}) {
                                ${this.MEDIA_FIELDS}
                            }
                        }
                    }
                `;

                let data = await this.queryAniList(query, variables);
                let results = data?.Page?.media || [];

                // Fallback to POPULARITY_DESC if UPDATED_AT_DESC returned empty or failed
                if (results.length === 0) {
                    const fallbackVars = { ...variables, sort: ['POPULARITY_DESC'] };
                    const fallbackArgs = ['type: MANGA', 'status: RELEASING', 'countryOfOrigin: $country', 'sort: [POPULARITY_DESC]', 'isAdult: false'];
                    if (genre) fallbackArgs.push('genre: $genre');
                    const fallbackQuery = `
                        query (${queryParams.join(', ')}) {
                            Page(page: $page, perPage: $perPage) {
                                media(${fallbackArgs.join(', ')}) {
                                    ${this.MEDIA_FIELDS}
                                }
                            }
                        }
                    `;
                    const fbData = await this.queryAniList(fallbackQuery, fallbackVars);
                    results = fbData?.Page?.media || [];
                }

                if (results.length > 0) {
                    this.setCached(cacheKey, results, 15 * 60 * 1000);
                    return results;
                }
                return this.getStaleFallback(cacheKey) || [];
            }

            // Case 2: "All Origins" requested - Balanced representation of Manga (JP), Manhwa (KR), and Manhua (CN)
            // Query active ongoing series across all 3 regions sorted by recently updated chapters/releases
            const perOrigin = Math.max(Math.floor(perPage / 3), 10);
            const genreVar = genre ? ', $genre: String' : '';
            const genreArg = genre ? ', genre: $genre' : '';
            const variables: Record<string, any> = { page, perOrigin };
            if (genre) variables.genre = genre;

            const balancedQuery = `
                query ($page: Int, $perOrigin: Int${genreVar}) {
                    kr: Page(page: $page, perPage: $perOrigin) {
                        media(type: MANGA, countryOfOrigin: "KR", status: RELEASING, sort: [UPDATED_AT_DESC, POPULARITY_DESC], isAdult: false${genreArg}) {
                            ${this.MEDIA_FIELDS}
                        }
                    }
                    jp: Page(page: $page, perPage: $perOrigin) {
                        media(type: MANGA, countryOfOrigin: "JP", status: RELEASING, sort: [UPDATED_AT_DESC, POPULARITY_DESC], isAdult: false${genreArg}) {
                            ${this.MEDIA_FIELDS}
                        }
                    }
                    cn: Page(page: $page, perPage: $perOrigin) {
                        media(type: MANGA, countryOfOrigin: "CN", status: RELEASING, sort: [UPDATED_AT_DESC, POPULARITY_DESC], isAdult: false${genreArg}) {
                            ${this.MEDIA_FIELDS}
                        }
                    }
                }
            `;

            let data = await this.queryAniList(balancedQuery, variables);
            let krList: any[] = data?.kr?.media || [];
            let jpList: any[] = data?.jp?.media || [];
            let cnList: any[] = data?.cn?.media || [];

            // If any region returned 0, fallback with POPULARITY_DESC
            if (krList.length === 0 || jpList.length === 0) {
                const fallbackQuery = `
                    query ($page: Int, $perOrigin: Int${genreVar}) {
                        kr: Page(page: $page, perPage: $perOrigin) {
                            media(type: MANGA, countryOfOrigin: "KR", status: RELEASING, sort: [POPULARITY_DESC], isAdult: false${genreArg}) {
                                ${this.MEDIA_FIELDS}
                            }
                        }
                        jp: Page(page: $page, perPage: $perOrigin) {
                            media(type: MANGA, countryOfOrigin: "JP", status: RELEASING, sort: [POPULARITY_DESC], isAdult: false${genreArg}) {
                                ${this.MEDIA_FIELDS}
                            }
                        }
                        cn: Page(page: $page, perPage: $perOrigin) {
                            media(type: MANGA, countryOfOrigin: "CN", status: RELEASING, sort: [POPULARITY_DESC], isAdult: false${genreArg}) {
                                ${this.MEDIA_FIELDS}
                            }
                        }
                    }
                `;
                const fbData = await this.queryAniList(fallbackQuery, variables);
                if (krList.length === 0) krList = fbData?.kr?.media || [];
                if (jpList.length === 0) jpList = fbData?.jp?.media || [];
                if (cnList.length === 0) cnList = fbData?.cn?.media || [];
            }

            // Interleave/round-robin: JP, KR, CN, JP, KR, CN...
            const combined: any[] = [];
            const maxLen = Math.max(krList.length, jpList.length, cnList.length);
            const seenIds = new Set<number>();

            for (let i = 0; i < maxLen; i++) {
                if (i < jpList.length && !seenIds.has(jpList[i].id)) {
                    seenIds.add(jpList[i].id);
                    combined.push(jpList[i]);
                }
                if (i < krList.length && !seenIds.has(krList[i].id)) {
                    seenIds.add(krList[i].id);
                    combined.push(krList[i]);
                }
                if (i < cnList.length && !seenIds.has(cnList[i].id)) {
                    seenIds.add(cnList[i].id);
                    combined.push(cnList[i]);
                }
            }

            if (combined.length > 0) {
                this.setCached(cacheKey, combined, 15 * 60 * 1000);
                return combined;
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
        const seasonInfo = this.getCurrentAnimeSeason(now);
        const { nextSeason, nextYear } = seasonInfo;

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
                            status
                            startDate { year month day }
                            isAdult
                            genres
                            relations {
                                edges {
                                    relationType(version: 2)
                                    node {
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
                                    }
                                }
                            }
                        }
                    }
                    p2: Page(page: 2, perPage: 50) {
                        media(type: ANIME, season: $season, seasonYear: $year, isAdult: false, sort: POPULARITY_DESC) {
                            id
                            title { english romaji }
                            status
                            startDate { year month day }
                            isAdult
                            genres
                            relations {
                                edges {
                                    relationType(version: 2)
                                    node {
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
                if (anime.status === 'FINISHED') continue;

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
                            animeStatus: anime.status,
                            upcomingSeason: `${nextSeason} ${nextYear}`,
                            airingBadge: 'Upcoming Next Season',
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
