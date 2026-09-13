import { ArrowDownIcon } from "lucide-react";
import { ErrorState } from "@repo/ui/components/error-state";
import {
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@repo/ui/components/message-scroller";
import { Center } from "@/components/layout";
import { IsVisible } from "@/components/utils/IsVisible";
import type { SessionStatus } from "@opencode-ai/sdk/v2";
import type { Message } from "@/types";
import { ChatMinimap } from "../ChatMinimap";
import { EmptyChatState } from "../ChatEmptyState";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessageBubble } from "./StreamingMessageBubble";
import { ThinkingAnimation } from "./ThinkingAnimation";
import { RetryMessage } from "./RetryMessage";
import { SessionErrorMessage } from "./SessionErrorMessage";
import type { SessionErrorInfo } from "./SessionErrorMessage";
import type { MessageDisplayItem } from "./useMessageListData";

interface MessageListViewProps {
  sessionId: string | null;
  remoteMessages: Message[];
  displayItems: MessageDisplayItem[];
  streamingCount: number;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  isShowEmptyState: boolean;
  onSnippetSelect?: (type: "idea" | "memory" | "artifact") => void;
  sessionStatus: SessionStatus | undefined;
  isStreaming: boolean;
  sessionError: SessionErrorInfo | undefined;
  onDismissError: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  minimapOpen: boolean;
  onCloseMinimap?: () => void;
}

export function MessageListView({
  sessionId,
  remoteMessages,
  displayItems,
  streamingCount,
  isLoading,
  error,
  onRetry,
  isShowEmptyState,
  onSnippetSelect,
  sessionStatus,
  isStreaming,
  sessionError,
  onDismissError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  minimapOpen,
  onCloseMinimap,
}: MessageListViewProps) {
  if (isLoading) {
    return (
      <Center className="flex-1">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="w-48 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </Center>
    );
  }

  if (error) {
    return (
      <Center className="flex-1">
        <ErrorState message={error.message} onRetry={onRetry} />
      </Center>
    );
  }

  if (remoteMessages.length === 0 && streamingCount === 0 && isShowEmptyState) {
    return (
      <Center className="flex-1">
        <EmptyChatState onSnippetSelect={onSnippetSelect} />
      </Center>
    );
  }

  return (
    <div className="relative flex-1 min-h-0">
      <MessageScroller className="h-full">
        <MessageScrollerViewport>
          <MessageScrollerContent
            aria-busy={isStreaming}
            className="mx-auto w-full max-w-4xl gap-0 p-4"
          >
            {hasNextPage && (
              <div className="self-center py-2">
                {isFetchingNextPage ? (
                  <span className="text-sm text-muted-foreground">
                    Loading…
                  </span>
                ) : (
                  <IsVisible onVisible={onLoadMore} />
                )}
              </div>
            )}

            {displayItems.map((item) => (
              <MessageScrollerItem
                key={item.id}
                messageId={item.id}
                scrollAnchor={
                  item.kind === "remote" && item.message.info.role === "user"
                }
              >
                {item.kind === "remote" ? (
                  <MessageBubble message={item.message} />
                ) : (
                  <StreamingMessageBubble
                    sessionId={sessionId ?? ""}
                    messageId={item.id}
                  />
                )}
              </MessageScrollerItem>
            ))}

            {sessionStatus?.type === "retry" && (
              <MessageScrollerItem messageId="__retry">
                <RetryMessage
                  attempt={sessionStatus.attempt}
                  message={sessionStatus.message}
                  next={sessionStatus.next}
                />
              </MessageScrollerItem>
            )}

            {sessionError && (
              <MessageScrollerItem messageId="__session-error">
                <SessionErrorMessage
                  error={sessionError}
                  onDismiss={onDismissError}
                />
              </MessageScrollerItem>
            )}

            {isStreaming && (
              <MessageScrollerItem messageId="__thinking">
                <div className="mt-2">
                  <ThinkingAnimation />
                </div>
              </MessageScrollerItem>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton size="icon-lg" className="rounded-full">
          <ArrowDownIcon className="size-5" />
          <span className="sr-only">Scroll to end</span>
        </MessageScrollerButton>
      </MessageScroller>

      {minimapOpen && onCloseMinimap && remoteMessages.length > 0 && (
        <ChatMinimap messages={remoteMessages} onClose={onCloseMinimap} />
      )}
    </div>
  );
}
