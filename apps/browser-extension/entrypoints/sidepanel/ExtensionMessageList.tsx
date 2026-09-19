import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { MessageBubble, ThinkingAnimation } from "@repo/ui/components/message";
import type { Message } from "@repo/ui/components/message/types";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerViewport,
} from "@repo/ui/components/message-scroller";

interface ExtensionMessageListProps {
  messages: Message[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

export function ExtensionMessageList({
  messages,
  isLoading,
  isGenerating,
  error,
}: ExtensionMessageListProps) {
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
          ) : messages.length === 0 ? (
            <EmptyState
              size="inline"
              title="Ask Cloudy anything about this workspace."
            />
          ) : (
            messages.map((message) => (
              <MessageScrollerItem
                key={message.info.id}
                messageId={message.info.id}
                scrollAnchor={message.info.role === "user"}
              >
                <MessageBubble message={message} />
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
