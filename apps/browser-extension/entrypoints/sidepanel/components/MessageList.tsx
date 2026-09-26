import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { MessageBubble, ThinkingAnimation } from "@repo/ui/components/message";
import type { StreamingMessageDisplayItem } from "@repo/opencode";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerViewport,
} from "@repo/ui/components/message-scroller";
import { StreamingMessageBubble } from "./StreamingMessageBubble";
import { ContextMessageBubble } from "./ContextMessageBubble";
import { getInjectedContexts } from "../lib/opencode/context";

interface MessageListProps {
  displayItems: StreamingMessageDisplayItem[];
  streamingCount: number;
  sessionId: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

export function MessageList({
  displayItems,
  streamingCount,
  sessionId,
  isLoading,
  isGenerating,
  error,
}: MessageListProps) {
  return (
    <MessageScroller className="messages">
      <MessageScrollerViewport>
        <MessageScrollerContent
          aria-live="polite"
          aria-busy={isLoading || isGenerating}
          className="message-content"
        >
          {isLoading ? (
            <LoadingState size="inline" title="Loading messages..." />
          ) : displayItems.length === 0 ? (
            <EmptyState
              size="inline"
              title="Ask Cloudy anything about this workspace."
            />
          ) : (
            displayItems.map((item) => (
              <MessageScrollerItem
                key={item.id}
                messageId={item.id}
                scrollAnchor={
                  item.kind === "remote" && item.message.info.role === "user"
                }
              >
                {item.kind === "remote" ? (
                  getInjectedContexts(item.message).length > 0 ? (
                    <ContextMessageBubble message={item.message} />
                  ) : (
                    <MessageBubble message={item.message} />
                  )
                ) : (
                  <StreamingMessageBubble
                    sessionId={sessionId ?? ""}
                    messageId={item.id}
                  />
                )}
              </MessageScrollerItem>
            ))
          )}
          {isGenerating && (
            <MessageScrollerItem messageId="__thinking">
              <div className="thinking-message">
                <ThinkingAnimation />
              </div>
            </MessageScrollerItem>
          )}
          {error && <ErrorState size="inline" bare message={error} />}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton size="icon-lg" className="rounded-full" />
    </MessageScroller>
  );
}
