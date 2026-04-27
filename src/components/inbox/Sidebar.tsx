import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Bot, Inbox, Users, Settings, BarChart3, Sparkles, Trello, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

const items = [
  { to: "/", label: "Bandeja", icon: Inbox },
  { to: "/sales", label: "Ventas", icon: Trello },
  { to: "/contacts", label: "Contactos", icon: Users },
  { to: "/bot", label: "Bot IA", icon: Bot },
  { to: "/analytics", label: "Métricas", icon: BarChart3 },
  { to: "/settings", label: "Ajustes", icon: Settings },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="hidden md:flex w-[68px] shrink-0 flex-col items-center gap-1 bg-sidebar-bg py-4 text-sidebar-fg">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gradient-brand)] text-primary-foreground shadow-[var(--shadow-pop)]">
        <Sparkles className="h-5 w-5" />
      </div>
      <nav className="mt-2 flex flex-col items-center gap-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={cn(
                "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                active
                  ? "bg-sidebar-active text-primary-foreground shadow-[var(--shadow-pop)]"
                  : "text-sidebar-fg/70 hover:bg-white/5 hover:text-sidebar-fg",
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
      <div ref={ref} className="relative mt-auto flex flex-col items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          title={user?.name ?? "Cuenta"}
          className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gradient-brand)] text-sm font-semibold text-primary-foreground ring-2 ring-transparent transition hover:ring-white/20"
        >
          {initials}
        </button>
        {open && (
          <div className="absolute bottom-0 left-12 z-50 w-56 rounded-xl border bg-card p-2 text-foreground shadow-2xl">
            <div className="border-b px-2 py-2">
              <div className="truncate text-sm font-semibold">{user?.name}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Settings className="h-4 w-4" /> Ajustes de cuenta
            </Link>
            <button
              onClick={() => {
                logout();
                setOpen(false);
                toast.success("Sesión cerrada");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
