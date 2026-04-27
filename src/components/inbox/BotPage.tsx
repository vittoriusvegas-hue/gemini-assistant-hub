import { Bot, Sparkles, Clock, ShieldOff } from "lucide-react";
import { useInbox } from "@/lib/inbox-store";

export function BotPage() {
  const { conversations, contacts } = useInbox();
  const blocked = contacts.filter((c) => c.blocked).length;
  const paused = conversations.filter((c) => c.botPausedUntil && c.botPausedUntil > Date.now()).length;
  const handled = 142;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto pb-20 md:pb-0">
      <header className="border-b bg-card/60 backdrop-blur px-4 py-4 md:px-8 md:py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--gradient-brand)] text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Bot IA — Gemini</h1>
            <p className="text-sm text-muted-foreground">Configura el comportamiento del asistente automático.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-8 md:grid-cols-3">
        <Stat icon={<Sparkles className="h-4 w-4" />} label="Mensajes respondidos hoy" value={handled} accent="primary" />
        <Stat icon={<Clock className="h-4 w-4" />} label="Conversaciones en pausa" value={paused} accent="warning" />
        <Stat icon={<ShieldOff className="h-4 w-4" />} label="Contactos bloqueados" value={blocked} accent="destructive" />
      </div>

      <div className="mx-8 mb-8 rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold">Comportamiento</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          El bot responde automáticamente con Gemini cuando llega un mensaje nuevo, salvo que:
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
            Un agente haya respondido en los últimos <strong>30 minutos</strong> en esa conversación.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-destructive" />
            El contacto esté <strong>bloqueado</strong> desde la lista de contactos.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-success" />
            Puedes <strong>reactivar</strong> el bot manualmente desde cada conversación.
          </li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: "primary" | "warning" | "destructive" }) {
  const color = accent === "primary" ? "var(--primary)" : accent === "warning" ? "var(--warning)" : "var(--destructive)";
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${color} 14%, transparent)`, color }}>
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}