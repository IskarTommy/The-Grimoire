"use client";

import { useState, useEffect, useCallback } from "react";
import type { MangaDexChapter, ChapterPagesResponse } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";

export function getMangaDexImageUrl(originalUrl: string): string {
  if (!originalUrl) return "";
  return `${API_BASE}/mangadex/image-proxy?url=${encodeURIComponent(originalUrl)}`;
}

export async function fetchDirectChapterToRead(
  title?: string,
  anilistId?: string,
  currentChapter = 0,
  altTitles?: string[]
): Promise<string | null> {
  if (!title && !anilistId) return null;
  try {
    const params = new URLSearchParams();
    if (title) params.append("title", title);
    if (anilistId) params.append("anilistId", anilistId);
    if (altTitles && altTitles.length > 0) {
      params.append("altTitles", altTitles.join(","));
    }

    const resolveRes = await fetch(`${API_BASE}/mangadex/resolve?${params.toString()}`);
    if (!resolveRes.ok) return null;
    const resolveData = await resolveRes.json();
    if (!resolveData?.id) return null;

    // Fetch chapters in ascending order to find earliest or next unread
    const chRes = await fetch(`${API_BASE}/mangadex/manga/${resolveData.id}/chapters?order=asc&limit=100`);
    if (!chRes.ok) return null;
    const chData = await chRes.json();
    const list: MangaDexChapter[] = chData.chapters || [];
    if (list.length === 0) return null;

    // Filter readable chapters
    const readable = list.filter((c) => c.readable);
    if (readable.length === 0) return null;

    // Try finding next unread chapter (> currentChapter)
    if (currentChapter > 0) {
      const nextUnread = readable.find((c) => (parseFloat(c.chapter) || 0) > currentChapter);
      if (nextUnread) return nextUnread.id;
    }

    // Default to the earliest readable chapter (e.g. Chapter 1)
    return readable[0]?.id || null;
  } catch (err) {
    console.error("fetchDirectChapterToRead error:", err);
    return null;
  }
}

export function useMangaChapters(title?: string, anilistId?: string, altTitles?: string[]) {
  const [mangadexId, setMangadexId] = useState<string | null>(null);
  const [resolvedTitle, setResolvedTitle] = useState<string | null>(null);
  const [chapters, setChapters] = useState<MangaDexChapter[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const fetchChapters = useCallback(
    async (mId: string, currentOrder: "desc" | "asc") => {
      try {
        setLoading(true);
        setError(null);

        const url = `${API_BASE}/mangadex/manga/${mId}/chapters?order=${currentOrder}&limit=100`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch chapters: ${res.status}`);
        }

        const data = await res.json();
        setChapters(data.chapters || []);
        setTotal(data.total || 0);
      } catch (err: any) {
        console.error("useMangaChapters feed error:", err);
        setError(err.message || "Failed to load chapters");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const resolveAndLoad = useCallback(async () => {
    if (!title && !anilistId) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (title) params.append("title", title);
      if (anilistId) params.append("anilistId", anilistId);
      if (altTitles && altTitles.length > 0) {
        params.append("altTitles", altTitles.join(","));
      }

      const resolveRes = await fetch(`${API_BASE}/mangadex/resolve?${params.toString()}`);
      if (!resolveRes.ok) {
        throw new Error("Could not resolve title on MangaDex");
      }

      const resolveData = await resolveRes.json();
      if (!resolveData?.id) {
        setMangadexId(null);
        setChapters([]);
        setTotal(0);
        return;
      }

      setMangadexId(resolveData.id);
      setResolvedTitle(resolveData.title);

      await fetchChapters(resolveData.id, order);
    } catch (err: any) {
      console.warn("useMangaChapters resolve error:", err);
      setError(err.message || "Failed to find title on MangaDex");
    } finally {
      setLoading(false);
    }
  }, [title, anilistId, altTitles, order, fetchChapters]);

  useEffect(() => {
    resolveAndLoad();
  }, [resolveAndLoad]);

  const toggleOrder = () => {
    const nextOrder = order === "desc" ? "asc" : "desc";
    setOrder(nextOrder);
    if (mangadexId) {
      fetchChapters(mangadexId, nextOrder);
    }
  };

  return {
    mangadexId,
    resolvedTitle,
    chapters,
    total,
    loading,
    error,
    order,
    setOrder,
    toggleOrder,
    refresh: resolveAndLoad,
  };
}

export function useChapterPages(chapterId?: string) {
  const [data, setData] = useState<ChapterPagesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chapterId) {
      setData(null);
      return;
    }

    let isMounted = true;
    async function loadPages() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/mangadex/chapter/${chapterId}/pages`);
        if (!res.ok) {
          throw new Error(`Failed to load chapter pages: ${res.status}`);
        }

        const pagesData: ChapterPagesResponse = await res.json();
        if (isMounted) {
          setData(pagesData);
        }
      } catch (err: any) {
        console.error("useChapterPages error:", err);
        if (isMounted) {
          setError(err.message || "Failed to load chapter images");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPages();

    return () => {
      isMounted = false;
    };
  }, [chapterId]);

  return {
    data,
    loading,
    error,
    proxyUrl: getMangaDexImageUrl,
  };
}
