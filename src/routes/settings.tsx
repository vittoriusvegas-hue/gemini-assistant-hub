import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/inbox/Sidebar";
import { SettingsPage } from "@/components/inbox/SettingsPage";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Ajustes — Pulse Inbox" }] }),
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <SettingsPage />
      </div>
    
  );
}