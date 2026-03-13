// components/chat/ChatContainer.tsx
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useSessionStore } from "../../stores/sessionStore";
import { useMessageStore } from "../../stores/messageStore";
import type { ModelConfig } from "../../types";
import { ScrollArea } from "../ui/scroll-area";

interface ChatContainerProps {
  sessionId: string;
}

export function ChatContainer({ sessionId }: ChatContainerProps) {
  const session = useSessionStore((state) =>
    state.sessions.find((s) => s.id === sessionId),
  );
  const sessionStatus = useSessionStore(
    (state) => state.sessionStatuses[sessionId],
  );
  const sendMessage = useMessageStore((state) => state.sendMessage);
  const abortGeneration = useMessageStore((state) => state.abortGeneration);
  const streamingMessageIds = useMessageStore(
    (state) => state.streamingMessageIds,
  );

  const isLoading =
    sessionStatus === "busy" || !!streamingMessageIds[sessionId];

  const handleSend = async (text: string, model?: ModelConfig | null) => {
    await sendMessage(sessionId, text, model);
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
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {session.title || "New Chat"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {session.directory}
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {sessionStatus === "busy" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                Processing...
              </div>
            )}
            {sessionStatus === "retry" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                Error - Retrying
              </div>
            )}
            {(!sessionStatus || sessionStatus === "idle") && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Ready
              </div>
            )}
          </div>
        </div>
      </div>

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
