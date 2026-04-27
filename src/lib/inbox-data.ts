import type { Contact, Conversation, Deal, Message } from "./inbox-types";

const now = Date.now();
const m = (min: number) => now - min * 60 * 1000;
const h = (hr: number) => now - hr * 60 * 60 * 1000;

export const initialContacts: Contact[] = [
  { id: "c1", name: "María González", phone: "+34 612 345 678", email: "maria@example.com", avatarColor: "oklch(0.7 0.18 25)", channel: "whatsapp", tags: ["VIP", "Cliente"], blocked: false, saved: true, createdAt: h(72) },
  { id: "c2", name: "Carlos Ruiz", phone: "+52 55 1234 5678", email: "carlos@empresa.mx", avatarColor: "oklch(0.65 0.2 145)", channel: "whatsapp", tags: ["Lead"], blocked: false, saved: true, createdAt: h(48) },
  { id: "c3", name: "Ana Martínez", phone: "+34 698 112 233", avatarColor: "oklch(0.65 0.2 280)", channel: "instagram", tags: ["Soporte"], blocked: false, saved: true, createdAt: h(24) },
  { id: "c4", name: "Luis Fernández", phone: "+57 300 555 0199", avatarColor: "oklch(0.7 0.18 60)", channel: "webhook", tags: ["Spam?"], blocked: true, saved: true, createdAt: h(120) },
  { id: "c5", name: "Sofía Pérez", phone: "+54 11 4455 6677", email: "sofia@correo.ar", avatarColor: "oklch(0.65 0.2 200)", channel: "messenger", tags: ["Cliente"], blocked: false, saved: true, createdAt: h(10) },
  { id: "c6", name: "Diego Torres", phone: "+51 987 654 321", avatarColor: "oklch(0.6 0.22 320)", channel: "whatsapp", tags: ["Lead"], blocked: false, saved: true, createdAt: h(6) },
  { id: "c7", name: "Elena Castro", phone: "+34 645 998 877", avatarColor: "oklch(0.7 0.16 100)", channel: "webhook", tags: [], blocked: false, saved: true, createdAt: h(3) },
  { id: "c8", name: "Pablo Rivas", phone: "+34 611 223 344", avatarColor: "oklch(0.55 0.22 15)", channel: "whatsapp", tags: ["Bloqueado"], blocked: true, saved: true, createdAt: h(96) },
  // Contactos no guardados — entraron por mensaje desde números desconocidos
  { id: "c9", name: "+34 600 778 991", phone: "+34 600 778 991", avatarColor: "oklch(0.7 0.04 250)", channel: "whatsapp", tags: [], blocked: false, saved: false, createdAt: m(45) },
  { id: "c10", name: "+1 415 555 0142", phone: "+1 415 555 0142", avatarColor: "oklch(0.7 0.04 250)", channel: "whatsapp", tags: [], blocked: false, saved: false, createdAt: h(4) },
];

export const initialConversations: Conversation[] = [
  { id: "v1", contactId: "c1", unread: 2, lastMessageAt: m(3), status: "open", botPausedUntil: null },
  { id: "v2", contactId: "c2", unread: 0, lastMessageAt: m(25), status: "open", botPausedUntil: null },
  { id: "v3", contactId: "c3", unread: 1, lastMessageAt: m(58), status: "open", botPausedUntil: null },
  { id: "v4", contactId: "c5", unread: 0, lastMessageAt: h(2), status: "open", botPausedUntil: null },
  { id: "v5", contactId: "c6", unread: 4, lastMessageAt: h(5), status: "open", botPausedUntil: null },
  { id: "v6", contactId: "c7", unread: 0, lastMessageAt: h(20), status: "resolved", botPausedUntil: null },
  { id: "v7", contactId: "c9", unread: 1, lastMessageAt: m(45), status: "open", botPausedUntil: null },
  { id: "v8", contactId: "c10", unread: 2, lastMessageAt: h(4), status: "open", botPausedUntil: null },
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

  // v7 – Número desconocido
  { id: "m20", conversationId: "v7", sender: "contact", text: "Hola, ¿esto es la tienda?", createdAt: m(46) },
  { id: "m21", conversationId: "v7", sender: "bot", text: "¡Hola! Sí, en qué puedo ayudarte 😊", createdAt: m(45) },

  // v8 – Otro número desconocido
  { id: "m22", conversationId: "v8", sender: "contact", text: "Vi su anuncio, quiero más info", createdAt: h(4.1) },
  { id: "m23", conversationId: "v8", sender: "contact", text: "¿Tienen envíos internacionales?", createdAt: h(4) },
];

