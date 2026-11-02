import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageList } from "./MessageList";

vi.mock("./useMessageListData", () => ({
  useMessageListData: () => ({
    remoteMessages: [], displayItems: [], streamingIds: [], isLoading: false,
    historyUnavailable: true, error: null, refetch: vi.fn(), hasNextPage: false,
    isFetchingNextPage: false, fetchNextPage: vi.fn(), sessionStatus: undefined,
    isStreaming: false, sessionError: undefined, clearError: vi.fn(),
  }),
}));

test("shows unavailable history instead of the new conversation welcome", () => {
  render(<MessageList selectedSessionId="existing-session" />);
  expect(screen.getByRole("status")).toHaveTextContent("Conversation history is unavailable");
  expect(screen.queryByText("Generate Ideas")).not.toBeInTheDocument();
});
