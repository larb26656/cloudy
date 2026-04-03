import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DirectoryPicker } from "@/components/directory/DirectoryPickerDialog";
import { generateGreeting } from "@/lib/greeting-generator";
import { Lightbulb, Brain, FileCode } from "lucide-react";

type SnippetType = "idea" | "memory" | "artifact";

interface SnippetOption {
  id: SnippetType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const snippetOptions: SnippetOption[] = [
  {
    id: "idea",
    label: "สร้างไอเดีย",
    description: "Brainstorm ไอเดียใหม่ๆ",
    icon: Lightbulb,
  },
  {
    id: "memory",
    label: "บันทึก Memory",
    description: "จดบันทึกความจำสำคัญ",
    icon: Brain,
  },
  {
    id: "artifact",
    label: "สร้าง Artifact",
    description: "สร้างงานสร้างสรรค์ใหม่",
    icon: FileCode,
  },
];

interface SnippetButtonsProps {
  onSelect: (type: SnippetType) => void;
}

export function SnippetButtons({ onSelect }: SnippetButtonsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl px-4">
      {snippetOptions.map((snippet) => {
        const Icon = snippet.icon;
        return (
          <Card
            key={snippet.id}
            onClick={() => onSelect(snippet.id)}
            className="p-3 cursor-pointer hover:bg-muted/50 border-transparent hover:border-border transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted text-muted-foreground">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">
                  {snippet.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {snippet.description}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

interface WelcomeStateProps {
  onCreateSession: (directory?: string) => void;
  selectedDirectory?: string | null;
  onSnippetSelect?: (type: SnippetType) => void;
}

export function WelcomeState({
  onCreateSession,
  selectedDirectory,
  onSnippetSelect,
}: WelcomeStateProps) {
  const greeting = useMemo(() => generateGreeting(), []);

  const [openPicker, setOpenPicker] = useState<boolean>(false);
  const [pickedDirectory] = useState<string | null>(selectedDirectory || null);

  const handleStartChat = () => {
    setOpenPicker(true);
  };

  const handleSelectDirectory = (directory: string) => {
    onCreateSession(directory);
  };

  const handleSnippetClick = (type: SnippetType) => {
    if (onSnippetSelect) {
      onSnippetSelect(type);
    } else {
      setOpenPicker(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-md px-6 mb-8">
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

      <SnippetButtons onSelect={handleSnippetClick} />
    </div>
  );
}

export function SelectSessionState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">Select a chat</p>
        <p className="text-sm">Choose a chat from the sidebar to start</p>
      </div>
    </div>
  );
}

interface EmptyChatStateProps {
  onSnippetSelect?: (type: SnippetType) => void;
}

export function EmptyChatState({ onSnippetSelect }: EmptyChatStateProps) {
  const greeting = useMemo(() => generateGreeting(), []);

  const handleSnippetClick = (type: SnippetType) => {
    onSnippetSelect?.(type);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-lg font-medium text-gray-800 dark:text-white mb-2">
        {greeting.title}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        {greeting.subtitle}
      </p>

      <SnippetButtons onSelect={handleSnippetClick} />
    </div>
  );
}
