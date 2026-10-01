import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export interface MangaDexChapterItem {
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
}

export interface ChapterPagesResult {
    chapterId: string;
    baseUrl: string;
    hash: string;
    pages: string[];
    dataSaverPages: string[];
    total: number;
}

@Injectable()
export class MangadexService {
    constructor(private readonly httpService: HttpService) { }

    private readonly cache = new Map<string, CacheEntry<any>>();

    private getCached<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > entry.ttl) return null;
        return entry.data;
    }

    private setCached<T>(key: string, data: T, ttlMs = 15 * 60 * 1000): T {
        this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
        return data;
    }

    async searchManga(title: string) {
        try {
            const response = await firstValueFrom(
                this.httpService.get('https://api.mangadex.org/manga', {
                    params: {
                        title: title,
                        'includes[]': 'cover_art',
                        limit: 10,
                        'order[followedCount]': 'desc',
                    },
                }),
            );
            return response.data;
        } catch (error) {
            console.error('MangaDex Search Error:', (error as any)?.message || error);
            throw new HttpException('Failed to fetch from MangaDex', 500);
        }
    }

    // Resolve an AniList title / ID to a MangaDex UUID with multi-title fallback
    async resolveManga(
        title: string,
        anilistId?: string,
        altTitles?: string[],
    ): Promise<{ id: string; title: string; matchedBy: string } | null> {
        if (!title && (!altTitles || altTitles.length === 0)) return null;

        const candidateTitles = [
            title,
            ...(altTitles || []),
        ]
            .filter(Boolean)
            .map((t) => t.replace(/\s*\([^)]*\)/g, '').trim())
            .filter((t, idx, arr) => t.length > 0 && arr.indexOf(t) === idx);

        const cacheKey = `resolve_${candidateTitles[0]?.toLowerCase()}_${anilistId || 'none'}`;
        const cached = this.getCached<{ id: string; title: string; matchedBy: string }>(cacheKey);
        if (cached) return cached;

        try {
            // 1. First pass: try to find exact anilistId match across candidate titles
            if (anilistId) {
                const targetAl = String(anilistId).trim();
                for (const candidate of candidateTitles.slice(0, 3)) {
                    try {
                        const response = await firstValueFrom(
                            this.httpService.get('https://api.mangadex.org/manga', {
                                params: {
                                    title: candidate,
                                    limit: 10,
                                    'order[followedCount]': 'desc',
                                },
                                headers: {
                                    'User-Agent': 'TheGrimoire/1.0 (https://the-grimoire.app)',
                                },
                            }),
                        );

                        const items: any[] = response.data?.data || [];
                        const alMatch = items.find(
                            (item) => String(item.attributes?.links?.al || '').trim() === targetAl,
                        );
                        if (alMatch) {
                            const resolvedTitle =
                                alMatch.attributes?.title?.en ||
                                alMatch.attributes?.title?.['ja-ro'] ||
                                alMatch.attributes?.title?.['ko-ro'] ||
                                Object.values(alMatch.attributes?.title || {})[0] ||
                                candidate;

                            const result = { id: alMatch.id, title: resolvedTitle as string, matchedBy: 'anilist_id' };
                            return this.setCached(cacheKey, result, 60 * 60 * 1000);
                        }
                    } catch {}
                }
            }

            // 2. Second pass: popularity search on the best available candidate title
            for (const candidate of candidateTitles.slice(0, 2)) {
                try {
                    const response = await firstValueFrom(
                        this.httpService.get('https://api.mangadex.org/manga', {
                            params: {
                                title: candidate,
                                limit: 10,
                                'order[followedCount]': 'desc',
                            },
                            headers: {
                                'User-Agent': 'TheGrimoire/1.0 (https://the-grimoire.app)',
                            },
                        }),
                    );

                    const items: any[] = response.data?.data || [];
                    if (items.length > 0) {
                        const best = items[0];
                        const resolvedTitle =
                            best.attributes?.title?.en ||
                            best.attributes?.title?.['ja-ro'] ||
                            best.attributes?.title?.['ko-ro'] ||
                            Object.values(best.attributes?.title || {})[0] ||
                            candidate;

                        const result = { id: best.id, title: resolvedTitle as string, matchedBy: 'followed_count' };
                        return this.setCached(cacheKey, result, 60 * 60 * 1000);
                    }
                } catch {}
            }

            return null;
        } catch (error) {
            console.error('MangaDex Resolve Error:', (error as any)?.message || error);
            return null;
        }
    }

    // Fetch chapters for a given MangaDex manga ID
    async getChapters(
        mangaId: string,
        params: {
            language?: string;
            order?: 'asc' | 'desc';
            limit?: number;
            offset?: number;
        } = {},
    ): Promise<{ chapters: MangaDexChapterItem[]; total: number }> {
        const lang = params.language || 'en';
        const order = params.order || 'desc';
        const limit = Math.min(params.limit || 100, 100);
        const offset = params.offset || 0;

        const cacheKey = `chapters_${mangaId}_${lang}_${order}_${limit}_${offset}`;
        const cached = this.getCached<{ chapters: MangaDexChapterItem[]; total: number }>(cacheKey);
        if (cached) return cached;

        try {
            const response = await firstValueFrom(
                this.httpService.get(`https://api.mangadex.org/manga/${mangaId}/feed`, {
                    params: {
                        'translatedLanguage[]': lang,
                        'order[chapter]': order,
                        limit,
                        offset,
                        'includes[]': 'scanlation_group',
                    },
                    headers: {
                        'User-Agent': 'TheGrimoire/1.0 (https://the-grimoire.app)',
                    },
                }),
            );

            const rawChapters: any[] = response.data?.data || [];
            const total = response.data?.total || rawChapters.length;

            const chapters: MangaDexChapterItem[] = rawChapters.map((ch: any) => {
                const groupRel = ch.relationships?.find((r: any) => r.type === 'scanlation_group');
                const groupName = groupRel?.attributes?.name || null;
                const pages = Number(ch.attributes?.pages) || 0;
                const externalUrl = ch.attributes?.externalUrl || null;
                const readable = pages > 0 && !externalUrl;

                return {
                    id: ch.id,
                    chapter: ch.attributes?.chapter || 'Oneshot',
                    volume: ch.attributes?.volume || null,
                    title: ch.attributes?.title || null,
                    pages,
                    readable,
                    externalUrl,
                    publishAt: ch.attributes?.publishAt || new Date().toISOString(),
                    scanlationGroup: groupName,
                    translatedLanguage: ch.attributes?.translatedLanguage || lang,
                };
            });

            const result = { chapters, total };
            return this.setCached(cacheKey, result, 15 * 60 * 1000);
        } catch (error) {
            console.error('MangaDex Chapters Fetch Error:', (error as any)?.message || error);
            return { chapters: [], total: 0 };
        }
    }

    // Get image URLs for a chapter using MangaDex @Home
    async getChapterPages(chapterId: string): Promise<ChapterPagesResult | null> {
        const cacheKey = `pages_${chapterId}`;
        const cached = this.getCached<ChapterPagesResult>(cacheKey);
        if (cached) return cached;

        try {
            const response = await firstValueFrom(
                this.httpService.get(`https://api.mangadex.org/at-home/server/${chapterId}`, {
                    headers: {
                        'User-Agent': 'TheGrimoire/1.0 (https://the-grimoire.app)',
                    },
                }),
            );

            const atHome = response.data;
            const baseUrl = atHome?.baseUrl;
            const hash = atHome?.chapter?.hash;
            const filenames: string[] = atHome?.chapter?.data || [];
            const dataSaverFilenames: string[] = atHome?.chapter?.dataSaver || [];

            if (!baseUrl || !hash || filenames.length === 0) {
                return null;
            }

            const pages = filenames.map((file) => `${baseUrl}/data/${hash}/${file}`);
            const dataSaverPages = dataSaverFilenames.map((file) => `${baseUrl}/data-saver/${hash}/${file}`);

            const result: ChapterPagesResult = {
                chapterId,
                baseUrl,
                hash,
                pages,
                dataSaverPages: dataSaverPages.length > 0 ? dataSaverPages : pages,
                total: pages.length,
            };

            return this.setCached(cacheKey, result, 20 * 60 * 1000);
        } catch (error) {
            console.error(`MangaDex Chapter Pages Error (${chapterId}):`, (error as any)?.message || error);
            return null;
        }
    }

    // Cover proxy
    async getCoverProxy(mangaId: string, filename: string) {
        try {
            const url = `https://uploads.mangadex.org/covers/${mangaId}/${filename}`;
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    responseType: 'stream',
                    headers: {
                        'User-Agent': 'TheGrimoire/1.0 (https://the-grimoire.app)',
                    },
                }),
            );
            return response.data;
        } catch (error) {
            throw new HttpException('Cover image not found', 404);
        }
    }

    // Generic proxy for MangaDex images to eliminate CORS / hotlinking blocks
    async getImageProxyStream(url: string): Promise<{ stream: any; contentType: string }> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    responseType: 'stream',
                    headers: {
                        'User-Agent': 'TheGrimoire/1.0 (https://the-grimoire.app)',
                    },
                }),
            );
            return {
                stream: response.data,
                contentType: (response.headers['content-type'] as string) || 'image/jpeg',
            };
        } catch (error) {
            console.error('Image proxy error:', (error as any)?.message || error);
            throw new HttpException('Failed to proxy image', 502);
        }
    }
}
