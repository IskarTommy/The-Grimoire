import { Controller, Get } from '@nestjs/common';
import { AnilistService } from './anilist.service';

@Controller('anilist')
export class AnilistController {
    constructor(private readonly anilistService:
        AnilistService) { }

    // This creates a route at: GET /anilist/trending
    @Get('trending')
    async getTrending() {
        return this.anilistService.getTrending();
    }

    // This creates a route at: GET /anilist/seasonal
    @Get('seasonal')
    async getSeasonal() {
        return this.anilistService.getSeasonal();
    }

}
