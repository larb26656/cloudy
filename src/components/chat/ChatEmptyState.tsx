import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DirectoryPicker } from "@/components/directory/DirectoryPickerDialog";

const ART_GREETINGS = [
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

interface WelcomeStateProps {
  onCreateSession: (directory?: string) => void;
  selectedDirectory?: string | null;
}

export function WelcomeState({
  onCreateSession,
  selectedDirectory,
}: WelcomeStateProps) {
  const greeting = useMemo(() => {
    const index = Math.floor(Math.random() * ART_GREETINGS.length);
    return ART_GREETINGS[index];
  }, []);

  const [openPicker, setOpenPicker] = useState<boolean>(false);
  const [pickedDirectory, setPickedDirectory] = useState<string | null>(
    selectedDirectory || null,
  );

  const handleStartChat = () => {
    setOpenPicker(true);
  };

  const handleSelectDirectory = (directory: string) => {
    onCreateSession(directory);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-md px-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3 tracking-tight">
          {greeting.title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
          {greeting.subtitle}
        </p>

        <DirectoryPicker
          value={pickedDirectory}
          onChange={(dir) => dir && handleSelectDirectory(dir)}
          placeholder="Select directory"
          open={openPicker}
          onOpenChange={setOpenPicker}
        />

        <Button
          onClick={handleStartChat}
          size="lg"
          className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          Start New Chat
        </Button>
      </div>
    </div>
  );
}

export function SelectSessionState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">Select a chat</p>
        <p className="text-sm">Choose a chat from the sidebar to start</p>
      </div>
    </div>
  );
}

export function EmptyChatState() {
  const greeting = useMemo(() => {
    const index = Math.floor(Math.random() * ART_GREETINGS.length);
    return ART_GREETINGS[index];
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
      <p className="text-lg font-medium text-gray-800 dark:text-white mb-2">
        {greeting.title}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {greeting.subtitle}
      </p>
    </div>
  );
}
