import { useMemo, useState } from "react";
import { Plus, Search, Trash2, ShieldCheck, Shield, UserPlus, RotateCcw, Power, X } from "lucide-react";
import { useUsers, FEATURE_LABELS, type FeatureKey, type UserRole, type ManagedUser } from "@/lib/users-store";
import { useAuth } from "@/lib/auth-store";
import { ContactAvatar } from "./Avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as FeatureKey[];

export function UsersAdminPage() {
  const { isAdmin, user: me } = useAuth();
  const { users, addUser, setRole, toggleActive, setFeature, resetFeatures, removeUser } = useUsers();
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);

  if (!isAdmin) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center shadow-sm">
        <Shield className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h2 className="text-base font-semibold">Acceso restringido</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo los usuarios con rol <strong>administrador</strong> pueden gestionar el equipo y los permisos.
        </p>
      </section>
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, query]);

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === "admin").length;
    const active = users.filter((u) => u.active).length;
    return { total: users.length, admins, active };
  }, [users]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div>
          <h2 className="text-base font-semibold">Equipo y permisos</h2>
          <p className="text-sm text-muted-foreground">
            Administra los usuarios, su rol y a qué secciones pueden acceder.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 rounded-lg border bg-background px-3 py-1.5 text-xs">
            <span><span className="font-semibold">{stats.total}</span> usuarios</span>
            <span className="text-muted-foreground">·</span>
            <span><span className="font-semibold">{stats.admins}</span> admins</span>
            <span className="text-muted-foreground">·</span>
            <span><span className="font-semibold">{stats.active}</span> activos</span>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--gradient-brand)] px-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95"
          >
            <UserPlus className="h-4 w-4" /> Invitar usuario
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        <ul className="divide-y">
          {filtered.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isMe={me?.email.toLowerCase() === user.email.toLowerCase()}
              onRole={(r) => {
                setRole(user.id, r);
                toast.success(`Rol actualizado a ${r === "admin" ? "Administrador" : "Agente"}`);
              }}
              onToggleActive={() => {
                toggleActive(user.id);
                toast(user.active ? "Usuario desactivado" : "Usuario activado");
              }}
              onFeature={(f, v) => setFeature(user.id, f, v)}
              onReset={() => {
                resetFeatures(user.id);
                toast.success("Permisos restablecidos");
              }}
              onRemove={() => {
                if (typeof window !== "undefined" && !window.confirm(`¿Eliminar a ${user.name}?`)) return;
                removeUser(user.id);
                toast.success("Usuario eliminado");
              }}
            />
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-12 text-center text-sm text-muted-foreground">Sin resultados.</li>
          )}
        </ul>
      </div>

      {showNew && (
        <NewUserDialog
          onClose={() => setShowNew(false)}
          onCreate={(input) => {
            addUser(input);
            setShowNew(false);
            toast.success("Usuario invitado", { description: `${input.name} se añadió al equipo.` });
          }}
        />
      )}
    </section>
  );
}

function UserRow({
  user,
  isMe,
  onRole,
  onToggleActive,
  onFeature,
  onReset,
  onRemove,
}: {
  user: ManagedUser;
  isMe: boolean;
  onRole: (role: UserRole) => void;
  onToggleActive: () => void;
  onFeature: (f: FeatureKey, v: boolean) => void;
  onReset: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const enabledCount = FEATURE_KEYS.filter((k) => user.features[k]).length;

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <ContactAvatar name={user.name} color={user.avatarColor} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{user.name}</span>
            {isMe && (
              <Badge variant="secondary" className="text-[10px]">Tú</Badge>
            )}
            {user.role === "admin" ? (
              <Badge className="gap-1 text-[10px]">
                <ShieldCheck className="h-3 w-3" /> Admin
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Shield className="h-3 w-3" /> Agente
              </Badge>
            )}
            {!user.active && (
              <Badge variant="outline" className="text-[10px] text-destructive">Inactivo</Badge>
            )}
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={user.role}
            onChange={(e) => onRole(e.target.value as UserRole)}
            className="h-9 rounded-lg border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring/40"
            disabled={isMe}
            title={isMe ? "No puedes cambiar tu propio rol aquí" : "Cambiar rol"}
          >
            <option value="admin">Administrador</option>
            <option value="agent">Agente</option>
          </select>
          <button
            onClick={onToggleActive}
            disabled={isMe}
            title={isMe ? "No puedes desactivar tu propia cuenta" : user.active ? "Desactivar" : "Activar"}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium hover:bg-muted",
              isMe && "cursor-not-allowed opacity-40",
            )}
          >
            <Power className="h-3.5 w-3.5" />
            {user.active ? "Activo" : "Inactivo"}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium hover:bg-muted"
          >
            Permisos · <span className="font-semibold">{enabledCount}/{FEATURE_KEYS.length}</span>
          </button>
          <button
            onClick={onRemove}
            disabled={isMe}
            title={isMe ? "No puedes eliminar tu propia cuenta" : "Eliminar"}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-destructive hover:bg-destructive/10",
              isMe && "cursor-not-allowed opacity-40 hover:bg-background",
            )}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 rounded-lg border bg-muted/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Secciones visibles para este usuario
            </h4>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Restablecer por rol
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FEATURE_KEYS.map((f) => (
              <label
                key={f}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <span>{FEATURE_LABELS[f]}</span>
                <Switch
                  checked={user.features[f]}
                  onCheckedChange={(v) => onFeature(f, v)}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

function NewUserDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { name: string; email: string; role: UserRole }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("agent");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Invitar nuevo usuario</h3>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <label>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Nombre completo</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Ana López"
              className="h-9 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@empresa.com"
              className="h-9 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Rol</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="h-9 w-full rounded-lg border bg-background px-2 outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="agent">Agente</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={() => name.trim() && email.includes("@") && onCreate({ name: name.trim(), email: email.trim(), role })}
            disabled={!name.trim() || !email.includes("@")}
            className="rounded-lg bg-[var(--gradient-brand)] px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] disabled:opacity-40"
          >
            Invitar
          </button>
        </div>
      </div>
    </div>
  );
}
