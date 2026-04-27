import { useEffect, useRef, useState } from "react";
import { Check, Loader2, QrCode, RefreshCw, Smartphone, Wifi, WifiOff } from "lucide-react";
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

export function WhatsAppConnect() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<WAStatus>("idle");
  const [phone, setPhone] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistencia ligera del estado de conexión en demo
  const [connected, setConnected] = useState<{ phone: string; at: number } | null>(() => {
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
          setConnected({ phone: data.phone ?? "", at });
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
    toast("WhatsApp desconectado");
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <Smartphone className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">WhatsApp Business</p>
            <p className="text-xs text-muted-foreground">
              {connected
                ? `Conectado${connected.phone ? ` · ${connected.phone}` : ""}`
                : "Vincula tu número escaneando un código QR."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
                <Wifi className="h-3 w-3" /> Conectado
              </Badge>
              <Button size="sm" variant="ghost" onClick={disconnect} className="gap-1">
                <WifiOff className="h-3 w-3" /> Desconectar
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setOpen(true)} className="gap-1">
              <QrCode className="h-3 w-3" /> Conectar
            </Button>
          )}
        </div>
      </div>

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