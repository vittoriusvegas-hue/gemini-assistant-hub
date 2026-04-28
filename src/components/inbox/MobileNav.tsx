import { Link, useLocation } from "@tanstack/react-router";
import { Bot, Inbox, Users, Settings, BarChart3, Trello } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsers, type FeatureKey } from "@/lib/users-store";

const items: { to: string; label: string; icon: typeof Inbox; feature: FeatureKey }[] = [
  { to: "/", label: "Bandeja", icon: Inbox, feature: "inbox" },
  { to: "/sales", label: "Ventas", icon: Trello, feature: "sales" },
  { to: "/contacts", label: "Contactos", icon: Users, feature: "contacts" },
  { to: "/bot", label: "Bot", icon: Bot, feature: "bot" },
  { to: "/analytics", label: "Métricas", icon: BarChart3, feature: "analytics" },
  { to: "/settings", label: "Ajustes", icon: Settings, feature: "settings" },
];

export function MobileNav() {
  const { pathname } = useLocation();
  const { can } = useUsers();
  const visible = items.filter((it) => can(it.feature));
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-card/95 px-1 py-1.5 backdrop-blur md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.375rem)" }}
    >
      {visible.map(({ to, label, icon: Icon }) => {
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
