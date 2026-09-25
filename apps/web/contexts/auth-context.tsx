"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, loginApi, registerApi, getMeApi } from "@/lib/auth-api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, passwordPlain: string) => Promise<AuthUser>;
  signup: (username: string, email: string, passwordPlain: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "grimoire_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        const profile = await getMeApi(storedToken);
        setUser(profile);
        setToken(storedToken);
      } catch (err) {
        console.warn("Stored auth token is invalid or expired:", (err as any)?.message);
        if (typeof window !== "undefined") {
          localStorage.removeItem(TOKEN_KEY);
        }
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = useCallback(async (identifier: string, passwordPlain: string) => {
    const res = await loginApi(identifier, passwordPlain);
    setToken(res.access_token);
    setUser(res.user);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, res.access_token);
    }
    return res.user;
  }, []);

  const signup = useCallback(async (username: string, email: string, passwordPlain: string) => {
    const res = await registerApi(username, email, passwordPlain);
    setToken(res.access_token);
    setUser(res.user);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, res.access_token);
    }
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
