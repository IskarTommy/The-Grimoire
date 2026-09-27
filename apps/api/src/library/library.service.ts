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
        status?: string,
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
                include: {
                    manga: true,
                },
            });

        if (existingEntry) {
            if (status && status !== existingEntry.status) {
                return this.prisma.libraryEntry.update({
                    where: {
                        userId_mangaId: {
                            userId: userId,
                            mangaId: mangaId,
                        },
                    },
                    data: { status },
                    include: { manga: true },
                });
            }
            return existingEntry;
        }

        // 2. This ensures the Manga exists in the Database before linking it
        await this.prisma.manga.upsert({
            where: { id: mangaId },
            update: {
                ...(title && { title }),
                ...(coverUrl && { coverUrl }),
            },
            create: {
                id: mangaId,
                title: title,
                coverUrl: coverUrl,
                status: 'ongoing', // Default fallback
            },
        });

        // 3. Create the actual library entry with manga included!
        return this.prisma.libraryEntry.create({
            data: {
                userId: userId,
                mangaId: mangaId,
                status: status || 'reading', // Default status or chosen status
                currentChapter: 0,
            },
            include: {
                manga: true,
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

    // Update chapter progress, status, or rating
    async updateProgress(
        userId: string,
        mangaId: string,
        currentChapter?: number,
        status?: string,
        rating?: number,
    ) {
        return this.prisma.libraryEntry.update({
            where: {
                userId_mangaId: {
                    userId: userId,
                    mangaId: mangaId,
                },
            },
            data: {
                ...(currentChapter !== undefined && { currentChapter: currentChapter }),
                ...(status !== undefined && { status: status }),
                ...(rating !== undefined && { rating: rating }),
            },
            include: {
                manga: true,
            },
        });
    }

    // Remove manga from the user's library
    async removeFromLibrary(userId: string, mangaId: string) {
        return this.prisma.libraryEntry.delete({
            where: {
                userId_mangaId: {
                    userId: userId,
                    mangaId: mangaId,
                },
            },
        });
    }
}
