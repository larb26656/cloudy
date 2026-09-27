import { memo } from "react";
import {
  MessageListView,
  MessageSettingsContext,
} from "@repo/ui/components/message";
import { useMessageListData } from "./useMessageListData";
import { useChatSettingsStore } from "@/stores/chatSettingsStore";
import { ChatMinimap } from "../ChatMinimap";
import { EmptyChatState } from "../ChatEmptyState";
import { StreamingMessageBubble } from "./StreamingMessageBubble";

interface MessageListProps {
  selectedSessionId: string | null;
  directory?: string;
  isShowEmptyState?: boolean;
  onSnippetSelect?: (type: "idea" | "memory" | "artifact") => void;
  minimapOpen?: boolean;
  onCloseMinimap?: () => void;
}

export const MessageList = memo(function MessageList({
  selectedSessionId,
  directory,
  isShowEmptyState = true,
  onSnippetSelect,
  minimapOpen = false,
  onCloseMinimap,
}: MessageListProps) {
  const autoExpandThinking = useChatSettingsStore((s) => s.autoExpandThinking);
  const {
    remoteMessages,
    displayItems,
    streamingIds,
    isLoading,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    sessionStatus,
    isStreaming,
    sessionError,
    clearError,
  } = useMessageListData({ selectedSessionId, directory });

  return (
    <MessageSettingsContext.Provider value={{ autoExpandThinking }}>
      <MessageListView
        remoteMessages={remoteMessages}
        displayItems={displayItems}
        streamingCount={streamingIds.length}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        emptyState={
          isShowEmptyState ? (
            <EmptyChatState onSnippetSelect={onSnippetSelect} />
          ) : undefined
        }
        sessionStatus={sessionStatus}
        isStreaming={isStreaming}
        sessionError={sessionError}
        onDismissError={() =>
          selectedSessionId && clearError(selectedSessionId)
        }
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
        streamingMessage={(messageId) => (
          <StreamingMessageBubble
            sessionId={selectedSessionId ?? ""}
            messageId={messageId}
          />
        )}
        minimap={
          minimapOpen && onCloseMinimap && remoteMessages.length > 0 ? (
            <ChatMinimap messages={remoteMessages} onClose={onCloseMinimap} />
          ) : undefined
        }
      />
    </MessageSettingsContext.Provider>
  );
});
