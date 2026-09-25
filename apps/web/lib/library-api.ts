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
  params: { mangaId: string; title: string; coverUrl?: string }
): Promise<DbLibraryEntry> {
  const res = await fetch(`${API_URL}/library/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to add to library');
  }

  return data;
}

export async function updateProgressApi(
  token: string,
  mangaId: string,
  params: { currentChapter: number; status?: string }
): Promise<DbLibraryEntry> {
  const res = await fetch(`${API_URL}/library/${mangaId}`, {
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
