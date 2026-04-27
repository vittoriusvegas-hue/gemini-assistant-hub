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

export type DealStage = "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

export const DEAL_STAGES: { id: DealStage; label: string; accent: string }[] = [
  { id: "new", label: "Nuevos", accent: "oklch(0.7 0.14 250)" },
  { id: "qualified", label: "Calificados", accent: "oklch(0.7 0.16 200)" },
  { id: "proposal", label: "Propuesta", accent: "oklch(0.72 0.17 285)" },
  { id: "negotiation", label: "Negociación", accent: "oklch(0.78 0.15 75)" },
  { id: "won", label: "Ganados", accent: "oklch(0.7 0.16 155)" },
  { id: "lost", label: "Perdidos", accent: "oklch(0.62 0.2 25)" },
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