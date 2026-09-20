import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AnilistService {
    // Inject the HttpService so we can network requests
    constructor(private readonly httpService:
        HttpService) { }

    async getTrending() {
        // The GraphQL query to find the fields we are lookig for.
        const query = `
      query {
        Page(page: 1, perPage: 15) {
          media(type: MANGA, sort: TRENDING_DESC) {
            id
            title {
              romaji
              english
            }
            coverImage {
              extraLarge
              color
            }
            status
            chapters
            averageScore
            genres
            relations {
              edges {
                relationType(version: 2)
                node {
                  type
                  format
                  status
                }
              }
            }
          }
        }
      }
    `;
        try {
            // Send the POST request to Anilist with the GraphQL query.
            const response = await firstValueFrom(
                this.httpService.post(
                    'https://graphql.anilist.co',
                    { query },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                    })
            );

            // Return the data from the GraphQL response
            return response.data.data.Page.media;
        } catch (error) {
            console.error(error);
            throw new HttpException('Failed to fetch from AniList', 500);
        }
    }
}
