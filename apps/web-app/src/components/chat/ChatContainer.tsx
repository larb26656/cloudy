import { MessageList } from "./message/MessageList";
import { ChatInput } from "./chat-input";
import { QuestionSheet } from "./QuestionSheet";
import { useMemo, useState } from "react";
import { generatePlaceholder } from "@/lib/greeting-generator";
import { useSendMessage } from "@/hooks/queries/useMessages";
import { useCreateSession } from "@/hooks/queries/useSessions";
import { useQuestions, useSessionQuestions } from "@/hooks/queries/useQuestions";
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

  const [questionOpen, setQuestionOpen] = useState(false);

  const { data: questions = [] } = useQuestions({
    directory: directory,
  });

  const sessionQuestions = questions.filter(question => question.sessionID === sessionId);

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

      {sessionQuestions.length > 0 && !questionOpen && (
        <button
          onClick={() => setQuestionOpen(true)}
          className="fixed top-4 right-4 z-40 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full shadow-md hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
        >
          {sessionQuestions.length} question{sessionQuestions.length > 1 ? "s" : ""} pending
        </button>
      )}

      <QuestionSheet
        open={questionOpen}
        onOpenChange={setQuestionOpen}
        questions={sessionQuestions}
        sessionID={sessionId ?? ""}
      />
    </div>
  );
}
