// components/chat/ChatContainer.tsx
import { MessageList } from "./message/MessageList";
import { ChatInput } from "./chat-input";
import { QuestionSheet } from "./QuestionSheet";
import { useStore, useCurrentInstanceId } from "@/stores/instance";
import { useWorkspaceStore } from "@/stores/workspaceStore.new";
import { generatePlaceholder } from "@/lib/greeting-generator";
import { isCommand, parseCommand, executeOCCommand } from "@/lib/command";
import { useMemo } from "react";
import type { ChatInputContent } from "@/lib/opencode";
import type { ModelConfig } from "@/types";

type SnippetType = "idea" | "memory" | "artifact";

interface ChatContainerProps {
  sessionId: string | null;
  initialInput?: string;
  onSnippetSelect?: (type: SnippetType) => void;
  showMinimap?: boolean;
  onCloseMinimap?: () => void;
  showModelSelector?: boolean;
}

export function ChatContainer({
  sessionId,
  onSnippetSelect,
  initialInput,
  showMinimap = false,
  onCloseMinimap,
  showModelSelector = true,
}: ChatContainerProps) {
  const createSession = useStore("session").createSession;
  const instanceId = useCurrentInstanceId();
  const activeQuestion = useStore("session").activeQuestion;
  const sendMessage = useStore("message").sendMessage;
  const abortGeneration = useStore("message").abortGeneration;
  const selectedDirectory = useWorkspaceStore().getCurrentWorkspace()?.directory;
  const selectedSessionId = useStore("session").selectedSessionId;
  const sessionStatuses = useStore("session").sessionStatuses;
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

    const text = normalizedContent.text;

    if (isCommand(text)) {
      const parsed = parseCommand(text);
      if (parsed) {
        await executeOCCommand({
          directory: selectedDirectory,
          sessionId: currentSessionId,
          command: parsed.command,
          arguments: parsed.arguments,
          model,
          agent,
          instanceId,
        });
        return;
      }
    }

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
      <MessageList
        selectedSessionId={selectedSessionId}
        onSnippetSelect={onSnippetSelect}
        showMinimap={showMinimap}
        onCloseMinimap={onCloseMinimap}
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onAbort={handleAbort}
        isLoading={isBusy}
        placeholder={chatplaceholder}
        directory={selectedDirectory || ""}
        initialValue={initialInput}
        showModelSelector={showModelSelector}
      />

      {/* Question Sheet */}
      <QuestionSheet open={!!activeQuestion} />
    </div>
  );
}
