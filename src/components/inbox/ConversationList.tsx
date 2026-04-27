import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { useInbox } from "@/lib/inbox-store";
import { ContactAvatar } from "./Avatar";
import { ChannelBadge } from "./ChannelBadge";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";

export function ConversationList() {
  const { conversations, contacts, selectedConversationId, selectConversation, messages } = useInbox();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"open" | "resolved" | "all">("open");

  const items = useMemo(() => {
    return conversations
      .filter((c) => (tab === "all" ? true : c.status === tab))
      .map((c) => {
        const contact = contacts.find((ct) => ct.id === c.contactId)!;
        const last = [...messages].reverse().find((m) => m.conversationId === c.id);
        return { conv: c, contact, last };
      })
      .filter(({ contact, last }) => {
        if (!q) return true;
        const n = q.toLowerCase();
        return contact.name.toLowerCase().includes(n) || (last?.text.toLowerCase().includes(n) ?? false);
      })
      .sort((a, b) => b.conv.lastMessageAt - a.conv.lastMessageAt);
  }, [conversations, contacts, messages, q, tab]);

  return (
    <div className="flex w-[340px] shrink-0 flex-col border-r bg-card">
      <div className="border-b px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Bandeja</h2>
          <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
            <Filter className="h-4 w-4" />
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar conversación..."
            className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="mt-3 flex gap-1 rounded-lg bg-secondary p-1">
          {(["open", "resolved", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition",
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {t === "open" ? "Abiertas" : t === "resolved" ? "Resueltas" : "Todas"}
            </button>
          ))}
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {items.map(({ conv, contact, last }) => {
          const active = conv.id === selectedConversationId;
          const paused = conv.botPausedUntil && conv.botPausedUntil > Date.now();
          return (
            <li key={conv.id}>
              <button
                onClick={() => selectConversation(conv.id)}
                className={cn(
                  "group flex w-full gap-3 border-l-2 px-4 py-3 text-left transition",
                  active
                    ? "border-l-primary bg-primary-soft/40"
                    : "border-l-transparent hover:bg-muted/40",
                )}
              >
                <ContactAvatar name={contact.name} color={contact.avatarColor} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate text-sm font-semibold">{contact.name}</span>
                      <ChannelBadge channel={contact.channel} />
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDistanceToNowStrict(conv.lastMessageAt, { locale: es, addSuffix: false })}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted-foreground">
                      {last?.sender === "agent" && <span className="font-medium text-foreground/70">Tú: </span>}
                      {last?.sender === "bot" && <span className="font-medium text-primary">Bot: </span>}
                      {last?.text}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
                      {contact.blocked && (
                        <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                          Bloqueado
                        </span>
                      )}
                      {paused && !contact.blocked && (
                        <span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground">
                          Pausado
                        </span>
                      )}
                      {conv.unread > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="px-4 py-12 text-center text-sm text-muted-foreground">Sin conversaciones</li>
        )}
      </ul>
    </div>
  );
}