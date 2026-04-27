import { createFileRoute } from "@tanstack/react-router";
import { BotPage } from "@/components/inbox/BotPage";
import { Sidebar } from "@/components/inbox/Sidebar";

export const Route = createFileRoute("/bot")({
  head: () => ({ meta: [{ title: "Bot IA — Pulse Inbox" }] }),
  component: BotRoute,
});

function BotRoute() {
  return (
    
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <BotPage />
      </div>
    
  );
}