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