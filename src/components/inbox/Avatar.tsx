import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ContactAvatar({
  name,
  color,
  size = 40,
  online,
  className,
}: {
  name: string;
  color: string;
  size?: number;
  online?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full text-primary-foreground font-semibold"
        style={{ background: color, fontSize: size * 0.36 }}
      >
        {initials(name)}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
      )}
    </div>
  );
}