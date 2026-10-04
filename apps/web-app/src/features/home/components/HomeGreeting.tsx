import { useMemo } from "react";
import { generateTimeGreeting } from "@/lib/greeting-generator";

export function HomeGreeting() {
  const greeting = useMemo(() => generateTimeGreeting(), []);

  return (
    <header className="relative mb-8">
      <img
        src="/sprite/greeting.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -top-2 right-0 hidden h-24 w-32 select-none object-contain sm:block"
      />
      <p className="text-sm text-muted-foreground">{greeting.eyebrow}</p>
      <h1 className="text-3xl font-bold tracking-tight">
        {greeting.title} <span aria-hidden>👋</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        What do you want to do?
      </p>
    </header>
  );
}
