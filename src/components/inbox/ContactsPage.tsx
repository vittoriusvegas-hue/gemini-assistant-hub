import { useState } from "react";
import { Search, ShieldOff, ShieldCheck, MoreVertical } from "lucide-react";
import { useInbox } from "@/lib/inbox-store";
import { ContactAvatar } from "./Avatar";
import { ChannelBadge } from "./ChannelBadge";
import { cn } from "@/lib/utils";

export function ContactsPage() {
  const { contacts, toggleBlockContact } = useInbox();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "blocked">("all");

  const filtered = contacts.filter((c) => {
    if (filter === "active" && c.blocked) return false;
    if (filter === "blocked" && !c.blocked) return false;
    if (!q) return true;
    const needle = q.toLowerCase();
    return c.name.toLowerCase().includes(needle) || c.phone.toLowerCase().includes(needle);
  });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="border-b bg-card/60 backdrop-blur px-8 py-5">
        <h1 className="text-xl font-semibold tracking-tight">Contactos</h1>
        <p className="text-sm text-muted-foreground">Gestiona quién puede interactuar con el bot.</p>
      </header>

      <div className="flex items-center gap-3 border-b bg-card px-8 py-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar contacto..."
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="flex gap-1 rounded-lg border bg-background p-1">
          {(["all", "active", "blocked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "Todos" : f === "active" ? "Activos" : "Bloqueados"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-4">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Contacto</th>
                <th className="px-4 py-3 text-left font-medium">Canal</th>
                <th className="px-4 py-3 text-left font-medium">Etiquetas</th>
                <th className="px-4 py-3 text-left font-medium">Estado del bot</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ContactAvatar name={c.name} color={c.avatarColor} size={36} />
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><ChannelBadge channel={c.channel} withLabel /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      {c.tags.map((t) => (
                        <span key={t} className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.blocked ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Bot bloqueado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Bot activo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => toggleBlockContact(c.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                          c.blocked
                            ? "bg-success/10 text-success hover:bg-success/20"
                            : "bg-destructive/10 text-destructive hover:bg-destructive/20",
                        )}
                      >
                        {c.blocked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                        {c.blocked ? "Desbloquear" : "Bloquear bot"}
                      </button>
                      <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}