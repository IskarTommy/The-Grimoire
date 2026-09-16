import { Controller, Get, Query, Param, StreamableFile, Res } from '@nestjs/common';
import { MangadexService } from './mangadex.service';

@Controller('mangadex')
export class MangadexController {
    constructor(private readonly mangadexService:
        MangadexService) { }

    // This creates a route at: GET /mangadex/search? title=...
    @Get('search')
    async search(@Query('title') title: string) {

        // Safety check here! Make sure they typed something
        if (!title) {
            return { error: 'Please provide a title to search for!' };
        }

        return this.mangadexService.searchManga(title);
    }

    @Get('cover/:mangaId/:filename')
    async getCover(
        @Param('mangaId') mangaId: string,
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: any
    ) {
        const imageStream = await
            this.mangadexService.getCoverProxy(mangaId, filename);

        res.set({
            'content-type': 'image/jpeg',
        });

        // This StreamableFile tells NestJS to stream the raw image data back to the user's browser.
        return new StreamableFile(imageStream);
    }
}
