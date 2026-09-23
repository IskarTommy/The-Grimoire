import { Controller, Get, Query } from '@nestjs/common';
import { AnilistService } from './anilist.service';

@Controller('anilist')
export class AnilistController {
    constructor(private readonly anilistService: AnilistService) { }

    // GET /anilist/trending
    @Get('trending')
    async getTrending() {
        return this.anilistService.getTrending();
    }

    // GET /anilist/seasonal
    @Get('seasonal')
    async getSeasonal() {
        return this.anilistService.getSeasonal();
    }

    // GET /anilist/popular-new
    @Get('popular-new')
    async getPopularNew() {
        return this.anilistService.getPopularNew();
    }

    // GET /anilist/search?q=&genre=&country=&sort=&page=&perPage=
    @Get('search')
    async searchManga(
        @Query('q') q?: string,
        @Query('genre') genre?: string,
        @Query('country') country?: string,
        @Query('sort') sort?: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.anilistService.searchManga({
            q,
            genre,
            country,
            sort,
            page: page ? parseInt(page, 10) : 1,
            perPage: perPage ? parseInt(perPage, 10) : 20,
        });
    }

    // GET /anilist/genres
    @Get('genres')
    async getGenres() {
        return this.anilistService.getGenres();
    }
}
