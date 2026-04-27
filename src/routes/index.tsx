import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/inbox/Sidebar";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ChatPanel } from "@/components/inbox/ChatPanel";
import { ContactPanel } from "@/components/inbox/ContactPanel";
import { InboxProvider } from "@/lib/inbox-store";

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
    <InboxProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <ConversationList />
        <ChatPanel />
        <ContactPanel />
      </div>
    </InboxProvider>
  );
}
