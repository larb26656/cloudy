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
    <header className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
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
      <Button className="shrink-0" onClick={onNewChat}>
        <MessageCircle data-icon="inline-start" />
        New chat
      </Button>
    </header>
  );
}
