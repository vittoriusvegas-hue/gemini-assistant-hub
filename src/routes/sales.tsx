import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/inbox/Sidebar";
import { SalesPage } from "@/components/inbox/SalesPage";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Embudo de Ventas — Pulse Inbox" },
      { name: "description", content: "Pipeline de ventas con archivos del chat, archivos de referencia y comentarios por oportunidad." },
    ],
  }),
  component: SalesRoute,
});

function SalesRoute() {
  return (
    
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <SalesPage />
      </div>
    
  );
}