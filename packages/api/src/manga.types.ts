export enum ReadingStatus {
    Reading = "reading",
    Completed = "completed",
    PlanToRead = "plan_to_read",
    OnHold = "on_hold",
    Dropped = "dropped"
}

/** 
 * Core info about a manga.
*/
export interface Manga {
    id: string;
    title: string;
    description: string;
    coverUrl?: string;
    status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
    year?: number;
    tags: string[];

}

/**
 * A user's personal tracking entry for a specific managa.
 */
export interface LibraryEntry {
    id: string;
    userId: string;
    mangaId: string;
    status: ReadingStatus;
    currentChapter: number;
    rating?: number;
    createdAt: Date;
    updatedAt: Date;
}

