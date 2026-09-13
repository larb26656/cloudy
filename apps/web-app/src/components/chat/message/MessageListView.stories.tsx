import { MessageListView } from "@repo/ui/components/message";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";
import type { Message } from "@repo/ui/components/message/types";
import preview from "@/storybook/preview";

const messages = [
  {
    info: { id: "user-1", role: "user", time: { created: Date.now() } },
    parts: [{ type: "text", text: "Explain the latest changes." }],
  },
  {
    info: {
      id: "assistant-1",
      role: "assistant",
      time: { created: Date.now() },
    },
    parts: [
      { type: "reasoning", text: "I will inspect the implementation first." },
      { type: "text", text: "The message components now live in `@repo/ui`." },
      {
        type: "tool",
        tool: "bash",
        state: {
          status: "completed",
          input: { command: "git status --short" },
        },
      },
    ],
  },
] as unknown as Message[];

const meta = preview.meta({
  title: "Chat/Message/MessageListView",
  component: MessageListView,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <MessageScrollerProvider autoScroll>
        <Story />
      </MessageScrollerProvider>
    ),
  ],
});

export default meta;

export const FullMessageList = meta.story({
  args: {
    remoteMessages: messages,
    displayItems: messages.map((message) => ({
      id: message.info.id,
      kind: "remote" as const,
      message,
    })),
    streamingCount: 0,
    isLoading: false,
    error: null,
    onRetry: () => {},
    sessionStatus: {
      type: "retry",
      attempt: 2,
      message: "Retrying request",
      next: Date.now() + 15_000,
    } as never,
    isStreaming: true,
    sessionError: {
      name: "ProviderError",
      data: { message: "Request failed" },
    } as never,
    onDismissError: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
    onLoadMore: () => {},
    streamingMessage: () => null,
    minimap: (
      <div className="absolute right-4 top-4 rounded border bg-background p-2">
        Minimap
      </div>
    ),
  },
});
