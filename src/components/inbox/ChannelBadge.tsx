import type { Channel } from "@/lib/inbox-types";
import { MessageCircle, Instagram, Facebook, Webhook } from "lucide-react";

const map: Record<Channel, { label: string; icon: typeof MessageCircle; color: string }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "oklch(0.7 0.16 155)" },
  instagram: { label: "Instagram", icon: Instagram, color: "oklch(0.65 0.22 25)" },
  messenger: { label: "Messenger", icon: Facebook, color: "oklch(0.6 0.2 250)" },
  webhook: { label: "Webhook", icon: Webhook, color: "oklch(0.55 0.22 280)" },
};

export function ChannelBadge({ channel, withLabel = false }: { channel: Channel; withLabel?: boolean }) {
  const c = map[channel];
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
      style={{ background: `color-mix(in oklab, ${c.color} 14%, transparent)`, color: c.color }}
    >
      <Icon className="h-3 w-3" />
      {withLabel && c.label}
    </span>
  );
}