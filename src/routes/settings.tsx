import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/inbox/Sidebar";
import { SettingsPage } from "@/components/inbox/SettingsPage";
import { InboxProvider } from "@/lib/inbox-store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Ajustes — Pulse Inbox" }] }),
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <InboxProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <SettingsPage />
      </div>
    </InboxProvider>
  );
}