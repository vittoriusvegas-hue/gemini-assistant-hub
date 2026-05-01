import { useEffect, useRef, useState } from "react";
import { Check, Loader2, QrCode, RefreshCw, Smartphone, Wifi, WifiOff, LogOut, Phone, User as UserIcon, Calendar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type WAStatus = "idle" | "pending" | "scanning" | "connected" | "expired" | "error";

interface SessionResp {
  sessionId: string;
  qr?: string;
  status: WAStatus;
  expiresInMs?: number;
  phone?: string;
  connectedAt?: number;
}

const POLL_MS = 1500;

interface ActiveSession {
  phone: string;
  name?: string;
  avatarUrl?: string;
  at: number;
}

export function WhatsAppConnect() {
  const [open, setOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<WAStatus>("idle");
  const [phone, setPhone] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistencia ligera del estado de conexión en demo
  const [connected, setConnected] = useState<ActiveSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("wa-connection");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (connected) localStorage.setItem("wa-connection", JSON.stringify(connected));
    else localStorage.removeItem("wa-connection");
  }, [connected]);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    pollRef.current = null;
    tickRef.current = null;
  };

  useEffect(() => () => stopPolling(), []);

  // Genera datos sintéticos del perfil cuando se conecta una nueva sesión
  const buildProfile = (phoneStr: string): ActiveSession => {
    const sampleNames = ["María González", "Carlos Ruiz", "Equipo Pulse", "Laura Ramírez", "Tienda Nova"];
    const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const seed = encodeURIComponent(phoneStr || name);
    return {
      phone: phoneStr || "+00 000 000 000",
      name,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundType=gradientLinear`,
      at: Date.now(),
    };
  };

  const requestQr = async () => {
    setLoading(true);
    setStatus("pending");
    setQr(null);
    setPhone(null);
    try {
      const res = await fetch("/api/whatsapp/session", { method: "POST" });
      if (!res.ok) throw new Error("Backend error");
      const data: SessionResp = await res.json();
      setSessionId(data.sessionId);
      setQr(data.qr ?? null);
      setStatus(data.status);
      setSecondsLeft(Math.round((data.expiresInMs ?? 60_000) / 1000));
      startPolling(data.sessionId);
    } catch (e) {
      console.error(e);
      setStatus("error");
      toast.error("No se pudo generar el QR. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (id: string) => {
    stopPolling();
    tickRef.current = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/session?id=${id}`);
        if (!res.ok) return;
        const data: SessionResp = await res.json();
        setStatus(data.status);
        if (data.phone) setPhone(data.phone);
        if (data.status === "connected") {
          stopPolling();
          const at = data.connectedAt ?? Date.now();
          const profile = buildProfile(data.phone ?? "");
          setConnected({ ...profile, at });
          toast.success("WhatsApp conectado", {
            description: data.phone ? `Vinculado a ${data.phone}` : "La conexión se realizó correctamente.",
          });
          // Cierra el modal con un pequeño delay para que se vea el "✓"
          setTimeout(() => setOpen(false), 1400);
        } else if (data.status === "expired") {
          stopPolling();
        }
      } catch (e) {
        console.error("poll error", e);
      }
    }, POLL_MS);
  };

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (v) {
      requestQr();
    } else {
      stopPolling();
      // reset solo si no quedó conectado
      if (status !== "connected") {
        setStatus("idle");
        setQr(null);
        setSessionId(null);
      }
    }
  };

  const disconnect = () => {
    setConnected(null);
    setConfirmLogout(false);
    setSessionOpen(false);
    toast("Sesión de WhatsApp cerrada");
  };

  const formatDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return new Date(ts).toLocaleString();
    }
  };

  return (
    <>
      {connected ? (
        <button
          onClick={() => setSessionOpen(true)}
          className="group flex w-full items-center justify-between gap-3 rounded-lg border bg-emerald-500/[0.04] p-3 text-left transition hover:bg-emerald-500/[0.08]"
          title="Ver detalles de la sesión activa"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative">
              {connected.avatarUrl ? (
                <img
                  src={connected.avatarUrl}
                  alt={connected.name ?? "Perfil de WhatsApp"}
                  className="h-10 w-10 rounded-full border border-emerald-500/30 bg-white object-cover"
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/15 text-emerald-700">
                  <Smartphone className="h-4 w-4" />
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-emerald-500">
                <Check className="h-2.5 w-2.5 text-white" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">WhatsApp Business</p>
                <Badge className="h-5 gap-1 bg-emerald-500/15 px-1.5 text-[10px] text-emerald-700 hover:bg-emerald-500/15">
                  <Wifi className="h-2.5 w-2.5" /> Sesión activa
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {connected.name ? `${connected.name} · ` : ""}
                {connected.phone || "Vinculado"}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
            Ver detalles →
          </span>
        </button>
      ) : (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">WhatsApp Business</p>
              <p className="text-xs text-muted-foreground">Vincula tu número escaneando un código QR.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1">
            <QrCode className="h-3 w-3" /> Conectar
          </Button>
        </div>
      )}

      {/* MODAL: Sesión activa */}
      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Sesión activa de WhatsApp
            </DialogTitle>
            <DialogDescription>
              Datos básicos del número vinculado a este espacio de trabajo.
            </DialogDescription>
          </DialogHeader>

          {connected && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                <div className="relative">
                  {connected.avatarUrl ? (
                    <img
                      src={connected.avatarUrl}
                      alt={connected.name ?? "Perfil"}
                      className="h-16 w-16 rounded-full border-2 border-emerald-500/40 bg-white object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-700">
                      <UserIcon className="h-7 w-7" />
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-background bg-emerald-500">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{connected.name ?? "Perfil de WhatsApp"}</p>
                  <p className="truncate text-sm text-muted-foreground">{connected.phone}</p>
                  <Badge className="mt-1 h-5 gap-1 bg-emerald-500/15 px-1.5 text-[10px] text-emerald-700 hover:bg-emerald-500/15">
                    <Wifi className="h-2.5 w-2.5" /> En línea
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border p-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Número de teléfono</p>
                    <p className="truncate font-medium">{connected.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Nombre del perfil</p>
                    <p className="truncate font-medium">{connected.name ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Conectado desde</p>
                    <p className="truncate font-medium">{formatDate(connected.at)}</p>
                  </div>
                </div>
              </div>

              {confirmLogout && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-medium text-destructive">¿Cerrar sesión de WhatsApp?</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dejarás de recibir y enviar mensajes desde este número hasta que vuelvas a vincularlo escaneando el QR.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => { setConfirmLogout(false); setSessionOpen(false); }}>
              Cerrar
            </Button>
            {confirmLogout ? (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setConfirmLogout(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={disconnect} className="gap-1">
                  <LogOut className="h-3.5 w-3.5" /> Sí, cerrar sesión
                </Button>
              </div>
            ) : (
              <Button variant="destructive" onClick={() => setConfirmLogout(true)} className="gap-1">
                <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Abre WhatsApp en tu teléfono → <b>Dispositivos vinculados</b> → <b>Vincular un dispositivo</b> y escanea el código.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative grid h-[260px] w-[260px] place-items-center overflow-hidden rounded-xl border bg-white">
              {loading && (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs">Generando QR…</span>
                </div>
              )}

              {!loading && qr && status !== "connected" && status !== "expired" && (
                <img src={qr} alt="QR de WhatsApp" className="h-full w-full object-contain p-2" />
              )}

              {status === "connected" && (
                <div className="flex flex-col items-center gap-2 text-emerald-600">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15">
                    <Check className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium">¡Conectado!</p>
                  {phone && <p className="text-xs text-muted-foreground">{phone}</p>}
                </div>
              )}

              {status === "expired" && (
                <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                  <p className="text-sm font-medium">Código expirado</p>
                  <p className="text-xs">Genera uno nuevo para continuar.</p>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center gap-2 text-destructive">
                  <p className="text-sm font-medium">Error de conexión</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              {status === "pending" || status === "scanning" ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-muted-foreground">
                    Esperando escaneo · expira en {secondsLeft}s
                  </span>
                </>
              ) : status === "connected" ? (
                <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
                  <Check className="h-3 w-3" /> Conexión confirmada
                </Badge>
              ) : status === "expired" || status === "error" ? (
                <span className="text-muted-foreground">Sesión finalizada</span>
              ) : null}
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
            {(status === "expired" || status === "error") && (
              <Button onClick={requestQr} className="gap-1">
                <RefreshCw className="h-3 w-3" /> Generar nuevo QR
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}