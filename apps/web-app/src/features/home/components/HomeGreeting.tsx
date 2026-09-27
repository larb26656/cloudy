import { useMemo } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { generateTimeGreeting } from "@/lib/greeting-generator";

interface HomeGreetingProps {
  desksToday: number;
  recentSessions: number;
  onNewChat: () => void;
}

export function HomeGreeting({
  desksToday,
  recentSessions,
  onNewChat,
}: HomeGreetingProps) {
  const greeting = useMemo(() => generateTimeGreeting(), []);

  return (
    <header className="relative isolate mb-9 overflow-hidden rounded-3xl border border-border bg-muted/40 px-6 py-6 sm:px-8 sm:py-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-2 top-5 grid grid-cols-4 gap-1 opacity-35 motion-safe:animate-pixel-drift motion-reduce:animate-none"
      >
        <span className="size-2 bg-foreground/70 motion-safe:animate-pixel-flicker motion-reduce:animate-none" />
        <span className="size-2 bg-foreground/30 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-0.8s]" />
        <span className="size-2 bg-foreground/50 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-0.4s]" />
        <span className="size-2 bg-foreground/20 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-1.2s]" />
        <span className="size-2 bg-foreground/20 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-0.2s]" />
        <span className="size-2 bg-foreground/60 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-1s]" />
        <span className="size-2 bg-foreground/30 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-0.6s]" />
        <span className="size-2 bg-foreground/70 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-1.4s]" />
        <span className="size-2 bg-foreground/50 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-0.9s]" />
        <span className="size-2 bg-foreground/20 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-0.3s]" />
        <span className="size-2 bg-foreground/60 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-1.1s]" />
        <span className="size-2 bg-foreground/30 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-0.7s]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-4 left-1/3 grid grid-cols-3 gap-1 opacity-40 motion-safe:animate-pixel-drift motion-reduce:animate-none [animation-delay:-1.4s]"
      >
        <span className="size-2 bg-muted-foreground/70 motion-safe:animate-pixel-flicker motion-reduce:animate-none" />
        <span className="size-2 bg-muted-foreground/30 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-0.7s]" />
        <span className="size-2 bg-muted-foreground/50 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-1.1s]" />
        <span className="size-2 bg-muted-foreground/20 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-0.3s]" />
        <span className="size-2 bg-muted-foreground/60 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-1.5s]" />
        <span className="size-2 bg-muted-foreground/30 motion-safe:animate-pixel-flicker motion-reduce:animate-none [animation-delay:-0.5s]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute top-3 grid grid-cols-5 gap-1 opacity-50 motion-safe:animate-pixel-scan motion-reduce:animate-none"
      >
        <span className="size-2 bg-foreground/70" />
        <span className="size-2 bg-foreground/35" />
        <span className="size-2 bg-foreground/60" />
        <span className="size-2 bg-foreground/25" />
        <span className="size-2 bg-foreground/50" />
      </div>
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <div className="mb-1.5 text-[13px] text-muted-foreground/80">
            {greeting.eyebrow}
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight">
            {greeting.title} <span aria-hidden>👋</span>
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {greeting.subtitle({ desksToday, recentSessions })}
          </p>
        </div>
        <Button className="shrink-0 self-start" onClick={onNewChat}>
          <MessageCircle data-icon="inline-start" />
          New chat
        </Button>
      </div>
    </header>
  );
}
