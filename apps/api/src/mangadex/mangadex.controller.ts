import {
    Controller,
    Get,
    Query,
    Param,
    StreamableFile,
    Res,
    BadRequestException,
} from '@nestjs/common';
import { MangadexService } from './mangadex.service';

@Controller('mangadex')
export class MangadexController {
    constructor(private readonly mangadexService: MangadexService) { }

    @Get('search')
    async search(@Query('title') title: string) {
        if (!title) {
            return { error: 'Please provide a title to search for!' };
        }
        return this.mangadexService.searchManga(title);
    }

    // Resolve an AniList title and ID to MangaDex UUID
    @Get('resolve')
    async resolve(
        @Query('title') title: string,
        @Query('anilistId') anilistId?: string,
        @Query('altTitles') altTitles?: string,
    ) {
        if (!title && !altTitles) {
            throw new BadRequestException('Title or altTitles query parameter is required');
        }
        const parsedAlts = altTitles
            ? altTitles.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
        return this.mangadexService.resolveManga(title, anilistId, parsedAlts);
    }

    // Get chapter list for a manga
    @Get('manga/:mangaId/chapters')
    async getChapters(
        @Param('mangaId') mangaId: string,
        @Query('order') order?: 'asc' | 'desc',
        @Query('language') language?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.mangadexService.getChapters(mangaId, {
            order: order === 'asc' ? 'asc' : 'desc',
            language: language || 'en',
            limit: limit ? Number(limit) : 100,
            offset: offset ? Number(offset) : 0,
        });
    }

    // Get chapter image pages from MangaDex @Home
    @Get('chapter/:chapterId/pages')
    async getChapterPages(@Param('chapterId') chapterId: string) {
        return this.mangadexService.getChapterPages(chapterId);
    }

    // Proxy covers
    @Get('cover/:mangaId/:filename')
    async getCover(
        @Param('mangaId') mangaId: string,
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: any,
    ) {
        const imageStream = await this.mangadexService.getCoverProxy(mangaId, filename);
        res.set({
            'content-type': 'image/jpeg',
            'cache-control': 'public, max-age=604800, immutable',
        });
        return new StreamableFile(imageStream);
    }

    // Generic proxy for MangaDex @Home chapter pages to bypass hotlink / CORS restrictions
    @Get('image-proxy')
    async proxyImage(
        @Query('url') url: string,
        @Res({ passthrough: true }) res: any,
    ) {
        if (!url) {
            throw new BadRequestException('Image URL is required');
        }
        const { stream, contentType } = await this.mangadexService.getImageProxyStream(url);
        res.set({
            'content-type': contentType,
            'cache-control': 'public, max-age=86400, stale-while-revalidate=43200',
        });
        return new StreamableFile(stream);
    }
}
