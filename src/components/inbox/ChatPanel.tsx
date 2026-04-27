import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, CheckCircle2, Play, Paperclip, Smile, MoreHorizontal } from "lucide-react";
import { useInbox } from "@/lib/inbox-store";
import { ContactAvatar } from "./Avatar";
import { ChannelBadge } from "./ChannelBadge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatRemaining(ms: number) {
  const m = Math.max(0, Math.ceil(ms / 60000));
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h}h ${r}m` : `${h}h`;
  }
  return `${m} min`;
}

export function ChatPanel() {
  const { selectedConversationId, conversations, contacts, messages, sendAgentMessage, resumeBot, resolveConversation } = useInbox();
  const conv = conversations.find((c) => c.id === selectedConversationId) ?? null;
  const contact = conv ? contacts.find((c) => c.id === conv.contactId) ?? null : null;
  const thread = useMemo(
    () => messages.filter((m) => m.conversationId === selectedConversationId).sort((a, b) => a.createdAt - b.createdAt),
    [messages, selectedConversationId],
  );

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread.length, selectedConversationId]);

  if (!conv || !contact) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center text-sm text-muted-foreground">Selecciona una conversación</div>
      </div>
    );
  }

  const paused = conv.botPausedUntil && conv.botPausedUntil > Date.now();
  const remaining = paused ? conv.botPausedUntil! - Date.now() : 0;

  const onSend = () => {
    if (!draft.trim()) return;
    sendAgentMessage(conv.id, draft);
    setDraft("");
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-5 py-3">
        <div className="flex items-center gap-3">
          <ContactAvatar name={contact.name} color={contact.avatarColor} size={40} online />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{contact.name}</h3>
              <ChannelBadge channel={contact.channel} />
            </div>
            <div className="text-xs text-muted-foreground">{contact.phone}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => resolveConversation(conv.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {conv.status === "open" ? "Marcar resuelta" : "Reabrir"}
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {(paused || contact.blocked) && (
        <div
          className={cn(
            "flex items-center justify-between border-b px-5 py-2 text-xs",
            contact.blocked ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning-foreground",
          )}
        >
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            {contact.blocked ? (
              <span>El bot está <strong>bloqueado</strong> para este contacto.</span>
            ) : (
              <span>
                Bot pausado · se reactivará en <strong>{formatRemaining(remaining)}</strong>
              </span>
            )}
          </div>
          {paused && !contact.blocked && (
            <button
              onClick={() => resumeBot(conv.id)}
              className="inline-flex items-center gap-1.5 rounded-md bg-card px-2.5 py-1 font-medium text-foreground shadow-sm hover:bg-muted"
            >
              <Play className="h-3 w-3" /> Reactivar bot
            </button>
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {thread.map((m) => {
            const me = m.sender === "agent";
            const bot = m.sender === "bot";
            return (
              <div key={m.id} className={cn("flex w-full", me ? "justify-end" : "justify-start")}>
                <div className={cn("flex max-w-[78%] flex-col", me ? "items-end" : "items-start")}>
                  {bot && (
                    <div className="mb-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                      <Bot className="h-3 w-3" /> Bot Gemini
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm shadow-[var(--shadow-soft)]",
                      me
                        ? "rounded-br-sm bg-[var(--gradient-bubble-me)] text-primary-foreground"
                        : bot
                          ? "rounded-bl-sm border border-primary/15 bg-primary-soft text-foreground"
                          : "rounded-bl-sm bg-card text-foreground border",
                    )}
                  >
                    {m.text}
                  </div>
                  <span className="mt-1 text-[10px] text-muted-foreground">{format(m.createdAt, "p", { locale: es })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t bg-card px-5 py-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/40">
          <button className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={contact.blocked ? "Este contacto está bloqueado, pero puedes responder manualmente…" : "Escribe un mensaje… (al responder, el bot se pausará 30 min)"}
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
            <Smile className="h-4 w-4" />
          </button>
          <button
            onClick={onSend}
            disabled={!draft.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--gradient-brand)] px-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] transition hover:opacity-95 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}