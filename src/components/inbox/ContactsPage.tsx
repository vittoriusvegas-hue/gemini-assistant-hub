import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  ShieldOff,
  ShieldCheck,
  MoreVertical,
  Plus,
  MessageSquare,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  Tag as TagIcon,
  UserPlus,
} from "lucide-react";
import { useInbox } from "@/lib/inbox-store";
import { ContactAvatar } from "./Avatar";
import { ChannelBadge } from "./ChannelBadge";
import { cn } from "@/lib/utils";
import type { Channel, Contact } from "@/lib/inbox-types";

const CHANNELS: Channel[] = ["whatsapp", "webhook", "instagram", "messenger"];

export function ContactsPage() {
  const { contacts, conversations, toggleBlockContact, addContact, updateContact, deleteContact, selectConversation } = useInbox();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "blocked">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ mode: "new" } | { mode: "edit"; contact: Contact } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null);

  const filtered = contacts.filter((c) => {
    if (filter === "active" && c.blocked) return false;
    if (filter === "blocked" && !c.blocked) return false;
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      c.name.toLowerCase().includes(needle) ||
      c.phone.toLowerCase().includes(needle) ||
      (c.email?.toLowerCase().includes(needle) ?? false)
    );
  });

  const openChat = (contact: Contact) => {
    const conv = conversations.find((c) => c.contactId === contact.id);
    if (conv) {
      selectConversation(conv.id);
      navigate({ to: "/" });
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b bg-card/60 backdrop-blur px-4 py-4 md:px-8 md:py-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Contactos</h1>
          <p className="text-sm text-muted-foreground">Gestiona quién puede interactuar con el bot.</p>
        </div>
        <button
          onClick={() => setDialog({ mode: "new" })}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--gradient-brand)] px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95"
        >
          <UserPlus className="h-4 w-4" /> Nuevo contacto
        </button>
      </header>

      <div className="flex items-center gap-3 border-b bg-card px-4 py-3 md:px-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, teléfono o email..."
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
              {f === "all" ? `Todos (${contacts.length})` : f === "active" ? "Activos" : "Bloqueados"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 md:px-8 md:pb-4">
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
                      <div className="min-w-0">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.phone}
                          {c.email && <span className="ml-2 text-muted-foreground/60">· {c.email}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ChannelBadge channel={c.channel} withLabel />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary"
                        >
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
                      <RowMenu
                        open={openMenuId === c.id}
                        onOpenChange={(o) => setOpenMenuId(o ? c.id : null)}
                        onChat={() => openChat(c)}
                        onEdit={() => setDialog({ mode: "edit", contact: c })}
                        onDelete={() => setConfirmDelete(c)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Sin contactos</p>
                        <p className="mt-1 text-xs">Crea tu primer contacto para empezar.</p>
                      </div>
                      <button
                        onClick={() => setDialog({ mode: "new" })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-95"
                      >
                        <Plus className="h-3.5 w-3.5" /> Nuevo contacto
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dialog && (
        <ContactDialog
          mode={dialog.mode}
          initial={dialog.mode === "edit" ? dialog.contact : undefined}
          onClose={() => setDialog(null)}
          onSubmit={(data) => {
            if (dialog.mode === "new") {
              addContact(data);
            } else {
              updateContact(dialog.contact.id, data);
            }
            setDialog(null);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar contacto"
          message={
            <>
              ¿Eliminar a <strong>{confirmDelete.name}</strong>? Esta acción borrará también sus conversaciones y mensajes.
            </>
          }
          confirmLabel="Eliminar"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteContact(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}

function RowMenu({
  open,
  onOpenChange,
  onChat,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChat: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border bg-popover py-1 text-popover-foreground shadow-lg">
          <MenuItem icon={<MessageSquare className="h-3.5 w-3.5" />} onClick={() => { onOpenChange(false); onChat(); }}>
            Ver conversación
          </MenuItem>
          <MenuItem icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { onOpenChange(false); onEdit(); }}>
            Editar contacto
          </MenuItem>
          <div className="my-1 h-px bg-border" />
          <MenuItem
            icon={<Trash2 className="h-3.5 w-3.5" />}
            danger
            onClick={() => { onOpenChange(false); onDelete(); }}
          >
            Eliminar
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition",
        danger ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-muted",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

interface ContactFormData {
  name: string;
  phone: string;
  email?: string;
  channel: Channel;
  tags: string[];
}

function ContactDialog({
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  mode: "new" | "edit";
  initial?: Contact;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [channel, setChannel] = useState<Channel>(initial?.channel ?? "whatsapp");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const valid = name.trim().length > 1 && phone.trim().length > 3;

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) {
      setTagInput("");
      return;
    }
    setTags([...tags, t]);
    setTagInput("");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {mode === "new" ? "Nuevo contacto" : "Editar contacto"}
          </h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <Field label="Nombre completo" required>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. María González"
              className="input-base"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono" required icon={<Phone className="h-3.5 w-3.5" />}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="input-base"
              />
            </Field>
            <Field label="Canal">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as Channel)}
                className="input-base"
              >
                {CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch === "whatsapp"
                      ? "WhatsApp"
                      : ch === "webhook"
                        ? "Webhook"
                        : ch === "instagram"
                          ? "Instagram"
                          : "Messenger"}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Email" icon={<Mail className="h-3.5 w-3.5" />}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="opcional"
              className="input-base"
            />
          </Field>

          <Field label="Etiquetas" icon={<TagIcon className="h-3.5 w-3.5" />}>
            <div className="flex flex-wrap gap-1.5 rounded-lg border bg-background p-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="text-primary/70 hover:text-primary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  } else if (e.key === "Backspace" && !tagInput && tags.length) {
                    setTags(tags.slice(0, -1));
                  }
                }}
                placeholder={tags.length ? "" : "Pulsa Enter para añadir…"}
                className="min-w-[120px] flex-1 bg-transparent text-xs outline-none"
              />
            </div>
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={() =>
              onSubmit({
                name: name.trim(),
                phone: phone.trim(),
                email: email.trim() || undefined,
                channel,
                tags,
              })
            }
            disabled={!valid}
            className="rounded-lg bg-[var(--gradient-brand)] px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] disabled:opacity-40"
          >
            {mode === "new" ? "Crear contacto" : "Guardar cambios"}
          </button>
        </div>
      </div>

      <style>{`.input-base{height:2.25rem;width:100%;border-radius:.5rem;border:1px solid var(--border);background:var(--background);padding:0 .75rem;font-size:.875rem;outline:none;}
      .input-base:focus{box-shadow:0 0 0 2px color-mix(in oklab, var(--ring) 40%, transparent);}`}</style>
    </div>
  );
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          {danger && (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)]",
              danger ? "bg-destructive" : "bg-primary",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}