import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialContacts, initialConversations, initialDeals, initialMessages } from "./inbox-data";
import {
  BOT_PAUSE_MS,
  type Attachment,
  type Contact,
  type Conversation,
  type Deal,
  type DealComment,
  type DealStage,
  type Message,
} from "./inbox-types";

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
  // Sales pipeline
  deals: Deal[];
  selectedDealId: string | null;
  selectDeal: (id: string | null) => void;
  moveDeal: (dealId: string, stage: DealStage) => void;
  updateDeal: (dealId: string, patch: Partial<Pick<Deal, "title" | "amount" | "currency" | "probability" | "expectedCloseAt" | "owner" | "tags">>) => void;
  addDealAttachment: (dealId: string, attachment: Omit<Attachment, "id" | "createdAt">) => void;
  removeDealAttachment: (dealId: string, attachmentId: string) => void;
  addDealComment: (dealId: string, text: string, author?: string) => void;
  createDeal: (input: { title: string; contactId: string; stage?: DealStage; amount?: number; currency?: string }) => string;
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
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(initialDeals[0]?.id ?? null);

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

  const selectDeal = useCallback((id: string | null) => setSelectedDealId(id), []);

  const moveDeal = useCallback((dealId: string, stage: DealStage) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage, updatedAt: Date.now() } : d)));
  }, []);

  const updateDeal = useCallback<InboxState["updateDeal"]>((dealId, patch) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, ...patch, updatedAt: Date.now() } : d)));
  }, []);

  const addDealAttachment = useCallback<InboxState["addDealAttachment"]>((dealId, attachment) => {
    const att: Attachment = { ...attachment, id: uid(), createdAt: Date.now() };
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, attachments: [att, ...d.attachments], updatedAt: Date.now() } : d)));
  }, []);

  const removeDealAttachment = useCallback<InboxState["removeDealAttachment"]>((dealId, attachmentId) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, attachments: d.attachments.filter((a) => a.id !== attachmentId), updatedAt: Date.now() } : d,
      ),
    );
  }, []);

  const addDealComment = useCallback<InboxState["addDealComment"]>((dealId, text, author = "Tú") => {
    const t = text.trim();
    if (!t) return;
    const c: DealComment = { id: uid(), author, text: t, createdAt: Date.now() };
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, comments: [...d.comments, c], updatedAt: Date.now() } : d)));
  }, []);

  const createDeal = useCallback<InboxState["createDeal"]>((input) => {
    const id = uid();
    const conv = conversations.find((c) => c.contactId === input.contactId);
    const deal: Deal = {
      id,
      title: input.title || "Nueva oportunidad",
      contactId: input.contactId,
      conversationId: conv?.id,
      stage: input.stage ?? "new",
      amount: input.amount ?? 0,
      currency: input.currency ?? "USD",
      probability: 20,
      expectedCloseAt: Date.now() + 1000 * 60 * 60 * 24 * 14,
      owner: "Laura R.",
      tags: [],
      attachments: [],
      comments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDeals((prev) => [deal, ...prev]);
    setSelectedDealId(id);
    return id;
  }, [conversations]);

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
      deals,
      selectedDealId,
      selectDeal,
      moveDeal,
      updateDeal,
      addDealAttachment,
      removeDealAttachment,
      addDealComment,
      createDeal,
    }),
    [
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
      deals,
      selectedDealId,
      selectDeal,
      moveDeal,
      updateDeal,
      addDealAttachment,
      removeDealAttachment,
      addDealComment,
      createDeal,
    ],
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox() {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used inside InboxProvider");
  return ctx;
}