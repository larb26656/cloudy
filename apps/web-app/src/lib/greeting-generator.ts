export type Greeting = {
  title: string;
  subtitle: string;
};

const ART_GREETINGS: Greeting[] = [
  {
    title: "Ready to create something amazing?",
    subtitle: "Let's write some code together ✨",
  },
  {
    title: "Where ideas take form",
    subtitle: "Your next breakthrough starts here 🚀",
  },
  {
    title: "The canvas is blank",
    subtitle: "Paint your thoughts into reality 🎨",
  },
  { title: "Hello, builder", subtitle: "What shall we craft today? 🔧" },
  { title: "Let's debug reality", subtitle: "One line at a time 💻" },
  {
    title: "Your coding journey awaits",
    subtitle: "Start a new conversation 🌟",
  },
  {
    title: "Ideas flow freely here",
    subtitle: "Share your vision, let's build it 💡",
  },
  { title: "Code is poetry", subtitle: "Let's write verse together 📝" },
  {
    title: "Time to build something cool",
    subtitle: "What do you have in mind? 🎯",
  },
  { title: "Adventure awaits", subtitle: "Ready to explore? 🗺️" },
];

const ART_PLACEHOLDERS: string[] = [
  "Speak your mind, I'm listening 🎧",
  "Craft your next masterpiece here ✍️",
  "Turn thoughts into code ⌨️",
  "Whisper your ideas softly 🤫",
  "Paint with keystrokes 🎨",
  "The void awaits your words 🌌",
  "Unleash the gremlins 🐉",
  "Channel your inner wizard 🧙",
  "Plant seeds of code 🌱",
  "Stir the pot of logic 🫕",
  "Hack the matrix 💊",
  "Drop your thoughts here 💭",
  "Summon your ideas ✨",
  "Write your story 📖",
  "Architect your dreams 🏛️",
  "Ignite the spark 🔥",
  "Weave your narrative 🕸️",
  "Forge something legendary ⚔️",
  "Cast your message into the void 🌑",
];

export function generateGreeting(): Greeting {
  const index = Math.floor(Math.random() * ART_GREETINGS.length);
  return ART_GREETINGS[index];
}

export function generatePlaceholder(): string {
  const index = Math.floor(Math.random() * ART_PLACEHOLDERS.length);
  return ART_PLACEHOLDERS[index];
}

export type TimeGreeting = {
  eyebrow: string;
  title: string;
  subtitle: (activity: {
    desksToday: number;
    recentSessions: number;
  }) => string;
};

function partOfDay(
  hour: number,
): "morning" | "afternoon" | "evening" | "night" {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

const TIME_TITLES: Record<ReturnType<typeof partOfDay>, string> = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
  night: "Burning the midnight oil",
};

/**
 * Time-of-day greeting for the home surface. The `subtitle` is a function so
 * the caller can pass live activity counts (desks edited today, recent
 * sessions) and re-render as the data loads without re-rolling the greeting.
 */
export function generateTimeGreeting(now: Date = new Date()): TimeGreeting {
  const eyebrow = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  const title = TIME_TITLES[partOfDay(now.getHours())];

  return {
    eyebrow,
    title,
    subtitle: ({ desksToday, recentSessions }) => {
      const parts: string[] = [];
      if (desksToday > 0) {
        parts.push(
          `${desksToday} desk${desksToday === 1 ? "" : "s"} edited today`,
        );
      }
      if (recentSessions > 0) {
        parts.push(
          `${recentSessions} recent chat${recentSessions === 1 ? "" : "s"}`,
        );
      }
      if (parts.length === 0)
        return "Pick up where you left off, or start something new.";
      return `${parts.join(" · ")}.`;
    },
  };
}
