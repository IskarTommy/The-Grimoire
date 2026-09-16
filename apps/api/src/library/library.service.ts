import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LibraryService {
    constructor(private prisma: PrismaService) { }

    async addToLibrary(
        userId: string,
        mangaId: string, // This is the UUID from MangaDex
        title: string,
        coverUrl?: string, // The cover is optinal
    ) {
        // 1. We check if the user already has this in thier library.
        const existingEntry = await
            this.prisma.libraryEntry.findUnique({
                where: {
                    userId_mangaId: {
                        userId: userId,
                        mangaId: mangaId,
                    },
                },
            });

        if (existingEntry) {
            throw new ConflictException('Manga is already in your library!');
        }

        // 2. This ensures the Manga exists in the Database before linking it
        // Update or Insert
        await this.prisma.manga.upsert({
            where: { id: mangaId },
            update: {}, // If something exists, do nothing
            create: {
                id: mangaId,
                title: title,
                coverUrl: coverUrl,
                status: 'ongoing', // Default fallback
            },
        });

        // 3. Create the actual library entry
        return this.prisma.libraryEntry.create({
            data: {
                userId: userId,
                mangaId: mangaId,
                status: 'reading', // Default status
                currentChapter: 0,

            },
        });

    }

    // Get all manga in the user's library
    async getUserLibrary(userId: string) {
        return this.prisma.libraryEntry.findMany({
            where: { userId: userId },
            include: {
                manga: true, // IMPORTANT: This tells Prisma to fetch the actual manga title/cover too!
            },
        });
    }

    // Update chapter progress or status
    async updateProgress(userId: string, mangaId: string, currentChapter: number, status?: string) {
        return this.prisma.libraryEntry.update({
            where: {
                userId_mangaId: {
                    userId: userId,
                    mangaId: mangaId,
                },
            },
            data: {
                currentChapter: currentChapter,
                ...(status && { status: status }), // Only update status if the user provided one

            },
        });
    }
}
