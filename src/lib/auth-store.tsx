import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "pulse.auth.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    try {
      if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 500));
    if (!email.includes("@")) return { ok: false, error: "Email inválido" };
    if (password.length < 4) return { ok: false, error: "Contraseña demasiado corta" };
    const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    persist({
      id: btoa(email).slice(0, 10),
      name: name || "Usuario",
      email,
      avatarColor: "oklch(0.65 0.2 280)",
    });
    return { ok: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 500));
    if (!name.trim()) return { ok: false, error: "El nombre es obligatorio" };
    if (!email.includes("@")) return { ok: false, error: "Email inválido" };
    if (password.length < 6) return { ok: false, error: "Mínimo 6 caracteres" };
    persist({
      id: btoa(email).slice(0, 10),
      name: name.trim(),
      email,
      avatarColor: "oklch(0.65 0.2 145)",
    });
    return { ok: true };
  }, []);

  const logout = useCallback(() => persist(null), []);

  const value = useMemo<AuthState>(
    () => ({ user, isAuthenticated: !!user, loading, login, signup, logout }),
    [user, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
