import { useRef, useState, type ReactNode } from "react";
import { Reply } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WhatsApp-style swipe-to-reply wrapper.
 * Swipe right (touch or mouse drag) on any message to trigger `onReply`.
 */
export function SwipeToReply({
  onReply,
  side,
  children,
}: {
  onReply: () => void;
  side: "left" | "right";
  children: ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const fired = useRef(false);
  const THRESHOLD = 60;
  const MAX = 90;

  const begin = (x: number) => {
    startX.current = x;
    fired.current = false;
  };
  const move = (x: number) => {
    if (startX.current == null) return;
    const raw = x - startX.current;
    // Only allow drag to the right (positive)
    const next = Math.max(0, Math.min(MAX, raw));
    setDx(next);
    if (!fired.current && next >= THRESHOLD) {
      fired.current = true;
      onReply();
    }
  };
  const end = () => {
    startX.current = null;
    setDx(0);
  };

  const opacity = Math.min(1, dx / THRESHOLD);

  return (
    <div
      className="relative w-full select-none touch-pan-y"
      onTouchStart={(e) => begin(e.touches[0].clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
      onTouchEnd={end}
      onTouchCancel={end}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") begin(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.pointerType === "mouse" && startX.current != null) move(e.clientX);
      }}
      onPointerUp={(e) => {
        if (e.pointerType === "mouse") end();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse" && startX.current != null) end();
      }}
    >
      {/* Reply icon revealed under the bubble */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 flex items-center",
          side === "right" ? "right-auto left-2" : "left-2",
        )}
        style={{ opacity }}
      >
        <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary">
          <Reply className="h-3.5 w-3.5" />
        </div>
      </div>
      <div
        className="transition-transform"
        style={{
          transform: `translateX(${dx}px)`,
          transitionDuration: dx === 0 ? "180ms" : "0ms",
        }}
      >
        {children}
      </div>
    </div>
  );
}