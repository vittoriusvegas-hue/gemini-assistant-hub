import { createFileRoute } from "@tanstack/react-router";
import { ContactsPage } from "@/components/inbox/ContactsPage";
import { Sidebar } from "@/components/inbox/Sidebar";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contactos — Pulse Inbox" }] }),
  component: ContactsRoute,
});

function ContactsRoute() {
  return (
    
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <ContactsPage />
      </div>
    
  );
}