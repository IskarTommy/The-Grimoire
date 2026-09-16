import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MangadexService {
    constructor(private readonly httpService:
        HttpService) { }

    async searchManga(title: string) {
        try {
            // 1. We send request to MangaDex API
            const response = await firstValueFrom(
                this.httpService.get('https://api.mangadex.org/manga', {
                    params: {
                        title: title,
                        'includes[]': 'cover_art', // Ask MangaDex to include the cover image info!
                        limit: 10,
                    },

                }),
            );

            // 2. Return the data MangaDex gave us
            return response.data;

        } catch (error) {
            console.error(error);
            throw new HttpException('Failed to fetch from MangaDex', 500);
        }
    }

    // We proxy the image so the browser doesn't block it from showing.
    async getCoverProxy(mangaId: string, filename: string) {
        try {
            const url =
                `https://uploads.mangadex.org/covers/${mangaId}/${filename}`;

            const response = await firstValueFrom(

                this.httpService.get(url, { responseType: 'stream' }),
            );

            return response.data;
        } catch (error) {
            throw new HttpException('Cover image not found', 404);
        };
    }

}
