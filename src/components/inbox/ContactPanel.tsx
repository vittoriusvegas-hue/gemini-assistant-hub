import { Bot, ShieldOff, ShieldCheck, Mail, Phone, Tag, Webhook, Clock, UserPlus } from "lucide-react";
import { useInbox } from "@/lib/inbox-store";
import { ContactAvatar } from "./Avatar";
import { ChannelBadge } from "./ChannelBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function ContactPanel() {
  const { selectedConversationId, conversations, contacts, toggleBlockContact, simulateIncoming } = useInbox();
  const conv = conversations.find((c) => c.id === selectedConversationId);
  const contact = conv ? contacts.find((c) => c.id === conv.contactId) : null;
  if (!contact || !conv) {
    return <aside className="hidden w-[320px] shrink-0 border-l bg-card lg:block" />;
  }
  const paused = conv.botPausedUntil && conv.botPausedUntil > Date.now();

  return (
    <aside className="hidden w-[320px] shrink-0 flex-col overflow-y-auto border-l bg-card lg:flex">
      <div className="flex flex-col items-center px-6 pt-8 pb-5 text-center">
        <ContactAvatar name={contact.name} color={contact.avatarColor} size={72} online />
        <h3 className="mt-3 text-base font-semibold">{contact.name}</h3>
        <div className="mt-1"><ChannelBadge channel={contact.channel} withLabel /></div>
        {!contact.saved && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
            Contacto no guardado
          </span>
        )}
      </div>

      {!contact.saved && (
        <div className="px-6 pb-2">
          <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs">
            <p className="mb-2 text-muted-foreground">
              Este número escribió por primera vez y aún no está en tu lista. Guárdalo para añadir nombre, etiquetas y notas.
            </p>
            <p className="text-[11px] text-muted-foreground">Usa el botón <strong>Agregar a contactos</strong> en la parte superior del chat.</p>
          </div>
        </div>
      )}

      <div className="px-6 pb-5">
        <button
          onClick={() => toggleBlockContact(contact.id)}
          className={
            "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition " +
            (contact.blocked
              ? "bg-success/10 text-success hover:bg-success/20"
              : "bg-destructive/10 text-destructive hover:bg-destructive/20")
          }
        >
          {contact.blocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
          {contact.blocked ? "Desbloquear bot" : "Bloquear bot para este contacto"}
        </button>
      </div>

      <Section title="Estado del bot">
        <div className="flex items-center gap-2 text-sm">
          <Bot className="h-4 w-4 text-primary" />
          {contact.blocked ? (
            <span className="text-destructive">Bot bloqueado</span>
          ) : paused ? (
            <span className="text-warning-foreground">
              Pausado hasta <strong>{format(conv.botPausedUntil!, "p", { locale: es })}</strong>
            </span>
          ) : (
            <span className="text-success">Activo · responderá automáticamente</span>
          )}
        </div>
        {paused && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> Tras tu respuesta, el bot se pausa 30 min.
          </div>
        )}
      </Section>

      <Section title="Información">
        <Row icon={<Phone className="h-3.5 w-3.5" />} label={contact.phone} />
        {contact.email && <Row icon={<Mail className="h-3.5 w-3.5" />} label={contact.email} />}
      </Section>

      {contact.tags.length > 0 && (
        <Section title="Etiquetas">
          <div className="flex flex-wrap gap-1.5">
            {contact.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                <Tag className="h-3 w-3" />
                {t}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Demo · Webhook entrante">
        <p className="mb-2 text-xs text-muted-foreground">
          Simula un mensaje entrante para probar la respuesta del bot.
        </p>
        <button
          onClick={() => simulateIncoming(contact.id, "Hola, mensaje de prueba 👋")}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <Webhook className="h-3.5 w-3.5" /> Simular mensaje
        </button>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t px-6 py-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}