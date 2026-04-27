import { useMemo, useRef, useState, type DragEvent } from "react";
import {
  Plus,
  Search,
  X,
  Paperclip,
  MessageSquare,
  FileText,
  FileSpreadsheet,
  FileImage,
  File as FileIcon,
  Upload,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  GripVertical,
  Send,
  Tag,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useInbox } from "@/lib/inbox-store";
import { DEAL_STAGES, type Attachment, type Deal, type DealStage } from "@/lib/inbox-types";
import { ContactAvatar } from "./Avatar";
import { cn } from "@/lib/utils";

function fmtMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function attachmentIcon(kind: Attachment["kind"]) {
  switch (kind) {
    case "image":
      return FileImage;
    case "pdf":
      return FileText;
    case "doc":
      return FileText;
    case "sheet":
      return FileSpreadsheet;
    default:
      return FileIcon;
  }
}

function attachmentTint(kind: Attachment["kind"]) {
  switch (kind) {
    case "image":
      return "from-pink-500/20 to-rose-500/10 text-rose-600";
    case "pdf":
      return "from-red-500/20 to-orange-500/10 text-red-600";
    case "doc":
      return "from-blue-500/20 to-indigo-500/10 text-blue-600";
    case "sheet":
      return "from-emerald-500/20 to-teal-500/10 text-emerald-600";
    default:
      return "from-violet-500/20 to-indigo-500/10 text-violet-600";
  }
}

