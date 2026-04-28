import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialContacts, initialConversations, initialDeals, initialMessages } from "./inbox-data";
import {
  BOT_PAUSE_MS,
  DEFAULT_AI_SETTINGS,
  DEFAULT_ACCOUNT_SETTINGS,
  DEAL_STAGES,
  type AISettings,
  type AccountSettings,
  type Attachment,
  type Contact,
  type Conversation,
  type Deal,
  type DealComment,
  type DealStage,
  type Message,
  type PipelineStage,
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
  // Contact CRUD
  addContact: (input: Omit<Contact, "id" | "createdAt" | "blocked" | "tags" | "avatarColor" | "saved"> & { tags?: string[]; blocked?: boolean; avatarColor?: string; saved?: boolean }) => string;
  updateContact: (contactId: string, patch: Partial<Pick<Contact, "name" | "phone" | "email" | "channel" | "tags">>) => void;
  deleteContact: (contactId: string) => void;
  /** Mark an unsaved (unknown-number) contact as saved, optionally updating its data. */
  saveContact: (contactId: string, patch?: Partial<Pick<Contact, "name" | "email" | "tags" | "channel" | "phone">>) => void;
  addContactTag: (contactId: string, tag: string) => void;
  removeContactTag: (contactId: string, tag: string) => void;
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
  deleteDeal: (dealId: string) => void;
  deleteDealComment: (dealId: string, commentId: string) => void;
  // Pipeline stages (customizable funnel)
  pipelineStages: PipelineStage[];
  addPipelineStage: (stage: Omit<PipelineStage, "id"> & { id?: string }) => string;
  updatePipelineStage: (id: string, patch: Partial<Omit<PipelineStage, "id">>) => void;
  removePipelineStage: (id: string, fallbackId?: string) => void;
  reorderPipelineStage: (id: string, direction: -1 | 1) => void;
  resetPipelineStages: () => void;
  // AI settings
  aiSettings: AISettings;
  updateAISettings: (patch: Partial<AISettings>) => void;
  resetAISettings: () => void;
  // Account
  account: AccountSettings;
  updateAccount: (patch: Partial<AccountSettings>) => void;
  resetAccount: () => void;
  deleteAccount: () => void;
}

const InboxContext = createContext<InboxState | null>(null);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const AVATAR_COLORS = [
  "oklch(0.7 0.18 25)",
  "oklch(0.65 0.2 145)",
  "oklch(0.65 0.2 280)",
  "oklch(0.7 0.18 60)",
  "oklch(0.65 0.2 200)",
  "oklch(0.6 0.22 320)",
  "oklch(0.7 0.16 100)",
  "oklch(0.55 0.22 15)",
];

