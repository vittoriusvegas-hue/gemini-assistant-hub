import { Bot, Sparkles, Clock, ShieldOff, TrendingUp, MessageSquare, Zap, BarChart3 } from "lucide-react";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useInbox } from "@/lib/inbox-store";
import { useUsers } from "@/lib/users-store";

export function BotPage() {
  const { conversations, contacts, messages } = useInbox();
  const { can } = useUsers();
  const blocked = contacts.filter((c) => c.blocked).length;
  const paused = conversations.filter((c) => c.botPausedUntil && c.botPausedUntil > Date.now()).length;

  const stats = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const last24h = messages.filter((m) => now - m.createdAt <= day);
    const prev24h = messages.filter((m) => now - m.createdAt > day && now - m.createdAt <= 2 * day);

    const botToday = last24h.filter((m) => m.sender === "bot").length;
    const botPrev = prev24h.filter((m) => m.sender === "bot").length;
    const agentToday = last24h.filter((m) => m.sender === "agent").length;
    const inboundToday = last24h.filter((m) => m.sender === "contact").length;

    const totalReplies = botToday + agentToday;
    const botShare = totalReplies > 0 ? (botToday / totalReplies) * 100 : 0;

    // Avg bot response time
    const sortedByConv = new Map<string, typeof messages>();
    for (const m of messages) {
      const arr = sortedByConv.get(m.conversationId) ?? [];
      arr.push(m);
      sortedByConv.set(m.conversationId, arr);
    }
    const botResp: number[] = [];
    for (const arr of sortedByConv.values()) {
      const sorted = [...arr].sort((a, b) => a.createdAt - b.createdAt);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].sender === "contact" && sorted[i + 1].sender === "bot") {
          botResp.push(sorted[i + 1].createdAt - sorted[i].createdAt);
        }
      }
    }
    const avgBotResp = botResp.length ? botResp.reduce((a, b) => a + b, 0) / botResp.length : 0;

    const trend = botPrev === 0 ? (botToday > 0 ? 100 : 0) : ((botToday - botPrev) / botPrev) * 100;

    return { botToday, botPrev, agentToday, inboundToday, botShare, avgBotResp, trend };
  }, [messages]);

  const fmtMs = (ms: number) => {
    if (ms === 0) return "—";
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
    return `${(ms / 3_600_000).toFixed(1)}h`;
  };

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

      <div className="grid gap-4 p-4 md:grid-cols-3 md:p-8">
        <Stat icon={<Sparkles className="h-4 w-4" />} label="Respuestas del bot (24h)" value={stats.botToday} accent="primary" sub={`${stats.botShare.toFixed(0)}% del total de respuestas`} />
        <Stat icon={<Clock className="h-4 w-4" />} label="Conversaciones en pausa" value={paused} accent="warning" />
        <Stat icon={<ShieldOff className="h-4 w-4" />} label="Contactos bloqueados" value={blocked} accent="destructive" />
      </div>

      {/* Métricas del bot */}
      <section className="mx-4 mb-6 md:mx-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Métricas del bot</h2>
          </div>
          {can("analytics") && (
            <Link to="/analytics" className="text-xs font-medium text-primary hover:underline">
              Ver métricas completas →
            </Link>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <MiniStat icon={<Zap className="h-4 w-4" />} label="Tiempo de respuesta" value={fmtMs(stats.avgBotResp)} hint="promedio del bot" />
          <MiniStat icon={<MessageSquare className="h-4 w-4" />} label="Mensajes entrantes" value={stats.inboundToday.toString()} hint="últimas 24h" />
          <MiniStat icon={<Bot className="h-4 w-4" />} label="Resp. del agente" value={stats.agentToday.toString()} hint="últimas 24h" />
          <MiniStat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Tendencia"
            value={`${stats.trend >= 0 ? "+" : ""}${stats.trend.toFixed(0)}%`}
            hint="vs. día anterior"
            positive={stats.trend >= 0}
          />
        </div>
      </section>

      <div className="mx-4 mb-8 rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)] md:mx-8">
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