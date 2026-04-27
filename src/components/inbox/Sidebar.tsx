import { Link, useLocation } from "@tanstack/react-router";
import { Bot, Inbox, Users, Settings, BarChart3, Sparkles, Trello } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="mt-auto flex flex-col items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-[var(--gradient-brand)] text-primary-foreground grid place-items-center text-sm font-semibold">
          LR
        </div>
      </div>
    </aside>
  );
}