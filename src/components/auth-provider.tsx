"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Account, apiRequest, clearAccessToken, getAccessToken, normalizeAccount } from "@/lib/api";

type AuthContextValue = {
  user: Account | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getAccessToken()) {
      setLoading(false);
      router.replace("/login");
      return;
    }
    try {
      const payload = await apiRequest<{ user: Partial<Account> }>("/api/auth/me");
      setUser(normalizeAccount(payload.user));
    } catch {
      clearAccessToken();
      setUser(null);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function hydrateSession() {
      if (!getAccessToken()) {
        if (active) setLoading(false);
        router.replace("/login");
        return;
      }
      try {
        const payload = await apiRequest<{ user: Partial<Account> }>("/api/auth/me");
        if (active) setUser(normalizeAccount(payload.user));
      } catch {
        clearAccessToken();
        if (active) setUser(null);
        router.replace("/login");
      } finally {
        if (active) setLoading(false);
      }
    }

    void hydrateSession();
    return () => { active = false; };
  }, [router]);

  function logout() {
    clearAccessToken();
    setUser(null);
    router.push("/login");
  }

  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}