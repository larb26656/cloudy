// components/chat/ChatContainer.tsx
import { MessageList } from "./message/MessageList";
import { ChatInput } from "./ChatInput";
import type { ModelConfig } from "../../types";
import { useBoundStore } from "@/stores";

interface ChatContainerProps {
  sessionId: string;
}

export function ChatContainer({ sessionId }: ChatContainerProps) {
  const session = useBoundStore((state) =>
    state.sessions.find((s) => s.id === sessionId),
  );
  const sessionStatus = useBoundStore(
    (state) => state.sessionStatuses[sessionId],
  );
  const sendMessage = useBoundStore((state) => state.sendMessage);
  const abortGeneration = useBoundStore((state) => state.abortGeneration);
  const streamingMessageIds = useBoundStore(
    (state) => state.streamingMessageIds,
  );

  // const isLoading =
  //   sessionStatus === "busy" || !!streamingMessageIds[sessionId];
  // TODO fix this
  const isLoading = false;

  const handleSend = async (text: string, model?: ModelConfig | null) => {
    // TODO receive model
    await sendMessage(sessionId, text);
  };

  const handleAbort = async () => {
    await abortGeneration(sessionId);
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
      <MessageList sessionId={sessionId} />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onAbort={handleAbort}
        isLoading={isLoading}
        placeholder={`Message ${session.title || "AI"}...`}
        directory={session.directory}
      />
    </div>
  );
}
