import { Link, useLocation } from "@tanstack/react-router";
import { Bot, Inbox, Users, Settings, BarChart3, Trello } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Bandeja", icon: Inbox },
  { to: "/sales", label: "Ventas", icon: Trello },
  { to: "/contacts", label: "Contactos", icon: Users },
  { to: "/bot", label: "Bot", icon: Bot },
  { to: "/analytics", label: "Métricas", icon: BarChart3 },
  { to: "/settings", label: "Ajustes", icon: Settings },
] as const;

export function MobileNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-card/95 px-1 py-1.5 backdrop-blur md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.375rem)" }}
    >
      {items.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium transition",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className={cn("h-5 w-5", active && "text-primary")} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
