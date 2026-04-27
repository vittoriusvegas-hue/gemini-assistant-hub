import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, CheckCircle2, Play, Paperclip, Smile, MoreHorizontal, TrendingUp } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
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
  const { selectedConversationId, conversations, contacts, messages, sendAgentMessage, resumeBot, resolveConversation, deals, createDeal, pipelineStages, selectDeal } =
    useInbox();
  const navigate = useNavigate();
  const conv = conversations.find((c) => c.id === selectedConversationId) ?? null;
  const contact = conv ? contacts.find((c) => c.id === conv.contactId) ?? null : null;
  const thread = useMemo(
    () => messages.filter((m) => m.conversationId === selectedConversationId).sort((a, b) => a.createdAt - b.createdAt),
    [messages, selectedConversationId],
  );

  const [draft, setDraft] = useState("");
  const [showDeal, setShowDeal] = useState(false);
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
  const existingDeal = deals.find((d) => d.contactId === contact.id);

  const onSend = () => {
    if (!draft.trim()) return;
    sendAgentMessage(conv.id, draft);
    setDraft("");
  };

  const handleCreateDeal = (input: { title: string; amount: number; currency: string; stage: string }) => {
    const id = createDeal({ title: input.title, contactId: contact.id, amount: input.amount, currency: input.currency, stage: input.stage });
    setShowDeal(false);
    toast.success("Oportunidad creada", { description: `${input.title} se añadió al embudo.` });
    selectDeal(id);
    navigate({ to: "/sales" });
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
          {existingDeal ? (
            <button
              onClick={() => {
                selectDeal(existingDeal.id);
                navigate({ to: "/sales" });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
              title="Ver oportunidad en el embudo"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Ver en embudo
            </button>
          ) : (
            <button
              onClick={() => setShowDeal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              title="Crear una oportunidad de venta a partir de esta conversación"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Enviar al embudo
            </button>
          )}
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

      {showDeal && (
        <SendToFunnelDialog
          contactName={contact.name}
          stages={pipelineStages.map((s) => ({ id: s.id, label: s.label }))}
          onClose={() => setShowDeal(false)}
          onSubmit={handleCreateDeal}
        />
      )}

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
                  <span className="mt-1 text-[10px] text-muted-foreground" suppressHydrationWarning>
                    {format(m.createdAt, "p", { locale: es })}
                  </span>
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

function SendToFunnelDialog({
  contactName,
  stages,
  onClose,
  onSubmit,
}: {
  contactName: string;
  stages: { id: string; label: string }[];
  onClose: () => void;
  onSubmit: (input: { title: string; amount: number; currency: string; stage: string }) => void;
}) {
  const [title, setTitle] = useState(`Oportunidad — ${contactName}`);
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [stage, setStage] = useState(stages[0]?.id ?? "new");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl">
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Enviar al embudo</h3>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Crea una oportunidad de venta vinculada a esta conversación.</p>
        <div className="flex flex-col gap-3 text-sm">
          <label>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Título</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Monto</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="h-9 w-full rounded-lg border bg-background px-2 outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Moneda</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-9 w-full rounded-lg border bg-background px-2 outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option>USD</option>
                <option>EUR</option>
                <option>MXN</option>
                <option>ARS</option>
              </select>
            </label>
          </div>
          <label>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Etapa inicial</span>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background px-2 outline-none focus:ring-2 focus:ring-ring/40"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={() => title.trim() && onSubmit({ title: title.trim(), amount, currency, stage })}
            disabled={!title.trim()}
            className="rounded-lg bg-[var(--gradient-brand)] px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] disabled:opacity-40"
          >
            Crear y abrir
          </button>
        </div>
      </div>
    </div>
  );
}