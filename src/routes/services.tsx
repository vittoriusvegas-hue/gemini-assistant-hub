import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/inbox/Sidebar";
import { ServicesPage } from "@/components/inbox/ServicesPage";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "Servicios — Pulse Inbox" }] }),
  component: ServicesRoute,
});

function ServicesRoute() {
  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-background">
      <Sidebar />
      <ServicesPage />
    </div>
  );
}