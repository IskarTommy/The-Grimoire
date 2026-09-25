import { Controller, Get, Query, Param } from '@nestjs/common';
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

    // GET /anilist/top-100?page=&perPage=&country=&genre=
    @Get('top-100')
    async getTop100(
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
        @Query('country') country?: string,
        @Query('genre') genre?: string,
    ) {
        return this.anilistService.getTop100({
            page: page ? parseInt(page, 10) : 1,
            perPage: perPage ? parseInt(perPage, 10) : 50,
            country,
            genre,
        });
    }

    // GET /anilist/manga/:id
    @Get('manga/:id')
    async getMangaById(@Param('id') id: string) {
        return this.anilistService.getMangaById(parseInt(id, 10));
    }

    // GET /anilist/latest-updates?page=&perPage=&country=&genre=
    @Get('latest-updates')
    async getLatestUpdates(
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
        @Query('country') country?: string,
        @Query('genre') genre?: string,
    ) {
        return this.anilistService.getLatestUpdates({
            page: page ? parseInt(page, 10) : 1,
            perPage: perPage ? parseInt(perPage, 10) : 50,
            country,
            genre,
        });
    }

    // GET /anilist/upcoming-seasonal
    @Get('upcoming-seasonal')
    async getUpcomingSeasonal() {
        return this.anilistService.getUpcomingSeasonal();
    }
}
