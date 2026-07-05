import { MessageList } from "./message/MessageList";
import { ChatInput } from "./chat-input";
import { QuestionSheet } from "./QuestionSheet";
import { useMemo } from "react";
import { generatePlaceholder } from "@/lib/greeting-generator";

type SnippetType = "idea" | "memory" | "artifact";

interface ChatContainerProps {
  sessionId: string | null;
  initialInput?: string;
  onSnippetSelect?: (type: SnippetType) => void;
  showMinimap?: boolean;
  onCloseMinimap?: () => void;
  showModelSelector?: boolean;
  isDarkMode?: boolean;
}

const MOCK_DIRECTORY = "/tmp/cloudy-mock";

export function ChatContainer({
  sessionId,
  onSnippetSelect,
  initialInput,
  showMinimap = false,
  onCloseMinimap,
  showModelSelector = true,
}: ChatContainerProps) {
  const chatplaceholder = useMemo(() => generatePlaceholder(), []);

  const handleSend = () => {
    // mock: no-op. Wire to React Query in M4.
  };

  const handleAbort = () => {
    // mock: no-op
  };

  const handleImmediateCommand = () => {
    // mock: no-op
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <MessageList
        selectedSessionId={sessionId}
        onSnippetSelect={onSnippetSelect}
        showMinimap={showMinimap}
        onCloseMinimap={onCloseMinimap}
      />

      <ChatInput
        onSend={handleSend}
        onImmediateCommand={handleImmediateCommand}
        onAbort={handleAbort}
        isLoading={false}
        placeholder={chatplaceholder}
        directory={MOCK_DIRECTORY}
        initialValue={initialInput}
        showModelSelector={showModelSelector}
      />

      <QuestionSheet open={false} />
    </div>
  );
}
