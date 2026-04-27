import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/inbox/Sidebar";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ChatPanel } from "@/components/inbox/ChatPanel";
import { ContactPanel } from "@/components/inbox/ContactPanel";
import { useInbox } from "@/lib/inbox-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse Inbox — Conversaciones con IA Gemini" },
      { name: "description", content: "Bandeja unificada con respuestas automáticas de IA, pausa inteligente y bloqueo de contactos." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-background">
      <Sidebar />
      <Inner />
    </div>
  );
}

function Inner() {
  const { selectedConversationId } = useInbox();
  const hasSelection = !!selectedConversationId;
  return (
    <>
      {/* On mobile: show list OR chat. On md+: show both. */}
      <div className={cn("flex w-full flex-1 md:w-auto md:flex-none", hasSelection ? "hidden md:flex" : "flex")}>
        <ConversationList />
      </div>
      <div className={cn("flex-1", hasSelection ? "flex" : "hidden md:flex")}>
        <ChatPanel />
      </div>
      <ContactPanel />
    </>
  );
}
