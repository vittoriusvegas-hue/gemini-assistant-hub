import { useState } from "react";
import { Bot, RotateCcw, Save, Sparkles, Timer, User, Bell, Plug } from "lucide-react";
import { useInbox } from "@/lib/inbox-store";
import type { AISettings, GeminiModel } from "@/lib/inbox-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const MODELS: { id: GeminiModel; label: string; hint: string }[] = [
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", hint: "Más rápido y económico" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Equilibrado (recomendado)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "Mayor calidad, más lento" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (preview)", hint: "Próxima generación, rápido" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)", hint: "Razonamiento avanzado" },
];

export function SettingsPage() {
  const { aiSettings, updateAISettings, resetAISettings } = useInbox();
  const [draft, setDraft] = useState<AISettings>(aiSettings);

  const dirty = JSON.stringify(draft) !== JSON.stringify(aiSettings);

  const set = <K extends keyof AISettings>(key: K, value: AISettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onSave = () => {
    updateAISettings(draft);
    toast.success("Configuración guardada", { description: "Los cambios se aplicaron al bot." });
  };

  const onReset = () => {
    resetAISettings();
    setDraft({ ...aiSettings });
    toast("Restablecido a valores por defecto");
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
            <p className="text-sm text-muted-foreground">
              Personaliza tu cuenta, el bot de IA y las integraciones.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" /> Gemini
          </Badge>
        </header>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai" className="gap-2"><Bot className="h-4 w-4" />IA</TabsTrigger>
            <TabsTrigger value="account" className="gap-2"><User className="h-4 w-4" />Cuenta</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Avisos</TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2"><Plug className="h-4 w-4" />Canales</TabsTrigger>
          </TabsList>

          {/* AI TAB */}
          <TabsContent value="ai" className="mt-6 space-y-6">
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Bot de IA</h2>
                  <p className="text-sm text-muted-foreground">
                    Activa o desactiva las respuestas automáticas del asistente.
                  </p>
                </div>
                <Switch
                  checked={draft.enabled}
                  onCheckedChange={(v) => set("enabled", v)}
                />
              </div>
            </section>

            <section className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-semibold">Modelo y comportamiento</h2>
                <p className="text-sm text-muted-foreground">Configura qué modelo de Gemini usa el bot y cómo responde.</p>
              </div>

              <div className="grid gap-2">
                <Label>Modelo</Label>
                <Select value={draft.model} onValueChange={(v) => set("model", v as GeminiModel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex flex-col">
                          <span>{m.label}</span>
                          <span className="text-xs text-muted-foreground">{m.hint}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sysprompt">Prompt de sistema</Label>
                <Textarea
                  id="sysprompt"
                  value={draft.systemPrompt}
                  onChange={(e) => set("systemPrompt", e.target.value)}
                  rows={6}
                  placeholder="Describe el rol, tono y reglas del asistente..."
                />
                <p className="text-xs text-muted-foreground">
                  {draft.systemPrompt.length} caracteres · Define la personalidad y los límites del bot.
                </p>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Temperatura</Label>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {draft.temperature.toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={0} max={1} step={0.05}
                  value={[draft.temperature]}
                  onValueChange={([v]) => set("temperature", v)}
                />
                <p className="text-xs text-muted-foreground">
                  Más bajo = respuestas precisas. Más alto = más creativas.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxtok">Tokens máximos por respuesta</Label>
                <Input
                  id="maxtok"
                  type="number"
                  min={64}
                  max={4096}
                  value={draft.maxTokens}
                  onChange={(e) => set("maxTokens", Number(e.target.value) || 0)}
                />
              </div>
            </section>

            <section className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold">Tiempos y delay</h2>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="delay">Delay antes de responder (segundos)</Label>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {draft.responseDelaySec.toFixed(1)} s
                  </span>
                </div>
                <Slider
                  id="delay"
                  min={0} max={10} step={0.1}
                  value={[draft.responseDelaySec]}
                  onValueChange={([v]) => set("responseDelaySec", v)}
                />
                <p className="text-xs text-muted-foreground">
                  Simula tipeo natural. Recomendado: 1–2 s.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pause">Pausar bot tras respuesta de un agente (minutos)</Label>
                <Input
                  id="pause"
                  type="number"
                  min={0}
                  max={1440}
                  value={draft.pauseAfterAgentMin}
                  onChange={(e) => set("pauseAfterAgentMin", Number(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Cuando un humano contesta, el bot deja de responder a esa conversación durante este tiempo.
                </p>
              </div>
            </section>

            <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
              <div className="text-sm text-muted-foreground">
                {dirty ? "Tienes cambios sin guardar." : "Todo está guardado."}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Restablecer
                </Button>
                <Button onClick={onSave} disabled={!dirty} className="gap-2">
                  <Save className="h-4 w-4" /> Guardar cambios
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* OTHER TABS - placeholders */}
          <TabsContent value="account" className="mt-6">
            <section className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-base font-semibold">Perfil del agente</h2>
              <div className="grid gap-2">
                <Label>Nombre</Label>
                <Input defaultValue="Laura R." />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" defaultValue="laura@pulse.app" />
              </div>
              <Button onClick={() => toast.success("Perfil actualizado")} className="w-fit">Guardar</Button>
            </section>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <section className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-base font-semibold">Notificaciones</h2>
              {[
                ["Nuevos mensajes", true],
                ["Mensajes asignados a mí", true],
                ["Resumen diario por email", false],
              ].map(([label, def]) => (
                <div key={label as string} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">{label as string}</span>
                  <Switch defaultChecked={def as boolean} />
                </div>
              ))}
            </section>
          </TabsContent>

          <TabsContent value="integrations" className="mt-6">
            <section className="rounded-xl border bg-card p-6 shadow-sm space-y-3">
              <h2 className="text-base font-semibold">Canales conectados</h2>
              {[
                { name: "Webhook genérico", status: "Conectado" },
                { name: "WhatsApp Business", status: "No conectado" },
                { name: "Instagram", status: "No conectado" },
                { name: "Messenger", status: "No conectado" },
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{c.name}</span>
                  <Badge variant={c.status === "Conectado" ? "default" : "secondary"}>{c.status}</Badge>
                </div>
              ))}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}