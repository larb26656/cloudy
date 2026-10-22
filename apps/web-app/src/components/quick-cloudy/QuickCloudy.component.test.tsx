import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuickCloudy } from "./QuickCloudy";

const { createSession, sendMessage, hide, openSession } = vi.hoisted(() => ({
  createSession: vi.fn(),
  sendMessage: vi.fn(),
  hide: vi.fn(),
  openSession: vi.fn(),
}));

vi.mock("@/hooks/queries/useSessions", () => ({
  useCreateSession: () => ({ mutateAsync: createSession, isPending: false }),
}));
vi.mock("@/hooks/queries/useMessages", () => ({
  useSendMessage: () => ({ mutateAsync: sendMessage, isPending: false }),
}));
vi.mock("@/stores/defaultProviderStore", () => ({
  useDefaultProviderStore: (
    selector: (state: { defaultProviderId: string }) => unknown,
  ) => selector({ defaultProviderId: "cloudy" }),
}));
vi.mock("@/stores/defaultModelStore", () => ({
  useDefaultModelStore: (
    selector: (state: { defaultModels: Record<string, null> }) => unknown,
  ) => selector({ defaultModels: {} }),
}));
vi.mock("@/stores/streamingMessagesStore", () => ({
  useStreamingMessagesStore: (
    selector: (state: {
      streamingMessages: Map<string, Map<string, never>>;
    }) => unknown,
  ) => selector({ streamingMessages: new Map() }),
}));
vi.mock("@/lib/desktop/quickBridge", () => ({
  quickBridge: { hide, openSession, onFocusInput: () => () => {} },
}));

describe("QuickCloudy", () => {
  afterEach(() => vi.clearAllMocks());

  it("opens a chat tab, sends the first prompt and hides Quick Cloudy", async () => {
    createSession.mockResolvedValue({
      id: "session-1",
      providerId: "cloudy",
      directory: "",
      title: "Hello",
    });
    sendMessage.mockResolvedValue({});
    render(<QuickCloudy />);
    const input = screen.getByRole("textbox", { name: "Ask Cloudy" });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-1",
        content: expect.objectContaining({ text: "Hello" }),
      }),
    );
    expect(openSession).toHaveBeenCalledWith({
      type: "chat",
      data: {
        providerId: "cloudy",
        sessionId: "session-1",
        workspaceId: null,
        directory: "",
        sessionName: "Hello",
      },
    });
    expect(hide).toHaveBeenCalledOnce();
  });

  it("hides on Escape and displays submission errors", async () => {
    createSession.mockRejectedValue(new Error("Provider unavailable"));
    render(<QuickCloudy />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(hide).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByRole("textbox", { name: "Ask Cloudy" }), {
      target: { value: "Hello" },
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Ask Cloudy" }), {
      key: "Enter",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Provider unavailable",
    );
  });
});
