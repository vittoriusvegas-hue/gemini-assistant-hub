import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";
// Pull in the module augmentation that adds the `server` field to createFileRoute.
import type {} from "@tanstack/start-client-core";

/**
 * Demo en memoria del estado de sesiones de WhatsApp.
 * En producción esto vendría de un proceso/servicio real (Baileys, Whatsapp Web, etc.).
 * Nota: Worker SSR no garantiza memoria persistente entre requests, pero sirve para la demo.
 */
type SessionState = {
  id: string;
  status: "pending" | "scanning" | "connected" | "expired";
  createdAt: number;
  connectedAt?: number;
  phone?: string;
  qrPayload: string;
};

const g = globalThis as unknown as { __waSessions?: Map<string, SessionState> };
if (!g.__waSessions) g.__waSessions = new Map();
const sessions = g.__waSessions;

const QR_TTL_MS = 60_000; // 60s
const AUTO_CONNECT_AFTER_MS = 8_000; // simula escaneo + conexión a los 8s

function tick(s: SessionState) {
  const age = Date.now() - s.createdAt;
  if (s.status === "pending" || s.status === "scanning") {
    if (age >= AUTO_CONNECT_AFTER_MS) {
      s.status = "connected";
      s.connectedAt = Date.now();
      s.phone = "+52 55 9988 7766";
    } else if (age >= QR_TTL_MS) {
      s.status = "expired";
    }
  }
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/whatsapp/session")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      // Crea una nueva sesión y devuelve el QR (data URL)
      POST: async () => {
        const id = crypto.randomUUID();
        const payload = `wa-pair://${id}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
        const session: SessionState = {
          id,
          status: "pending",
          createdAt: Date.now(),
          qrPayload: payload,
        };
        sessions.set(id, session);

        const dataUrl = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 1,
          color: { dark: "#0b1020", light: "#ffffff" },
        });

        return Response.json(
          {
            sessionId: id,
            qr: dataUrl,
            status: session.status,
            expiresInMs: QR_TTL_MS,
          },
          { headers: cors },
        );
      },

      // Consulta el estado de una sesión existente
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) {
          return new Response(JSON.stringify({ error: "missing id" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...cors },
          });
        }
        const session = sessions.get(id);
        if (!session) {
          return new Response(JSON.stringify({ error: "not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...cors },
          });
        }
        tick(session);
        return Response.json(
          {
            sessionId: session.id,
            status: session.status,
            phone: session.phone,
            connectedAt: session.connectedAt,
          },
          { headers: cors },
        );
      },
    },
  },
});