export type Greeting = {
    title: string,
    subtitle: string
}

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
    "Where bugs go to die 💀",
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
