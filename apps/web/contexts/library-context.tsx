"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  DbLibraryEntry,
  fetchUserLibraryApi,
  addToLibraryApi,
  updateProgressApi,
  removeFromLibraryApi,
} from "@/lib/library-api";
import { MediaItem } from "@/lib/types";

function mapDbStatus(status?: string): "ONGOING" | "COMPLETED" | "PLANNED" {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "COMPLETED";
  if (s === "plan_to_read" || s === "planned") return "PLANNED";
  return "ONGOING";
}

function mapDbEntryToMediaItem(entry: DbLibraryEntry): MediaItem {
  const manga = entry.manga;
  return {
    id: manga?.id || entry.mangaId,
    title: manga?.title || "Unknown Title",
    author: "Various",
    cover: manga?.coverUrl || "",
    type: "MANGA",
    status: mapDbStatus(entry.status),
    progress: entry.currentChapter,
    currentChapter: entry.currentChapter,
    totalChapters: null,
    rating: entry.rating || 0,
    genres: manga?.tags || [],
    accent: "violet",
    lastUpdated: new Date(entry.updatedAt).toLocaleDateString(),
    year: manga?.year || new Date(entry.createdAt).getFullYear(),
    synopsis: manga?.description || "",
  };
}

interface LibraryContextType {
  rawEntries: DbLibraryEntry[];
  libraryItems: MediaItem[];
  loading: boolean;
  isInLibrary: (mangaId: string | number) => boolean;
  getLibraryEntry: (mangaId: string | number) => DbLibraryEntry | undefined;
  addToLibrary: (params: { mangaId: string | number; title: string; coverUrl?: string; status?: string }) => Promise<DbLibraryEntry>;
  updateProgress: (
    mangaId: string | number,
    paramsOrChapter: number | { currentChapter?: number; status?: string; rating?: number },
    statusArg?: string
  ) => Promise<void>;
  updateChapter: (mangaId: string | number, chapter: number) => Promise<void>;
  updateStatus: (mangaId: string | number, status: string) => Promise<void>;
  updateRating: (mangaId: string | number, rating: number) => Promise<void>;
  removeFromLibrary: (mangaId: string | number) => Promise<void>;
  refetch: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
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
    (mangaId: string | number) => {
      const idStr = String(mangaId);
      return entries.some((e) => e.mangaId === idStr || e.manga?.id === idStr);
    },
    [entries]
  );

  const getLibraryEntry = useCallback(
    (mangaId: string | number) => {
      const idStr = String(mangaId);
      return entries.find((e) => e.mangaId === idStr || e.manga?.id === idStr);
    },
    [entries]
  );

  const addToLibrary = useCallback(
    async (params: { mangaId: string | number; title: string; coverUrl?: string; status?: string }) => {
      if (!token) throw new Error("Must be logged in to add to library");
      const newEntry = await addToLibraryApi(token, params);
      if (params.status && !newEntry.status) {
        newEntry.status = params.status;
      }
      if (!newEntry.manga) {
        newEntry.manga = {
          id: String(params.mangaId),
          title: params.title,
          coverUrl: params.coverUrl || null,
          status: "ongoing",
          year: new Date().getFullYear(),
          tags: [],
        };
      }
      setEntries((prev) => {
        const idStr = String(newEntry.mangaId || params.mangaId);
        if (prev.some((e) => e.mangaId === idStr || e.manga?.id === idStr)) {
          return prev.map((e) => (e.mangaId === idStr ? newEntry : e));
        }
        return [newEntry, ...prev];
      });
      return newEntry;
    },
    [token]
  );

  const updateProgress = useCallback(
    async (
      mangaId: string | number,
      paramsOrChapter: number | { currentChapter?: number; status?: string; rating?: number },
      statusArg?: string
    ) => {
      if (!token) throw new Error("Must be logged in to update progress");
      const idStr = String(mangaId);
      const params =
        typeof paramsOrChapter === "number"
          ? { currentChapter: paramsOrChapter, status: statusArg }
          : paramsOrChapter;

      // Optimistic local state update
      setEntries((prev) =>
        prev.map((e) => {
          if (e.mangaId === idStr || e.manga?.id === idStr) {
            return {
              ...e,
              ...(params.currentChapter !== undefined && { currentChapter: params.currentChapter }),
              ...(params.status !== undefined && { status: params.status }),
              ...(params.rating !== undefined && { rating: params.rating }),
            };
          }
          return e;
        })
      );

      const updated = await updateProgressApi(token, idStr, params);
      setEntries((prev) =>
        prev.map((e) =>
          e.mangaId === idStr || e.manga?.id === idStr ? { ...e, ...updated } : e
        )
      );
    },
    [token]
  );

  const updateChapter = useCallback(
    async (mangaId: string | number, chapter: number) => {
      return updateProgress(mangaId, { currentChapter: chapter });
    },
    [updateProgress]
  );

  const updateStatus = useCallback(
    async (mangaId: string | number, status: string) => {
      return updateProgress(mangaId, { status });
    },
    [updateProgress]
  );

  const updateRating = useCallback(
    async (mangaId: string | number, rating: number) => {
      return updateProgress(mangaId, { rating });
    },
    [updateProgress]
  );

  const removeFromLibrary = useCallback(
    async (mangaId: string | number) => {
      if (!token) throw new Error("Must be logged in to remove from library");
      const idStr = String(mangaId);
      // Optimistic removal
      setEntries((prev) =>
        prev.filter((e) => e.mangaId !== idStr && e.manga?.id !== idStr)
      );
      await removeFromLibraryApi(token, idStr);
    },
    [token]
  );

  const mediaItems: MediaItem[] = entries.map(mapDbEntryToMediaItem);

  return (
    <LibraryContext.Provider
      value={{
        rawEntries: entries,
        libraryItems: mediaItems,
        loading,
        isInLibrary,
        getLibraryEntry,
        addToLibrary,
        updateProgress,
        updateChapter,
        updateStatus,
        updateRating,
        removeFromLibrary,
        refetch: fetchLibrary,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
