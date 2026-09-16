import { Controller, Post, Body, UseGuards, Request, Get, Patch, Param } from '@nestjs/common';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddMangaDto } from './dto/add-manga.dto';
import { updateProgressDto } from './dto/update-progress.dto';

@Controller('library')
@UseGuards(JwtAuthGuard) // 1. Put the Bouncer in front of EVERY route in this controller!

export class LibraryController {
    constructor(private libraryService: LibraryService) { }

    @Post('add')
    async addToLibrary(
        @Body() body: AddMangaDto, // 2. Our bew Data Bouncer
        @Request() req: any, // 3. This request (which the AuthGuard attached our user data to)
    ) {
        // We get the userId directly from the JWT token!
        // This is super secure because the user can't fake who they are.
        const userId = req.user.userId;

        return this.libraryService.addToLibrary(
            userId,
            body.mangaId,
            body.title,
            body.coverUrl,
        );
    }

    @Get()
    async getMyLibrary(@Request() req: any) {
        // Just grab the userId from the token and ask the service for their library!
        return this.libraryService.getUserLibrary(req.user.userId);
    }

    @Patch(':mangaId')
    async UpdateProgress(
        @Param('mangaId') mangaId: string, // Grabs the mangaId from the URL!
        @Body() body: updateProgressDto,
        @Request() req: any,
    ) {
        return this.libraryService.updateProgress(
            req.user.userId,
            mangaId,
            body.currentChapter,
            body.status
        );
    }
}
