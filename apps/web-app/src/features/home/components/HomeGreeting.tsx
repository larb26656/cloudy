import { useMemo } from "react";
import { generateTimeGreeting } from "@/lib/greeting-generator";

interface HomeGreetingProps {
  desksToday: number;
  recentSessions: number;
}

export function HomeGreeting({
  desksToday,
  recentSessions,
}: HomeGreetingProps) {
  const greeting = useMemo(() => generateTimeGreeting(), []);

  return (
    <header className="mb-9">
      <div className="mb-1.5 text-[13px] text-muted-foreground/80">
        {greeting.eyebrow}
      </div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        {greeting.title} <span aria-hidden>👋</span>
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {greeting.subtitle({ desksToday, recentSessions })}
      </p>
    </header>
  );
}
