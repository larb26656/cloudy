import { MessageList } from "./message/MessageList";
import { ChatInput } from "./chat-input";
import { QuestionSheet } from "./QuestionSheet";
import { useMemo } from "react";
import { generatePlaceholder } from "@/lib/greeting-generator";
import { useSendMessage } from "@/hooks/queries/useMessages";
import { useCreateSession } from "@/hooks/queries/useSessions";
import { type ChatInputContent } from "@/lib/opencode";

interface ChatContainerProps {
  directory: string;
  sessionId: string | null;
  onSessionChange?: (sessionId: string) => void;
}

export function ChatContainer({
  directory,
  sessionId,
  onSessionChange,
}: ChatContainerProps) {
  const chatplaceholder = useMemo(() => generatePlaceholder(), []);
  const sendMessage = useSendMessage();
  const createSession = useCreateSession();

  const handleSend = (content: ChatInputContent) => {
    if (!sessionId) {
      createSession.mutate(
        { directory },
        {
          onSuccess: (newSession) => {
            sendMessage.mutate({
              sessionId: newSession.id,
              content: content,
              directory: directory,
            });

            onSessionChange?.(newSession.id);
          },
        },
      );
      return;
    }
    sendMessage.mutate({
      sessionId,
      content: content,
      directory: directory,
    });
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
        isLoading={sendMessage.isPending}
        placeholder={chatplaceholder}
        directory={directory}

      />

      <QuestionSheet open={false} />
    </div>
  );
}
