import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/inbox/Sidebar";
import { ComingSoon } from "@/components/inbox/ComingSoon";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Métricas — Pulse Inbox" }] }),
  component: AnalyticsRoute,
});

function AnalyticsRoute() {
  return (
    
      <div className="flex h-[100dvh] w-screen overflow-hidden bg-background">
        <Sidebar />
        <ComingSoon title="Métricas" description="Aquí verás conversaciones por canal, tiempos de respuesta y rendimiento del bot." />
      </div>
    
  );
}