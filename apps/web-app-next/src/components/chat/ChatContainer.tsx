import { MessageList } from "./message/MessageList";
import { ChatInput } from "./chat-input";
import { QuestionSheet } from "./QuestionSheet";
import { useMemo } from "react";
import { generatePlaceholder } from "@/lib/greeting-generator";
import { useSendMessage } from "@/hooks/queries/useMessages";
import { useCreateSession } from "@/hooks/queries/useSessions";
import { type ChatInputContent } from "@/lib/opencode";
import { MOCK_DIRECTORY } from "@/constants/mock";
import { useSessionStore } from "@/stores/sessionStore";

interface ChatContainerProps {
  sessionId: string | null;
  showModelSelector?: boolean;
  onSessionChange?: (sessionId: string) => void;
}

export function ChatContainer({
  sessionId,
  showModelSelector = false,
  onSessionChange,
}: ChatContainerProps) {
  const chatplaceholder = useMemo(() => generatePlaceholder(), []);
  const sendMessage = useSendMessage();
  const createSession = useCreateSession();
  const selectSession = useSessionStore((s) => s.selectSession);

  const handleSend = (content: ChatInputContent) => {
    if (!sessionId) {
      createSession.mutate(
        { directory: MOCK_DIRECTORY },
        {
          onSuccess: (newSession) => {
            sendMessage.mutate({
              sessionId: newSession.id,
              content: content.text,
            });
            // TODO deprecate selecte session
            selectSession(newSession.id);
            onSessionChange?.(newSession.id);
          },
        },
      );
      return;
    }
    sendMessage.mutate({
      sessionId,
      content: content.text,
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
        directory={MOCK_DIRECTORY}
        showModelSelector={showModelSelector}
      />

      <QuestionSheet open={false} />
    </div>
  );
}
