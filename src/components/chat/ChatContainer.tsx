// components/chat/ChatContainer.tsx
import { MessageList } from "./message/MessageList";
import { ChatInput } from "./ChatInput";
import type { ModelConfig } from "../../types";
import { useSessionStore } from "@/stores";
import { useChatWorkspace } from "@/hooks/useChatWorkspace";

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

  const handleSend = async (text: string, model?: ModelConfig | null) => {
    await sendMessage(text, model);
  };

  const handleAbort = async () => {
    await abortGeneration();
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">Select a chat</p>
          <p className="text-sm">Choose a chat from the sidebar to start</p>
        </div>
      </div>
    );
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
