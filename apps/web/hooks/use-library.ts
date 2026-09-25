"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  DbLibraryEntry,
  fetchUserLibraryApi,
  addToLibraryApi,
  updateProgressApi,
} from "@/lib/library-api";
import { MediaItem } from "@/lib/types";

function mapDbEntryToMediaItem(entry: DbLibraryEntry): MediaItem {
  const manga = entry.manga;
  return {
    id: manga.id,
    title: manga.title || "Unknown Title",
    author: "Various",
    cover: manga.coverUrl || "",
    type: "MANGA",
    status: entry.status.toUpperCase() === "COMPLETED" ? "COMPLETED" : "ONGOING",
    progress: entry.currentChapter,
    currentChapter: entry.currentChapter,
    totalChapters: null,
    rating: entry.rating || 0,
    genres: manga.tags || [],
    accent: "violet",
    lastUpdated: new Date(entry.updatedAt).toLocaleDateString(),
    year: manga.year || new Date(entry.createdAt).getFullYear(),
    synopsis: manga.description || "",
  };
}

export function useLibrary() {
  const { token, isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<DbLibraryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLibrary = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setEntries([]);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchUserLibraryApi(token);
      setEntries(data || []);
    } catch (err) {
      console.error("Error loading user library:", err);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const isInLibrary = useCallback(
    (mangaId: string) => {
      return entries.some((e) => e.mangaId === mangaId || e.manga?.id === mangaId);
    },
    [entries]
  );

  const getLibraryEntry = useCallback(
    (mangaId: string) => {
      return entries.find((e) => e.mangaId === mangaId || e.manga?.id === mangaId);
    },
    [entries]
  );

  const addToLibrary = useCallback(
    async (params: { mangaId: string; title: string; coverUrl?: string }) => {
      if (!token) throw new Error("Must be logged in to add to library");
      const newEntry = await addToLibraryApi(token, params);
      setEntries((prev) => [newEntry, ...prev]);
    },
    [token]
  );

  const updateProgress = useCallback(
    async (mangaId: string, currentChapter: number, status?: string) => {
      if (!token) throw new Error("Must be logged in to update progress");
      const updated = await updateProgressApi(token, mangaId, { currentChapter, status });
      setEntries((prev) =>
        prev.map((e) => (e.mangaId === mangaId ? { ...e, ...updated } : e))
      );
    },
    [token]
  );

  const mediaItems: MediaItem[] = entries.map(mapDbEntryToMediaItem);

  return {
    rawEntries: entries,
    libraryItems: mediaItems,
    loading,
    isInLibrary,
    getLibraryEntry,
    addToLibrary,
    updateProgress,
    refetch: fetchLibrary,
  };
}
