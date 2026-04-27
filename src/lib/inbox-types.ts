export type Channel = "whatsapp" | "webhook" | "instagram" | "messenger";

export type MessageSender = "contact" | "agent" | "bot";

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  text: string;
  createdAt: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarColor: string;
  channel: Channel;
  tags: string[];
  blocked: boolean;
  createdAt: number;
}

export interface Conversation {
  id: string;
  contactId: string;
  unread: number;
  lastMessageAt: number;
  status: "open" | "resolved";
  /** Timestamp until which the bot is paused (set when an agent replies) */
  botPausedUntil: number | null;
}

export const BOT_PAUSE_MS = 30 * 60 * 1000; // 30 minutes

export type GeminiModel =
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-flash"
  | "gemini-2.5-pro"
  | "gemini-3-flash-preview"
  | "gemini-3.1-pro-preview";

export interface AISettings {
  enabled: boolean;
  model: GeminiModel;
  systemPrompt: string;
  /** Delay before bot replies, in seconds */
  responseDelaySec: number;
  /** Pause time after agent reply, in minutes */
  pauseAfterAgentMin: number;
  temperature: number;
  maxTokens: number;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: true,
  model: "gemini-2.5-flash",
  systemPrompt:
    "Eres un asistente de ventas amable y profesional. Responde en el idioma del cliente, sé conciso y útil. Si no sabes algo, ofrece escalar a un agente humano.",
  responseDelaySec: 1.2,
  pauseAfterAgentMin: 30,
  temperature: 0.7,
  maxTokens: 512,
};

export interface AccountSettings {
  // Perfil
  fullName: string;
  displayName: string;
  jobTitle: string;
  bio: string;
  avatarUrl?: string;
  avatarColor: string;
  // Contacto
  email: string;
  phone: string;
  // Organización
  company: string;
  website: string;
  // Preferencias
  language: "es" | "en" | "pt" | "fr";
  timezone: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  theme: "light" | "dark" | "system";
  // Estado
  status: "online" | "away" | "busy" | "offline";
  signature: string;
  // Seguridad
  twoFactorEnabled: boolean;
}

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  fullName: "Laura Ramírez",
  displayName: "Laura R.",
  jobTitle: "Agente de ventas",
  bio: "Apasionada por crear experiencias memorables para los clientes.",
  avatarColor: "oklch(0.65 0.2 280)",
  email: "laura@pulse.app",
  phone: "+52 55 1234 5678",
  company: "Pulse Inbox",
  website: "https://pulse.app",
  language: "es",
  timezone: "America/Mexico_City",
  dateFormat: "DD/MM/YYYY",
  theme: "system",
  status: "online",
  signature: "Saludos,\nLaura — Equipo Pulse",
  twoFactorEnabled: false,
};

/** Stage id — string so it supports user-defined custom stages. */
export type DealStage = string;

export interface PipelineStage {
  id: string;
  label: string;
  accent: string;
  /** Stages flagged as terminal won/lost are excluded from "open" totals */
  type?: "open" | "won" | "lost";
}

export const DEAL_STAGES: PipelineStage[] = [
  { id: "new", label: "Nuevos", accent: "oklch(0.7 0.14 250)" },
  { id: "qualified", label: "Calificados", accent: "oklch(0.7 0.16 200)" },
  { id: "proposal", label: "Propuesta", accent: "oklch(0.72 0.17 285)" },
  { id: "negotiation", label: "Negociación", accent: "oklch(0.78 0.15 75)" },
  { id: "won", label: "Ganados", accent: "oklch(0.7 0.16 155)", type: "won" },
  { id: "lost", label: "Perdidos", accent: "oklch(0.62 0.2 25)", type: "lost" },
];

export interface Attachment {
  id: string;
  name: string;
  /** mime-ish: image, pdf, doc, sheet, file */
  kind: "image" | "pdf" | "doc" | "sheet" | "file";
  size?: string;
  /** Optional preview URL (data URL or remote). For demo we use placeholder gradients. */
  url?: string;
  /** Source: from chat thread or uploaded as reference */
  source: "chat" | "reference";
  uploadedBy?: string;
  createdAt: number;
}

export interface DealComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  conversationId?: string;
  stage: DealStage;
  amount: number;
  currency: string;
  /** 0-100 */
  probability: number;
  expectedCloseAt: number;
  owner: string;
  tags: string[];
  attachments: Attachment[];
  comments: DealComment[];
  createdAt: number;
  updatedAt: number;
}