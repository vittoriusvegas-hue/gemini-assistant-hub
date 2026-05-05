import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/inbox/Sidebar";
import { InventoryPage } from "@/components/inbox/InventoryPage";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventario — Pulse Inbox" }] }),
  component: InventoryRoute,
});

function InventoryRoute() {
  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-background">
      <Sidebar />
      <InventoryPage />
    </div>
  );
}