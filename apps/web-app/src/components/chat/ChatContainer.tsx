// components/chat/ChatContainer.tsx
import { MessageList } from "./message/MessageList";
import { ChatInput } from "./ChatInput";
import { QuestionSheet } from "./QuestionSheet";
import type { ModelConfig } from "../../types";
import { useSessionStore, useDirectoryStore, useMessageStore } from "@/stores";
import { generatePlaceholder } from "@/lib/greeting-generator";
import { useMemo } from "react";
import type { ChatInputContent } from "@/lib/opencode";

interface ChatContainerProps {
  sessionId: string | null;
}

export function ChatContainer({ sessionId }: ChatContainerProps) {
  const createSession = useSessionStore((s) => s.createSession);
  const activeQuestion = useSessionStore((s) => s.activeQuestion);
  const sendMessage = useMessageStore((s) => s.sendMessage);
  const abortGeneration = useMessageStore((s) => s.abortGeneration);
  const selectedDirectory = useDirectoryStore((s) => s.selectedDirectory);
  const sessionStatuses = useSessionStore((s) => s.sessionStatuses);
  const chatplaceholder = useMemo(() => generatePlaceholder(), []);
  const isBusy = Boolean(
    sessionId && sessionStatuses[sessionId]?.type === "busy",
  );

  const getOrCreateSession = async (
    selectedDirectory: string,
  ): Promise<string> => {
    if (sessionId) {
      return sessionId;
    }
    const session = await createSession(selectedDirectory);

    return session.id;
  };

  const handleSend = async (
    content: ChatInputContent,
    model?: ModelConfig | null,
    agent?: string | null,
  ) => {
    if (!selectedDirectory) return;
    const currentSessionId = await getOrCreateSession(selectedDirectory);

    const normalizedContent = {
      ...content,
      text: content.text.trim(),
    };

    await sendMessage(
      selectedDirectory,
      currentSessionId,
      normalizedContent,
      model,
      agent,
    );
  };

  const handleAbort = async () => {
    if (!selectedDirectory) return;
    const currentSessionId = await getOrCreateSession(selectedDirectory);

    await abortGeneration(selectedDirectory, currentSessionId);
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Messages */}
      <MessageList />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onAbort={handleAbort}
        isLoading={isBusy}
        placeholder={chatplaceholder}
        directory={selectedDirectory || ""}
      />

      {/* Question Sheet */}
      <QuestionSheet open={!!activeQuestion} />
    </div>
  );
}
