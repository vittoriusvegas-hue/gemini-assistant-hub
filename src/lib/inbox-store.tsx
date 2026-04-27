import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialContacts, initialConversations, initialMessages } from "./inbox-data";
import { BOT_PAUSE_MS, type Contact, type Conversation, type Message } from "./inbox-types";

interface InboxState {
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
  selectedConversationId: string | null;
  selectConversation: (id: string | null) => void;
  sendAgentMessage: (conversationId: string, text: string) => void;
  toggleBlockContact: (contactId: string) => void;
  resumeBot: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  resolveConversation: (conversationId: string) => void;
  /** Simulates an incoming message from a contact (for the demo webhook button) */
  simulateIncoming: (contactId: string, text: string) => void;
}

const InboxContext = createContext<InboxState | null>(null);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function InboxProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>("v1");

  // Tick every 30s so the "bot paused" countdown re-renders
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  const selectConversation = useCallback((id: string | null) => {
    setSelectedConversationId(id);
    if (id) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    }
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)));
  }, []);

  const sendAgentMessage = useCallback((conversationId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newMsg: Message = {
      id: uid(),
      conversationId,
      sender: "agent",
      text: trimmed,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessageAt: newMsg.createdAt, botPausedUntil: Date.now() + BOT_PAUSE_MS, unread: 0 }
          : c,
      ),
    );
  }, []);

  const toggleBlockContact = useCallback((contactId: string) => {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, blocked: !c.blocked } : c)));
  }, []);

  const resumeBot = useCallback((conversationId: string) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, botPausedUntil: null } : c)));
  }, []);

  const resolveConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, status: c.status === "open" ? "resolved" : "open" } : c)),
    );
  }, []);

  const simulateIncoming = useCallback((contactId: string, text: string) => {
    const conversation = conversations.find((c) => c.contactId === contactId);
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact || contact.blocked) return; // Bot won't even reply if blocked
    const conv = conversation ?? {
      id: uid(),
      contactId,
      unread: 0,
      lastMessageAt: Date.now(),
      status: "open" as const,
      botPausedUntil: null,
    };
    if (!conversation) setConversations((prev) => [conv, ...prev]);
    const incoming: Message = { id: uid(), conversationId: conv.id, sender: "contact", text, createdAt: Date.now() };
    setMessages((prev) => [...prev, incoming]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv.id ? { ...c, lastMessageAt: incoming.createdAt, unread: c.id === selectedConversationId ? 0 : c.unread + 1 } : c,
      ),
    );

    // Bot replies if not paused and contact not blocked
    const botActive = !conv.botPausedUntil || conv.botPausedUntil < Date.now();
    if (botActive) {
      setTimeout(() => {
        const reply: Message = {
          id: uid(),
          conversationId: conv.id,
          sender: "bot",
          text: "Recibí tu mensaje. ¿En qué puedo ayudarte? (respuesta generada por Gemini)",
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, reply]);
        setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, lastMessageAt: reply.createdAt } : c)));
      }, 1200);
    }
  }, [contacts, conversations, selectedConversationId]);

  const value = useMemo<InboxState>(
    () => ({
      contacts,
      conversations,
      messages,
      selectedConversationId,
      selectConversation,
      sendAgentMessage,
      toggleBlockContact,
      resumeBot,
      markAsRead,
      resolveConversation,
      simulateIncoming,
    }),
    [contacts, conversations, messages, selectedConversationId, selectConversation, sendAgentMessage, toggleBlockContact, resumeBot, markAsRead, resolveConversation, simulateIncoming],
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox() {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used inside InboxProvider");
  return ctx;
}