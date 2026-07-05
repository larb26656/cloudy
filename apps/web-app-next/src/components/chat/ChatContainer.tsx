import { MessageList } from "./message/MessageList";
import { ChatInput } from "./chat-input";
import { QuestionSheet } from "./QuestionSheet";
import { useMemo } from "react";
import { generatePlaceholder } from "@/lib/greeting-generator";

interface ChatContainerProps {
  sessionId: string | null;
  showModelSelector?: boolean;
}

const MOCK_DIRECTORY = "/tmp/cloudy-mock";

export function ChatContainer({
  sessionId,
  showModelSelector = false,
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
    <div className="flex-1 flex flex-col bg-background overflow-hidden h-full">
      <MessageList selectedSessionId={sessionId} />

      <ChatInput
        onSend={handleSend}
        onImmediateCommand={handleImmediateCommand}
        onAbort={handleAbort}
        isLoading={false}
        placeholder={chatplaceholder}
        directory={MOCK_DIRECTORY}
        showModelSelector={showModelSelector}
      />

      <QuestionSheet open={false} />
    </div>
  );
}