export function SalesPage() {
  const { deals, contacts, selectedDealId, selectDeal, moveDeal, createDeal } = useInbox();
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter((d) => {
      const contact = contacts.find((c) => c.id === d.contactId);
      return (
        d.title.toLowerCase().includes(q) ||
        contact?.name.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [deals, contacts, query]);

  const grouped = useMemo(() => {
    const map = new Map<DealStage, Deal[]>();
    DEAL_STAGES.forEach((s) => map.set(s.id, []));
    filtered.forEach((d) => map.get(d.stage)?.push(d));
    return map;
  }, [filtered]);

  const totals = useMemo(() => {
    const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const won = deals.filter((d) => d.stage === "won");
    const sum = (arr: Deal[]) => arr.reduce((acc, d) => acc + d.amount, 0);
    return {
      openCount: open.length,
      openAmount: sum(open),
      wonCount: won.length,
      wonAmount: sum(won),
    };
  }, [deals]);

  const selected = deals.find((d) => d.id === selectedDealId) ?? null;

  const onDropToStage = (stage: DealStage) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/deal-id");
    if (id) moveDeal(id, stage);
  };

  return (
    <div className="flex flex-1 min-w-0 flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 border-b bg-card px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Embudo de Ventas</h1>
          <p className="text-xs text-muted-foreground">Gestiona tus oportunidades, archivos y comentarios.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 rounded-xl border bg-background px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Abiertas</span>
              <span className="font-semibold">{totals.openCount}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-semibold">{fmtMoney(totals.openAmount, "USD")}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-muted-foreground">Ganadas</span>
              <span className="font-semibold">{totals.wonCount}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-semibold">{fmtMoney(totals.wonAmount, "USD")}</span>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar oportunidad, contacto, etiqueta…"
              className="h-9 w-72 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--gradient-brand)] px-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95"
          >
            <Plus className="h-4 w-4" /> Nueva oportunidad
          </button>
        </div>
      </header>

      {/* Kanban */}
      <div className="flex flex-1 min-h-0 overflow-x-auto overflow-y-hidden bg-muted/30 px-4 py-4">
        <div className="flex gap-3">
          {DEAL_STAGES.map((stage) => {
            const items = grouped.get(stage.id) ?? [];
            const total = items.reduce((acc, d) => acc + d.amount, 0);
            return (
              <div
                key={stage.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropToStage(stage.id)}
                className="flex w-[280px] shrink-0 flex-col rounded-xl border bg-card/60 backdrop-blur"
              >
                <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.accent }} />
                    <h3 className="text-sm font-semibold">{stage.label}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{fmtMoney(total, "USD")}</span>
                </div>
                <div className="flex flex-1 min-h-[120px] flex-col gap-2 overflow-y-auto p-2">
                  {items.map((deal) => {
                    const contact = contacts.find((c) => c.id === deal.contactId);
                    const active = selectedDealId === deal.id;
                    return (
                      <article
                        key={deal.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/deal-id", deal.id)}
                        onClick={() => selectDeal(deal.id)}
                        className={cn(
                          "group cursor-pointer rounded-lg border bg-card p-3 text-left shadow-[var(--shadow-soft)] transition hover:border-primary/40 hover:shadow-[var(--shadow-pop)]",
                          active && "border-primary ring-2 ring-primary/30",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="line-clamp-2 text-sm font-semibold leading-snug">{deal.title}</h4>
                          <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60 opacity-0 group-hover:opacity-100" />
                        </div>
                        {contact && (
                          <div className="mt-2 flex items-center gap-2">
                            <ContactAvatar name={contact.name} color={contact.avatarColor} size={20} />
                            <span className="truncate text-xs text-muted-foreground">{contact.name}</span>
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground tabular-nums">
                            {fmtMoney(deal.amount, deal.currency)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="h-3 w-3" /> {deal.probability}%
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Paperclip className="h-3 w-3" /> {deal.attachments.length}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {deal.comments.length}
                          </span>
                          <span className="ml-auto inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(deal.expectedCloseAt, "d MMM", { locale: es })}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="grid h-24 place-items-center rounded-lg border border-dashed text-[11px] text-muted-foreground">
                      Suelta aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && <DealDetail deal={selected} onClose={() => selectDeal(null)} />}
      {showNew && <NewDealDialog onClose={() => setShowNew(false)} onCreate={(input) => { createDeal(input); setShowNew(false); }} />}
    </div>
  );
}

function DealDetail({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const { contacts, messages, addDealAttachment, removeDealAttachment, addDealComment, updateDeal, moveDeal } = useInbox();
  const contact = contacts.find((c) => c.id === deal.contactId);
  const chatFiles = useMemo(
    () => messages.filter((m) => m.conversationId === deal.conversationId && /\.(png|jpg|jpeg|pdf|docx?|xlsx?)$/i.test(m.text)),
    [messages, deal.conversationId],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");

  const onUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const kind: Attachment["kind"] = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)
        ? "image"
        : ext === "pdf"
          ? "pdf"
          : ["doc", "docx"].includes(ext)
            ? "doc"
            : ["xls", "xlsx", "csv"].includes(ext)
              ? "sheet"
              : "file";
      addDealAttachment(deal.id, {
        name: f.name,
        kind,
        size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
        source: "reference",
        uploadedBy: "Tú",
      });
    });
  };

  const chatAttachments = deal.attachments.filter((a) => a.source === "chat");
  const refAttachments = deal.attachments.filter((a) => a.source === "reference");

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-[560px] flex-col bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: DEAL_STAGES.find((s) => s.id === deal.stage)?.accent }}
              />
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {DEAL_STAGES.find((s) => s.id === deal.stage)?.label}
              </span>
            </div>
            <h2 className="mt-1 truncate text-base font-semibold">{deal.title}</h2>
            {contact && (
              <div className="mt-2 flex items-center gap-2">
                <ContactAvatar name={contact.name} color={contact.avatarColor} size={22} />
                <span className="text-xs text-muted-foreground">{contact.name} · {contact.phone}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px border-b bg-border">
          <div className="bg-card px-4 py-3">
            <div className="flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
              <DollarSign className="h-3 w-3" /> Monto
            </div>
            <div className="mt-1 text-sm font-semibold tabular-nums">{fmtMoney(deal.amount, deal.currency)}</div>
          </div>
          <div className="bg-card px-4 py-3">
            <div className="flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> Probabilidad
            </div>
            <div className="mt-1 text-sm font-semibold tabular-nums">{deal.probability}%</div>
          </div>
          <div className="bg-card px-4 py-3">
            <div className="flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
              <Calendar className="h-3 w-3" /> Cierre
            </div>
            <div className="mt-1 text-sm font-semibold">{format(deal.expectedCloseAt, "d MMM yyyy", { locale: es })}</div>
          </div>
        </div>

        {/* Stage selector */}
        <div className="flex flex-wrap gap-1.5 border-b px-5 py-3">
          {DEAL_STAGES.map((s) => {
            const active = s.id === deal.stage;
            return (
              <button
                key={s.id}
                onClick={() => moveDeal(deal.id, s.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.accent }} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Body scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Tags */}
          {deal.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {deal.tags.map((t) => (
                <span key={t} className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Quick edit amount/prob */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <label className="text-xs">
              <span className="mb-1 block font-medium text-muted-foreground">Monto</span>
              <input
                type="number"
                value={deal.amount}
                onChange={(e) => updateDeal(deal.id, { amount: Number(e.target.value) || 0 })}
                className="h-9 w-full rounded-lg border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium text-muted-foreground">Probabilidad ({deal.probability}%)</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={deal.probability}
                onChange={(e) => updateDeal(deal.id, { probability: Number(e.target.value) })}
                className="mt-2 w-full accent-[color:var(--primary)]"
              />
            </label>
          </div>

          {/* Chat attachments */}
          <Section
            title="Archivos del chat"
            count={chatAttachments.length}
            hint="Recibidos en la conversación"
          >
            {chatAttachments.length === 0 && chatFiles.length === 0 ? (
              <Empty>El contacto aún no envió archivos por el chat.</Empty>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {chatAttachments.map((a) => (
                  <AttachmentCard key={a.id} attachment={a} onRemove={() => removeDealAttachment(deal.id, a.id)} />
                ))}
              </div>
            )}
          </Section>

          {/* Reference files */}
          <Section
            title="Archivos de referencia"
            count={refAttachments.length}
            hint="Material para la venta"
            action={
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/15"
              >
                <Upload className="h-3 w-3" /> Subir
              </button>
            }
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                onUpload(e.target.files);
                e.target.value = "";
              }}
            />
            {refAttachments.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="grid h-24 w-full place-items-center rounded-lg border border-dashed text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Arrastra o haz clic para subir
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {refAttachments.map((a) => (
                  <AttachmentCard key={a.id} attachment={a} onRemove={() => removeDealAttachment(deal.id, a.id)} />
                ))}
              </div>
            )}
          </Section>

          {/* Comments */}
          <Section title="Comentarios" count={deal.comments.length}>
            <div className="flex flex-col gap-2">
              {deal.comments.map((c) => (
                <div key={c.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{c.author}</span>
                    <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                      {formatDistanceToNow(c.createdAt, { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-snug text-foreground">{c.text}</p>
                </div>
              ))}
              {deal.comments.length === 0 && <Empty>Sin comentarios todavía.</Empty>}
            </div>
          </Section>
        </div>

        {/* Comment composer */}
        <div className="border-t bg-card px-5 py-3">
          <div className="flex items-end gap-2 rounded-xl border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/40">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (comment.trim()) {
                    addDealComment(deal.id, comment);
                    setComment("");
                  }
                }
              }}
              rows={1}
              placeholder="Añade un comentario interno…  (⌘/Ctrl + Enter para enviar)"
              className="max-h-28 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => {
                if (!comment.trim()) return;
                addDealComment(deal.id, comment);
                setComment("");
              }}
              disabled={!comment.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--gradient-brand)] px-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" /> Enviar
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Section({
  title,
  count,
  hint,
  action,
  children,
}: {
  title: string;
  count?: number;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
            {typeof count === "number" && (
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-foreground/70">{count}</span>
            )}
          </h3>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">{children}</div>
  );
}

function AttachmentCard({ attachment, onRemove }: { attachment: Attachment; onRemove: () => void }) {
  const Icon = attachmentIcon(attachment.kind);
  const tint = attachmentTint(attachment.kind);
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <div className={cn("flex h-20 items-center justify-center bg-gradient-to-br", tint)}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="px-2 py-2">
        <div className="truncate text-[11px] font-medium" title={attachment.name}>
          {attachment.name}
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{attachment.size ?? ""}</span>
          <span>{attachment.uploadedBy}</span>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-background/80 text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function NewDealDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { title: string; contactId: string; amount: number; currency: string; stage: DealStage }) => void;
}) {
  const { contacts } = useInbox();
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [stage, setStage] = useState<DealStage>("new");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Nueva oportunidad</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <label>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Título</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Plan Pro — María"
              className="h-9 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Contacto</span>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background px-2 outline-none focus:ring-2 focus:ring-ring/40"
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Etapa</span>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as DealStage)}
              className="h-9 w-full rounded-lg border bg-background px-2 outline-none focus:ring-2 focus:ring-ring/40"
            >
              {DEAL_STAGES.map((s) => (
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
            onClick={() => contactId && onCreate({ title, contactId, amount, currency, stage })}
            disabled={!title.trim() || !contactId}
            className="rounded-lg bg-[var(--gradient-brand)] px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] disabled:opacity-40"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}