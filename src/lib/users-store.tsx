import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth-store";

export type UserRole = "admin" | "agent";

export type FeatureKey = "inbox" | "sales" | "contacts" | "bot" | "analytics" | "settings";

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  inbox: "Bandeja",
  sales: "Ventas",
  contacts: "Contactos",
  bot: "Bot IA",
  analytics: "Métricas",
  settings: "Ajustes",
};

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatarColor: string;
  /** Permissions: which features the user can access. */
  features: Record<FeatureKey, boolean>;
  createdAt: number;
}

const STORAGE_KEY = "pulse.users";

const DEFAULT_FEATURES_AGENT: Record<FeatureKey, boolean> = {
  inbox: true,
  sales: true,
  contacts: true,
  bot: false,
  analytics: false,
  settings: true,
};

const DEFAULT_FEATURES_ADMIN: Record<FeatureKey, boolean> = {
  inbox: true,
  sales: true,
  contacts: true,
  bot: true,
  analytics: true,
  settings: true,
};

export function defaultFeaturesFor(role: UserRole) {
  return role === "admin" ? { ...DEFAULT_FEATURES_ADMIN } : { ...DEFAULT_FEATURES_AGENT };
}

const SEED_USERS: ManagedUser[] = [
  {
    id: "u-admin",
    name: "Laura Ramírez",
    email: "laura@pulse.app",
    role: "admin",
    active: true,
    avatarColor: "oklch(0.65 0.2 280)",
    features: defaultFeaturesFor("admin"),
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: "u-agent-1",
    name: "Diego Salas",
    email: "diego@pulse.app",
    role: "agent",
    active: true,
    avatarColor: "oklch(0.7 0.18 60)",
    features: defaultFeaturesFor("agent"),
    createdAt: Date.now() - 86400000 * 12,
  },
  {
    id: "u-agent-2",
    name: "María Soto",
    email: "maria@pulse.app",
    role: "agent",
    active: true,
    avatarColor: "oklch(0.65 0.2 145)",
    features: { ...defaultFeaturesFor("agent"), bot: true },
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "u-agent-3",
    name: "Carlos Pérez",
    email: "carlos@pulse.app",
    role: "agent",
    active: false,
    avatarColor: "oklch(0.62 0.2 25)",
    features: defaultFeaturesFor("agent"),
    createdAt: Date.now() - 86400000 * 2,
  },
];

interface UsersState {
  users: ManagedUser[];
  /** Effective features for the currently logged in user. */
  myFeatures: Record<FeatureKey, boolean>;
  can: (feature: FeatureKey) => boolean;
  addUser: (input: { name: string; email: string; role: UserRole }) => string;
  updateUser: (id: string, patch: Partial<Omit<ManagedUser, "id" | "createdAt">>) => void;
  setRole: (id: string, role: UserRole) => void;
  toggleActive: (id: string) => void;
  setFeature: (id: string, feature: FeatureKey, value: boolean) => void;
  resetFeatures: (id: string) => void;
  removeUser: (id: string) => void;
}

const UsersContext = createContext<UsersState | null>(null);

const AVATAR_COLORS = [
  "oklch(0.7 0.18 25)", "oklch(0.65 0.2 145)", "oklch(0.65 0.2 280)",
  "oklch(0.7 0.18 60)", "oklch(0.65 0.2 200)", "oklch(0.6 0.22 320)",
];

function uid() { return Math.random().toString(36).slice(2, 10); }

export function UsersProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>(SEED_USERS);

  // Hydrate
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as ManagedUser[];
        if (Array.isArray(parsed) && parsed.length > 0) setUsers(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); } catch { /* ignore */ }
  }, [users]);

  // Make sure the logged-in user exists in the list.
  useEffect(() => {
    if (!authUser) return;
    setUsers((prev) => {
      const found = prev.find((u) => u.email.toLowerCase() === authUser.email.toLowerCase());
      if (found) {
        // Sync role from authUser
        if (found.role !== authUser.role) {
          return prev.map((u) => (u.id === found.id ? { ...u, role: authUser.role, features: defaultFeaturesFor(authUser.role) } : u));
        }
        return prev;
      }
      const newUser: ManagedUser = {
        id: authUser.id || uid(),
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        active: true,
        avatarColor: authUser.avatarColor || AVATAR_COLORS[0],
        features: defaultFeaturesFor(authUser.role),
        createdAt: Date.now(),
      };
      return [newUser, ...prev];
    });
  }, [authUser]);

  const me = useMemo(
    () => users.find((u) => authUser && u.email.toLowerCase() === authUser.email.toLowerCase()) ?? null,
    [users, authUser],
  );

  const myFeatures = useMemo<Record<FeatureKey, boolean>>(() => {
    // Admin from auth always sees everything (unless explicitly disabled in their record)
    if (me) return me.features;
    if (authUser?.role === "admin") return defaultFeaturesFor("admin");
    return defaultFeaturesFor("agent");
  }, [me, authUser]);

  const can = useCallback((feature: FeatureKey) => myFeatures[feature] === true, [myFeatures]);

  const addUser = useCallback<UsersState["addUser"]>((input) => {
    const id = uid();
    setUsers((prev) => [{
      id,
      name: input.name,
      email: input.email,
      role: input.role,
      active: true,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      features: defaultFeaturesFor(input.role),
      createdAt: Date.now(),
    }, ...prev]);
    return id;
  }, []);

  const updateUser = useCallback<UsersState["updateUser"]>((id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const setRole = useCallback<UsersState["setRole"]>((id, role) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role, features: defaultFeaturesFor(role) } : u)));
  }, []);

  const toggleActive = useCallback<UsersState["toggleActive"]>((id) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
  }, []);

  const setFeature = useCallback<UsersState["setFeature"]>((id, feature, value) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, features: { ...u.features, [feature]: value } } : u)));
  }, []);

  const resetFeatures = useCallback<UsersState["resetFeatures"]>((id) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, features: defaultFeaturesFor(u.role) } : u)));
  }, []);

  const removeUser = useCallback<UsersState["removeUser"]>((id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const value = useMemo<UsersState>(
    () => ({ users, myFeatures, can, addUser, updateUser, setRole, toggleActive, setFeature, resetFeatures, removeUser }),
    [users, myFeatures, can, addUser, updateUser, setRole, toggleActive, setFeature, resetFeatures, removeUser],
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used inside UsersProvider");
  return ctx;
}