export const initialDeals: Deal[] = [
  {
    id: "d1",
    title: "Plan Pro anual — María González",
    contactId: "c1",
    conversationId: "v1",
    stage: "negotiation",
    amount: 588,
    currency: "EUR",
    probability: 70,
    expectedCloseAt: now + 1000 * 60 * 60 * 24 * 4,
    owner: "Laura R.",
    tags: ["Pro", "Anual"],
    attachments: [
      { id: "a1", name: "captura-checkout.png", kind: "image", size: "412 KB", source: "chat", uploadedBy: "María", createdAt: m(35) },
      { id: "a2", name: "tarifa-pro-2026.pdf", kind: "pdf", size: "1.1 MB", source: "reference", uploadedBy: "Laura R.", createdAt: h(20) },
    ],
    comments: [
      { id: "co1", author: "Laura R.", text: "Pidió pago anual, mando link con descuento del 15%.", createdAt: m(8) },
    ],
    createdAt: h(40),
    updatedAt: m(8),
  },
  {
    id: "d2",
    title: "Demo equipo — Carlos Ruiz",
    contactId: "c2",
    conversationId: "v2",
    stage: "qualified",
    amount: 2400,
    currency: "USD",
    probability: 40,
    expectedCloseAt: now + 1000 * 60 * 60 * 24 * 12,
    owner: "Laura R.",
    tags: ["B2B", "LinkedIn"],
    attachments: [
      { id: "a3", name: "brief-empresa.docx", kind: "doc", size: "78 KB", source: "chat", uploadedBy: "Carlos", createdAt: m(40) },
    ],
    comments: [],
    createdAt: h(48),
    updatedAt: m(25),
  },
  {
    id: "d3",
    title: "Cambio de suscripción — Sofía Pérez",
    contactId: "c5",
    conversationId: "v4",
    stage: "proposal",
    amount: 79,
    currency: "USD",
    probability: 55,
    expectedCloseAt: now + 1000 * 60 * 60 * 24 * 2,
    owner: "Laura R.",
    tags: ["Upsell"],
    attachments: [
      { id: "a4", name: "comparativa-planes.xlsx", kind: "sheet", size: "44 KB", source: "reference", uploadedBy: "Laura R.", createdAt: h(2) },
    ],
    comments: [
      { id: "co2", author: "Laura R.", text: "Le interesa el plan Team. Revisar disponibilidad.", createdAt: h(1.5) },
    ],
    createdAt: h(10),
    updatedAt: h(1.5),
  },
  {
    id: "d4",
    title: "Cotización inicial — Diego Torres",
    contactId: "c6",
    conversationId: "v5",
    stage: "new",
    amount: 0,
    currency: "USD",
    probability: 15,
    expectedCloseAt: now + 1000 * 60 * 60 * 24 * 20,
    owner: "Laura R.",
    tags: ["Lead"],
    attachments: [],
    comments: [],
    createdAt: h(6),
    updatedAt: h(5),
  },
  {
    id: "d5",
    title: "Renovación anual — Elena Castro",
    contactId: "c7",
    conversationId: "v6",
    stage: "won",
    amount: 348,
    currency: "EUR",
    probability: 100,
    expectedCloseAt: now - 1000 * 60 * 60 * 18,
    owner: "Laura R.",
    tags: ["Renovación"],
    attachments: [
      { id: "a5", name: "factura-2026.pdf", kind: "pdf", size: "212 KB", source: "reference", uploadedBy: "Sistema", createdAt: h(19) },
    ],
    comments: [
      { id: "co3", author: "Laura R.", text: "Cliente feliz, pidió referidos.", createdAt: h(19) },
    ],
    createdAt: h(72),
    updatedAt: h(19),
  },
];