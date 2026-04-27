import type { Contact, Conversation, Message } from "./inbox-types";

const now = Date.now();
const m = (min: number) => now - min * 60 * 1000;
const h = (hr: number) => now - hr * 60 * 60 * 1000;

export const initialContacts: Contact[] = [
  { id: "c1", name: "María González", phone: "+34 612 345 678", email: "maria@example.com", avatarColor: "oklch(0.7 0.18 25)", channel: "whatsapp", tags: ["VIP", "Cliente"], blocked: false, createdAt: h(72) },
  { id: "c2", name: "Carlos Ruiz", phone: "+52 55 1234 5678", email: "carlos@empresa.mx", avatarColor: "oklch(0.65 0.2 145)", channel: "whatsapp", tags: ["Lead"], blocked: false, createdAt: h(48) },
  { id: "c3", name: "Ana Martínez", phone: "+34 698 112 233", avatarColor: "oklch(0.65 0.2 280)", channel: "instagram", tags: ["Soporte"], blocked: false, createdAt: h(24) },
  { id: "c4", name: "Luis Fernández", phone: "+57 300 555 0199", avatarColor: "oklch(0.7 0.18 60)", channel: "webhook", tags: ["Spam?"], blocked: true, createdAt: h(120) },
  { id: "c5", name: "Sofía Pérez", phone: "+54 11 4455 6677", email: "sofia@correo.ar", avatarColor: "oklch(0.65 0.2 200)", channel: "messenger", tags: ["Cliente"], blocked: false, createdAt: h(10) },
  { id: "c6", name: "Diego Torres", phone: "+51 987 654 321", avatarColor: "oklch(0.6 0.22 320)", channel: "whatsapp", tags: ["Lead"], blocked: false, createdAt: h(6) },
  { id: "c7", name: "Elena Castro", phone: "+34 645 998 877", avatarColor: "oklch(0.7 0.16 100)", channel: "webhook", tags: [], blocked: false, createdAt: h(3) },
  { id: "c8", name: "Pablo Rivas", phone: "+34 611 223 344", avatarColor: "oklch(0.55 0.22 15)", channel: "whatsapp", tags: ["Bloqueado"], blocked: true, createdAt: h(96) },
];

export const initialConversations: Conversation[] = [
  { id: "v1", contactId: "c1", unread: 2, lastMessageAt: m(3), status: "open", botPausedUntil: null },
  { id: "v2", contactId: "c2", unread: 0, lastMessageAt: m(25), status: "open", botPausedUntil: null },
  { id: "v3", contactId: "c3", unread: 1, lastMessageAt: m(58), status: "open", botPausedUntil: null },
  { id: "v4", contactId: "c5", unread: 0, lastMessageAt: h(2), status: "open", botPausedUntil: null },
  { id: "v5", contactId: "c6", unread: 4, lastMessageAt: h(5), status: "open", botPausedUntil: null },
  { id: "v6", contactId: "c7", unread: 0, lastMessageAt: h(20), status: "resolved", botPausedUntil: null },
];

export const initialMessages: Message[] = [
  // v1 – María
  { id: "m1", conversationId: "v1", sender: "contact", text: "Hola, ¿tienen disponible el plan Pro?", createdAt: m(40) },
  { id: "m2", conversationId: "v1", sender: "bot", text: "¡Hola María! Soy el asistente IA. Sí, el plan Pro está disponible por 49€/mes e incluye soporte prioritario. ¿Quieres que te envíe un enlace de pago?", createdAt: m(39) },
  { id: "m3", conversationId: "v1", sender: "contact", text: "Sí, por favor.", createdAt: m(10) },
  { id: "m4", conversationId: "v1", sender: "contact", text: "Y otra cosa, ¿se puede pagar anual?", createdAt: m(3) },

  // v2 – Carlos
  { id: "m5", conversationId: "v2", sender: "contact", text: "Buenas, vi su anuncio en LinkedIn", createdAt: m(60) },
  { id: "m6", conversationId: "v2", sender: "bot", text: "¡Hola Carlos! Gracias por escribir. ¿Te gustaría que un especialista te contacte?", createdAt: m(59) },
  { id: "m7", conversationId: "v2", sender: "agent", text: "Hola Carlos, soy Laura del equipo. ¿En qué te ayudo?", createdAt: m(25) },

  // v3 – Ana
  { id: "m8", conversationId: "v3", sender: "contact", text: "Mi pedido aún no llega 😟", createdAt: m(70) },
  { id: "m9", conversationId: "v3", sender: "bot", text: "Lamento eso, Ana. ¿Me das tu número de pedido?", createdAt: m(69) },
  { id: "m10", conversationId: "v3", sender: "contact", text: "#A-99812", createdAt: m(58) },

  // v4 – Sofía
  { id: "m11", conversationId: "v4", sender: "contact", text: "Quiero cambiar mi suscripción", createdAt: h(2.5) },
  { id: "m12", conversationId: "v4", sender: "bot", text: "Claro, puedo ayudarte. ¿A qué plan deseas cambiar?", createdAt: h(2) },

  // v5 – Diego
  { id: "m13", conversationId: "v5", sender: "contact", text: "Hola", createdAt: h(6) },
  { id: "m14", conversationId: "v5", sender: "contact", text: "¿Hay alguien?", createdAt: h(5.5) },
  { id: "m15", conversationId: "v5", sender: "bot", text: "¡Hola Diego! Estoy aquí para ayudarte. Cuéntame qué necesitas.", createdAt: h(5.4) },
  { id: "m16", conversationId: "v5", sender: "contact", text: "Quiero info de precios", createdAt: h(5.2) },
  { id: "m17", conversationId: "v5", sender: "contact", text: "Y métodos de pago", createdAt: h(5) },

  // v6 – Elena (resuelta)
  { id: "m18", conversationId: "v6", sender: "contact", text: "Gracias por la ayuda!", createdAt: h(20) },
  { id: "m19", conversationId: "v6", sender: "agent", text: "¡A ti! Que tengas buen día 🙌", createdAt: h(19.9) },
];