export function InboxProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>("v1");
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(initialDeals[0]?.id ?? null);
  const [aiSettings, setAISettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [account, setAccount] = useState<AccountSettings>(DEFAULT_ACCOUNT_SETTINGS);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(DEAL_STAGES);

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

  const addContact = useCallback<InboxState["addContact"]>((input) => {
    const id = uid();
    const contact: Contact = {
      id,
      name: input.name,
      phone: input.phone,
      email: input.email,
      channel: input.channel,
      tags: input.tags ?? [],
      blocked: input.blocked ?? false,
      avatarColor: input.avatarColor ?? AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      saved: input.saved ?? true,
      createdAt: Date.now(),
    };
    setContacts((prev) => [contact, ...prev]);
    return id;
  }, []);

  const updateContact = useCallback<InboxState["updateContact"]>((contactId, patch) => {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, ...patch } : c)));
  }, []);

  const deleteContact = useCallback<InboxState["deleteContact"]>((contactId) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    setConversations((prev) => prev.filter((c) => c.contactId !== contactId));
    setMessages((prev) => {
      const removedConvIds = new Set(
        conversations.filter((c) => c.contactId === contactId).map((c) => c.id),
      );
      return prev.filter((m) => !removedConvIds.has(m.conversationId));
    });
    setSelectedConversationId((cur) => {
      if (!cur) return cur;
      const conv = conversations.find((c) => c.id === cur);
      return conv && conv.contactId === contactId ? null : cur;
    });
  }, [conversations]);

  const saveContact = useCallback<InboxState["saveContact"]>((contactId, patch) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== contactId) return c;
        const isPlaceholderColor = !c.avatarColor || c.avatarColor.includes("0.04");
        return {
          ...c,
          ...patch,
          saved: true,
          avatarColor: isPlaceholderColor
            ? AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
            : c.avatarColor,
        };
      }),
    );
  }, []);

  const addContactTag = useCallback<InboxState["addContactTag"]>((contactId, tag) => {
    const t = tag.trim();
    if (!t) return;
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId && !c.tags.includes(t) ? { ...c, tags: [...c.tags, t] } : c)),
    );
  }, []);

  const removeContactTag = useCallback<InboxState["removeContactTag"]>((contactId, tag) => {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, tags: c.tags.filter((x) => x !== tag) } : c)));
  }, []);

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

  const deleteDeal = useCallback<InboxState["deleteDeal"]>((dealId) => {
    setDeals((prev) => prev.filter((d) => d.id !== dealId));
    setSelectedDealId((cur) => (cur === dealId ? null : cur));
  }, []);

  const deleteDealComment = useCallback<InboxState["deleteDealComment"]>((dealId, commentId) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, comments: d.comments.filter((c) => c.id !== commentId), updatedAt: Date.now() } : d,
      ),
    );
  }, []);

  const updateAISettings = useCallback((patch: Partial<AISettings>) => {
    setAISettings((prev) => ({ ...prev, ...patch }));
  }, []);
  const resetAISettings = useCallback(() => setAISettings(DEFAULT_AI_SETTINGS), []);

  const updateAccount = useCallback((patch: Partial<AccountSettings>) => {
    setAccount((prev) => ({ ...prev, ...patch }));
  }, []);
  const resetAccount = useCallback(() => setAccount(DEFAULT_ACCOUNT_SETTINGS), []);
  const deleteAccount = useCallback(() => {
    // Demo: limpia datos locales
    setAccount(DEFAULT_ACCOUNT_SETTINGS);
  }, []);

  const addPipelineStage = useCallback<InboxState["addPipelineStage"]>((stage) => {
    const id = stage.id ?? uid();
    setPipelineStages((prev) => {
      // Insert before terminal stages (won/lost) when present
      const terminalIdx = prev.findIndex((s) => s.type === "won" || s.type === "lost");
      const next: PipelineStage = { id, label: stage.label, accent: stage.accent, type: stage.type ?? "open" };
      if (terminalIdx === -1) return [...prev, next];
      return [...prev.slice(0, terminalIdx), next, ...prev.slice(terminalIdx)];
    });
    return id;
  }, []);

  const updatePipelineStage = useCallback<InboxState["updatePipelineStage"]>((id, patch) => {
    setPipelineStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const removePipelineStage = useCallback<InboxState["removePipelineStage"]>((id, fallbackId) => {
    setPipelineStages((prev) => {
      if (prev.length <= 2) return prev; // keep at least 2 columns
      const fallback = fallbackId ?? prev.find((s) => s.id !== id)?.id;
      if (fallback) {
        setDeals((ds) => ds.map((d) => (d.stage === id ? { ...d, stage: fallback, updatedAt: Date.now() } : d)));
      }
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const reorderPipelineStage = useCallback<InboxState["reorderPipelineStage"]>((id, direction) => {
    setPipelineStages((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const resetPipelineStages = useCallback(() => setPipelineStages(DEAL_STAGES), []);

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
      addContact,
      updateContact,
      deleteContact,
      saveContact,
      addContactTag,
      removeContactTag,
      deals,
      selectedDealId,
      selectDeal,
      moveDeal,
      updateDeal,
      addDealAttachment,
      removeDealAttachment,
      addDealComment,
      createDeal,
      deleteDeal,
      deleteDealComment,
      aiSettings,
      updateAISettings,
      resetAISettings,
      account,
      updateAccount,
      resetAccount,
      deleteAccount,
      pipelineStages,
      addPipelineStage,
      updatePipelineStage,
      removePipelineStage,
      reorderPipelineStage,
      resetPipelineStages,
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
      addContact,
      updateContact,
      deleteContact,
      saveContact,
      addContactTag,
      removeContactTag,
      deals,
      selectedDealId,
      selectDeal,
      moveDeal,
      updateDeal,
      addDealAttachment,
      removeDealAttachment,
      addDealComment,
      createDeal,
      deleteDeal,
      deleteDealComment,
      aiSettings,
      updateAISettings,
      resetAISettings,
      account,
      updateAccount,
      resetAccount,
      deleteAccount,
      pipelineStages,
      addPipelineStage,
      updatePipelineStage,
      removePipelineStage,
      reorderPipelineStage,
      resetPipelineStages,
    ],
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox() {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used inside InboxProvider");
  return ctx;
}