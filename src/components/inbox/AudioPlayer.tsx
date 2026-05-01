import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  url,
  durationSec,
  variant = "incoming",
}: {
  url: string;
  durationSec?: number;
  variant?: "incoming" | "outgoing";
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSec ?? 0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onLoaded = () => setDuration(a.duration || durationSec || 0);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("ended", onEnd);
    };
  }, [durationSec]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * duration;
    setCurrent(a.currentTime);
  };

  const pct = duration ? (current / duration) * 100 : 0;
  const outgoing = variant === "outgoing";

  return (
    <div className={cn("flex min-w-[200px] items-center gap-3", outgoing ? "text-primary-foreground" : "text-foreground")}>
      <button
        onClick={toggle}
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full transition",
          outgoing
            ? "bg-white/20 hover:bg-white/30 text-primary-foreground"
            : "bg-primary text-primary-foreground hover:opacity-90",
        )}
        title={playing ? "Pausar" : "Reproducir"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </button>
      <div className="flex flex-1 flex-col gap-1">
        <div
          onClick={onSeek}
          className={cn(
            "h-1.5 w-full cursor-pointer overflow-hidden rounded-full",
            outgoing ? "bg-white/25" : "bg-foreground/15",
          )}
        >
          <div
            className={cn("h-full rounded-full transition-[width]", outgoing ? "bg-white" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={cn("text-[10px] tabular-nums", outgoing ? "text-primary-foreground/80" : "text-muted-foreground")}>
          {fmt(current)} / {fmt(duration)}
        </div>
      </div>
      <audio ref={audioRef} src={url} preload="metadata" />
    </div>
  );
}