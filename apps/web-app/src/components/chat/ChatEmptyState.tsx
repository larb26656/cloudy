import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { generateGreeting } from "@/lib/greeting-generator";
import { Lightbulb, Brain, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

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
    label: "Generate Ideas",
    description: "Brainstorm new ideas",
    icon: Lightbulb,
  },
  {
    id: "memory",
    label: "Save Memory",
    description: "Record important memories",
    icon: Brain,
  },
  {
    id: "artifact",
    label: "Create Artifact",
    description: "Create something new",
    icon: FileCode,
  },
];

interface SnippetButtonsProps {
  onSelect: (type: SnippetType) => void;
  className?: string;
}

export function SnippetButtons({ onSelect, className }: SnippetButtonsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl px-4",
        className,
      )}
    >
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
  onSnippetSelect?: (type: SnippetType) => void;
}

export function WelcomeState({
  onCreateSession,
  onSnippetSelect,
}: WelcomeStateProps) {
  const greeting = useMemo(() => generateGreeting(), []);

  const handleStartChat = () => {
    onCreateSession();
  };

  const handleSnippetClick = (type: SnippetType) => {
    if (onSnippetSelect) {
      onSnippetSelect(type);
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
    <EmptyState
      title="Select a chat"
      description="Choose a chat from the sidebar to start"
      className="flex-1 bg-muted"
    />
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

      <div className="@container"></div>
      <SnippetButtons
        onSelect={handleSnippetClick}
        className="hidden @compact:block"
      />
    </div>
  );
}
