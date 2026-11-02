import { afterEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageList } from "./MessageList";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";

const state = vi.hoisted(() => ({ streaming: false }));
vi.mock("./StreamingMessageBubble", () => ({
  StreamingMessageBubble: () => <div>Live response</div>,
}));

vi.mock("./useMessageListData", () => ({
  useMessageListData: () => ({
    remoteMessages: [], displayItems: state.streaming ? [{ id: "live", kind: "streaming" }] : [],
    streamingIds: state.streaming ? ["live"] : [], isLoading: false,
    historyUnavailable: true, error: null, refetch: vi.fn(), hasNextPage: false,
    isFetchingNextPage: false, fetchNextPage: vi.fn(), sessionStatus: undefined,
    isStreaming: false, sessionError: undefined, clearError: vi.fn(),
  }),
}));

afterEach(() => { state.streaming = false; });

test("shows unavailable history instead of the new conversation welcome", () => {
  render(<MessageScrollerProvider><MessageList selectedSessionId="existing-session" /></MessageScrollerProvider>);
  expect(screen.getByRole("status")).toHaveTextContent("Conversation history is unavailable");
  expect(screen.queryByText("Generate Ideas")).not.toBeInTheDocument();
});

test("keeps unavailable history visible alongside new activity", () => {
  state.streaming = true;
  render(<MessageScrollerProvider><MessageList selectedSessionId="existing-session" /></MessageScrollerProvider>);
  expect(screen.getByRole("status")).toHaveTextContent("Conversation history is unavailable");
  expect(screen.getByText("Live response")).toBeInTheDocument();
});
