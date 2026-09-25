const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export async function loginApi(identifier: string, passwordPlain: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: identifier.trim(),
      password: passwordPlain,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message) ? data.message[0] : (data.message || 'Invalid credentials');
    throw new Error(errorMsg);
  }

  return data;
}

export async function registerApi(username: string, email: string, passwordPlain: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: passwordPlain,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message) ? data.message[0] : (data.message || 'Registration failed');
    throw new Error(errorMsg);
  }

  return data;
}

export async function getMeApi(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to authenticate');
  }

  return data;
}
