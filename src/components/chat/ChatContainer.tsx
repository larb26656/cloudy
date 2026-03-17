// components/chat/ChatContainer.tsx
import { MessageList } from "./message/MessageList";
import { ChatInput } from "./ChatInput";
import type { ModelConfig } from "../../types";
import { useSessionStore } from "@/stores";
import { useChatWorkspace } from "@/hooks/useChatWorkspace";
import { SelectSessionState } from "./ChatEmptyState";

interface ChatContainerProps {}

export function ChatContainer({}: ChatContainerProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const selectedSessionId = useSessionStore((s) => s.selectedSessionId);
  const session = sessions.find((s) => s.id === selectedSessionId);
  const { sendMessage, abortGeneration } = useChatWorkspace();
  const sessionStatuses = useSessionStore((s) => s.sessionStatuses);
  const isBusy = Boolean(
    selectedSessionId && sessionStatuses[selectedSessionId]?.type === "busy",
  );

  const handleSend = async (text: string, model?: ModelConfig | null, agent?: string | null) => {
    await sendMessage(text, model, agent);
  };

  const handleAbort = async () => {
    await abortGeneration();
  };

  if (!session) {
    return <SelectSessionState />;
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Messages */}
      <MessageList />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onAbort={handleAbort}
        isLoading={isBusy}
        placeholder={`Message ${session.title || "AI"}...`}
        directory={session.directory}
      />
    </div>
  );
}
