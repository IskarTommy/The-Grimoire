const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';

export interface DbLibraryEntry {
  id: string;
  status: string;
  currentChapter: number;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  mangaId: string;
  manga: {
    id: string;
    title: string;
    description?: string | null;
    coverUrl?: string | null;
    status: string;
    year?: number | null;
    tags: string[];
  };
}

export async function fetchUserLibraryApi(token: string): Promise<DbLibraryEntry[]> {
  const res = await fetch(`${API_URL}/library`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch library');
  }

  return res.json();
}

export async function addToLibraryApi(
  token: string,
  params: { mangaId: string | number; title: string; coverUrl?: string; status?: string }
): Promise<DbLibraryEntry> {
  const res = await fetch(`${API_URL}/library/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...params,
      mangaId: String(params.mangaId),
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to add to library');
  }

  return data;
}

export async function updateProgressApi(
  token: string,
  mangaId: string | number,
  params: { currentChapter?: number; status?: string; rating?: number }
): Promise<DbLibraryEntry> {
  const idStr = String(mangaId);
  const res = await fetch(`${API_URL}/library/${encodeURIComponent(idStr)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update progress');
  }

  return data;
}

export async function removeFromLibraryApi(
  token: string,
  mangaId: string | number
): Promise<void> {
  const idStr = String(mangaId);
  const res = await fetch(`${API_URL}/library/${encodeURIComponent(idStr)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to remove from library');
  }
}

