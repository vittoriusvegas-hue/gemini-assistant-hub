import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, CheckCircle2, Play, Paperclip, Smile, TrendingUp, UserPlus, ArrowLeft, Pause, Trash2, Ban, ShieldOff, MailOpen, Mail, Copy, Reply, X, Mic, FileText, Download, ImageIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useInbox } from "@/lib/inbox-store";
import { ContactAvatar } from "./Avatar";
import { ChannelBadge } from "./ChannelBadge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MoreMenu, type MenuAction } from "./MoreMenu";
import { useAuth } from "@/lib/auth-store";
import { AudioPlayer } from "./AudioPlayer";
import { SwipeToReply } from "./MessageBubble";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

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
  const {
    selectedConversationId, conversations, contacts, messages, sendAgentMessage,
    resumeBot, resolveConversation, deals, createDeal, pipelineStages, selectDeal,
    saveContact, selectConversation, deleteConversation, toggleUnread, toggleBotPause,
    toggleBlockContact, sendAgentReply,
    draftContactId, cancelDraftConversation,
  } = useInbox();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const realConv = conversations.find((c) => c.id === selectedConversationId) ?? null;
  const isDraft = !realConv && !!draftContactId;
  // Synthesize a conversation-like object so the rest of the panel can work uniformly.
  const conv = realConv ?? (isDraft
    ? {
        id: `draft:${draftContactId!}`,
        contactId: draftContactId!,
        unread: 0,
        lastMessageAt: Date.now(),
        status: "open" as const,
        botPausedUntil: null,
      }
    : null);
  const contact = conv ? contacts.find((c) => c.id === conv.contactId) ?? null : null;
  const thread = useMemo(
    () =>
      isDraft
        ? []
        : messages.filter((m) => m.conversationId === selectedConversationId).sort((a, b) => a.createdAt - b.createdAt),
    [messages, selectedConversationId, isDraft],
  );

  const [draft, setDraft] = useState("");
  const [showDeal, setShowDeal] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const lastText = thread[thread.length - 1]?.text ?? "";

  const moreActions: MenuAction[] = [
    {
      label: conv.status === "open" ? "Marcar como resuelta" : "Reabrir conversación",
      icon: CheckCircle2,
      onClick: () => {
        resolveConversation(conv.id);
        toast.success(conv.status === "open" ? "Conversación resuelta" : "Conversación reabierta");
      },
      hidden: isDraft,
    },
    {
      label: conv.unread > 0 ? "Marcar como leída" : "Marcar como no leída",
      icon: conv.unread > 0 ? MailOpen : Mail,
      onClick: () => toggleUnread(conv.id),
      hidden: isDraft,
    },
    {
      label: paused ? "Reactivar bot ahora" : "Pausar bot 30 min",
      icon: paused ? Play : Pause,
      onClick: () => {
        if (paused) {
          resumeBot(conv.id);
          toast.success("Bot reactivado");
        } else {
          toggleBotPause(conv.id);
          toast("Bot pausado por 30 min");
        }
      },
      divider: true,
      hidden: isDraft,
    },
    {
      label: "Copiar último mensaje",
      icon: Copy,
      onClick: () => {
        if (!lastText) return;
        navigator.clipboard?.writeText(lastText).then(
          () => toast.success("Mensaje copiado"),
          () => toast.error("No se pudo copiar"),
        );
      },
      disabled: !lastText,
    },
    {
      label: contact.blocked ? "Desbloquear contacto" : "Bloquear contacto",
      icon: contact.blocked ? ShieldOff : Ban,
      onClick: () => {
        toggleBlockContact(contact.id);
        toast(contact.blocked ? "Contacto desbloqueado" : "Contacto bloqueado");
      },
      destructive: !contact.blocked,
      divider: true,
    },
    {
      label: "Eliminar conversación",
      icon: Trash2,
      onClick: () => {
        if (typeof window !== "undefined" && !window.confirm("¿Eliminar esta conversación? Esta acción no se puede deshacer.")) return;
        deleteConversation(conv.id);
        toast.success("Conversación eliminada");
      },
      destructive: true,
      hidden: !isAdmin || isDraft,
    },
  ];

  const onSend = () => {
    if (!draft.trim()) return;
    if (replyToId) {
      sendAgentReply(conv.id, draft, replyToId);
    } else {
      sendAgentMessage(conv.id, draft);
    }
    setDraft("");
    setReplyToId(null);
    setShowEmoji(false);
  };

  const onPickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result);
        const isImage = file.type.startsWith("image/");
        const attachment = {
          url,
          name: file.name,
          mime: file.type,
          size: file.size,
          kind: isImage ? ("image" as const) : ("file" as const),
        };
        if (replyToId) {
          sendAgentReply(conv.id, draft || (isImage ? "📷 Imagen" : `📎 ${file.name}`), replyToId, { attachment });
        } else {
          sendAgentMessage(conv.id, draft || (isImage ? "📷 Imagen" : `📎 ${file.name}`), { attachment });
        }
      };
      reader.readAsDataURL(file);
    });
    setDraft("");
    setReplyToId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      setDraft((d) => d + emoji);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const startReply = (mid: string) => {
    setReplyToId(mid);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const replyTarget = replyToId ? thread.find((m) => m.id === replyToId) : null;
  const replyTargetContact = replyTarget?.sender === "contact";

  const handleCreateDeal = (input: { title: string; amount: number; currency: string; stage: string }) => {
    const id = createDeal({ title: input.title, contactId: contact.id, amount: input.amount, currency: input.currency, stage: input.stage });
    setShowDeal(false);
    toast.success("Oportunidad creada", { description: `${input.title} se añadió al embudo.` });
    selectDeal(id);
    navigate({ to: "/sales" });
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="flex items-center justify-between gap-2 border-b bg-card px-3 py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <button
            onClick={() => {
              if (isDraft) cancelDraftConversation();
              else selectConversation(null);
            }}
            className="-ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
            title="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <ContactAvatar name={contact.name} color={contact.avatarColor} size={40} online />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{contact.name}</h3>
              <ChannelBadge channel={contact.channel} />
              {isDraft && (
                <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  Nueva conversación
                </span>
              )}
              {!contact.saved && (
                <span className="hidden rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground sm:inline">
                  No guardado
                </span>
              )}
            </div>
            <div className="truncate text-xs text-muted-foreground">{contact.phone}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!contact.saved && (
            <button
              onClick={() => setShowSave(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              title="Agregar este número a tus contactos"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agregar a contactos</span>
            </button>
          )}
          {existingDeal ? (
            <button
              onClick={() => {
                selectDeal(existingDeal.id);
                navigate({ to: "/sales" });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-primary-soft px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
              title="Ver oportunidad en el embudo"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver en embudo</span>
            </button>
          ) : (
            <button
              onClick={() => setShowDeal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              title="Crear una oportunidad de venta a partir de esta conversación"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Enviar al embudo</span>
            </button>
          )}
          <button
            onClick={() => resolveConversation(conv.id)}
            className="hidden items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted sm:inline-flex"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {conv.status === "open" ? "Marcar resuelta" : "Reabrir"}
          </button>
          <MoreMenu actions={moreActions} align="right" />
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

      {showSave && (
        <SaveContactDialog
          phone={contact.phone}
          channel={contact.channel}
          defaultName={contact.name}
          onClose={() => setShowSave(false)}
          onSubmit={(patch) => {
            saveContact(contact.id, patch);
            setShowSave(false);
            toast.success("Contacto guardado", { description: `${patch.name} se añadió a tu lista.` });
          }}
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {isDraft && thread.length === 0 && (
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-dashed bg-card/60 p-5 text-center">
              <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
                <Send className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">Inicia una conversación con {contact.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Escribe el primer mensaje. La conversación aparecerá en la bandeja en cuanto lo envíes.
              </p>
            </div>
          )}
          {thread.map((m) => {
            const me = m.sender === "agent";
            const bot = m.sender === "bot";
            const quoted = m.replyToId ? thread.find((x) => x.id === m.replyToId) : null;
            const quotedAuthor = quoted
              ? quoted.sender === "agent"
                ? "Tú"
                : quoted.sender === "bot"
                  ? "Bot Gemini"
                  : contact.name
              : "";
            return (
              <SwipeToReply key={m.id} side={me ? "right" : "left"} onReply={() => startReply(m.id)}>
                <div className={cn("flex w-full", me ? "justify-end" : "justify-start")}>
                  <div className={cn("group flex max-w-[78%] flex-col", me ? "items-end" : "items-start")}>
                    {bot && (
                      <div className="mb-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                        <Bot className="h-3 w-3" /> Bot Gemini
                      </div>
                    )}
                    <div className="relative">
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2 text-sm shadow-[var(--shadow-soft)]",
                          m.audio ? "min-w-[240px]" : "px-4",
                          me
                            ? "rounded-br-sm bg-[var(--gradient-bubble-me)] text-primary-foreground"
                            : bot
                              ? "rounded-bl-sm border border-primary/15 bg-primary-soft text-foreground"
                              : "rounded-bl-sm bg-card text-foreground border",
                        )}
                      >
                        {quoted && (
                          <button
                            onClick={() => {
                              const el = document.getElementById(`msg-${quoted.id}`);
                              el?.scrollIntoView({ behavior: "smooth", block: "center" });
                              el?.classList.add("ring-2", "ring-primary/50");
                              setTimeout(() => el?.classList.remove("ring-2", "ring-primary/50"), 1200);
                            }}
                            className={cn(
                              "mb-1.5 block w-full rounded-md border-l-2 px-2 py-1 text-left text-xs",
                              me
                                ? "border-white/70 bg-white/15 text-primary-foreground/90"
                                : "border-primary bg-primary/10 text-foreground/80",
                            )}
                          >
                            <div className={cn("text-[10px] font-semibold", me ? "text-white" : "text-primary")}>
                              {quotedAuthor}
                            </div>
                            <div className="line-clamp-2 opacity-90">
                              {quoted.audio ? "🎤 Mensaje de voz" : quoted.text || "(mensaje)"}
                            </div>
                          </button>
                        )}
                        <div id={`msg-${m.id}`} className="rounded-md transition-shadow">
                          {m.audio ? (
                            <AudioPlayer
                              url={m.audio.url}
                              durationSec={m.audio.durationSec}
                              variant={me ? "outgoing" : "incoming"}
                            />
                          ) : m.attachment?.kind === "image" ? (
                            <div className="flex flex-col gap-1.5">
                              <button
                                type="button"
                                onClick={() => setLightbox({ url: m.attachment!.url, name: m.attachment!.name })}
                                className="block overflow-hidden rounded-lg"
                                title="Ver imagen"
                              >
                                <img
                                  src={m.attachment.url}
                                  alt={m.attachment.name}
                                  className="max-h-72 w-full max-w-[320px] object-cover"
                                  loading="lazy"
                                />
                              </button>
                              {m.text && m.text !== "📷 Imagen" && (
                                <span className="whitespace-pre-wrap break-words">{m.text}</span>
                              )}
                            </div>
                          ) : m.attachment ? (
                            <a
                              href={m.attachment.url}
                              download={m.attachment.name}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
                                me ? "border-white/30 bg-white/10" : "border-border bg-muted/40",
                              )}
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="min-w-0 flex-1 truncate">{m.attachment.name}</span>
                              <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
                            </a>
                          ) : (
                            <span className="whitespace-pre-wrap break-words">{m.text}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => startReply(m.id)}
                        className={cn(
                          "absolute top-1/2 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full border bg-card text-muted-foreground shadow-sm hover:bg-muted group-hover:grid",
                          me ? "-left-9" : "-right-9",
                        )}
                        title="Responder a este mensaje"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="mt-1 text-[10px] text-muted-foreground" suppressHydrationWarning>
                      {format(m.createdAt, "p", { locale: es })}
                    </span>
                  </div>
                </div>
              </SwipeToReply>
            );
          })}
        </div>
      </div>

      <div
        className="border-t bg-card px-3 py-3 md:px-5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        <div className="mx-auto max-w-3xl">
          {replyTarget && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs">
              <Reply className="h-3.5 w-3.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-primary">
                  Respondiendo a {replyTargetContact ? contact.name : replyTarget.sender === "bot" ? "Bot Gemini" : "ti"}
                </div>
                <div className="truncate text-foreground/80">
                  {replyTarget.audio ? (
                    <span className="inline-flex items-center gap-1"><Mic className="h-3 w-3" /> Mensaje de voz</span>
                  ) : (
                    replyTarget.text
                  )}
                </div>
              </div>
              <button
                onClick={() => setReplyToId(null)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                title="Cancelar respuesta"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-xl border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/40">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            className="hidden"
            onChange={(e) => onPickFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            title="Adjuntar archivo"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              } else if (e.key === "Escape" && replyToId) {
                setReplyToId(null);
              }
            }}
            placeholder={contact.blocked ? "Este contacto está bloqueado, pero puedes responder manualmente…" : "Escribe un mensaje… (al responder, el bot se pausará 30 min)"}
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-lg hover:bg-muted",
                showEmoji ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
              title="Emojis"
            >
              <Smile className="h-4 w-4" />
            </button>
            {showEmoji && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
                <div className="absolute bottom-11 right-0 z-50">
                  <Suspense fallback={<div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground shadow-xl">Cargando…</div>}>
                    <EmojiPicker
                      onEmojiClick={(e) => insertEmoji(e.emoji)}
                      width={320}
                      height={380}
                      lazyLoadEmojis
                      searchPlaceholder="Buscar emoji"
                      previewConfig={{ showPreview: false }}
                    />
                  </Suspense>
                </div>
              </>
            )}
          </div>
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

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
          <a
            href={lightbox.url}
            download={lightbox.name}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-16 top-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/20"
            title="Descargar"
          >
            <Download className="h-3.5 w-3.5" /> Descargar
          </a>
          <img
            src={lightbox.url}
            alt={lightbox.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[92vw] rounded-lg shadow-2xl"
          />
        </div>
      )}
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
function SaveContactDialog({
  phone,
  channel,
  defaultName,
  onClose,
  onSubmit,
}: {
  phone: string;
  channel: string;
  defaultName: string;
  onClose: () => void;
  onSubmit: (patch: { name: string; email?: string; tags: string[] }) => void;
}) {
  const looksLikePhone = /^\+?[\d\s()-]+$/.test(defaultName.trim());
  const [name, setName] = useState(looksLikePhone ? "" : defaultName);
  const [email, setEmail] = useState("");
  const [tagsStr, setTagsStr] = useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl">
        <div className="mb-1 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-primary">+</span>
          <h3 className="text-base font-semibold">Agregar a contactos</h3>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Guarda este número ({phone} · {channel}) en tu lista de contactos para gestionarlo mejor.
        </p>
        <div className="flex flex-col gap-3 text-sm">
          <label>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Nombre *</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="h-9 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Email (opcional)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="h-9 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Etiquetas (separadas por coma)</span>
            <input
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="Lead, VIP"
              className="h-9 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={() =>
              name.trim() &&
              onSubmit({
                name: name.trim(),
                email: email.trim() || undefined,
                tags: tagsStr
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            disabled={!name.trim()}
            className="rounded-lg bg-[var(--gradient-brand)] px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] disabled:opacity-40"
          >
            Guardar contacto
          </button>
        </div>
      </div>
    </div>
  );
}
