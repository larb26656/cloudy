import { memo } from "react";
import { MessageSettingsContext } from "./context";
import { MessageListView } from "./MessageListView";
import { useMessageListData } from "./useMessageListData";
import { useChatSettingsStore } from "@/stores/chatSettingsStore";

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
        sessionId={selectedSessionId}
        remoteMessages={remoteMessages}
        displayItems={displayItems}
        streamingCount={streamingIds.length}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isShowEmptyState={isShowEmptyState}
        onSnippetSelect={onSnippetSelect}
        sessionStatus={sessionStatus}
        isStreaming={isStreaming}
        sessionError={sessionError}
        onDismissError={() =>
          selectedSessionId && clearError(selectedSessionId)
        }
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
        minimapOpen={minimapOpen}
        onCloseMinimap={onCloseMinimap}
      />
    </MessageSettingsContext.Provider>
  );
});
