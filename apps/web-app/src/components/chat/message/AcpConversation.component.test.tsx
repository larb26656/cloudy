import { describe, expect, test } from "vitest";
import { screen } from "@testing-library/react";
import { AssistantMessageBubble } from "@repo/ui/components/message";
import type { ChatEvent } from "@repo/contracts";
import { applyChatEvent } from "@/lib/streaming/message-stream";
import { renderWithProviders } from "@/test/utils";

describe("ACP conversation display", () => {
  test("renders accumulated text once and retains each tool's own update", async () => {
    const context = {
      providerId: "acp",
      sessionId: "session",
      directory: "/tmp",
    };
    const events: ChatEvent[] = [
      {
        ...context,
        type: "message.updated",
        message: {
          id: "assistant",
          sessionId: "session",
          role: "assistant",
          parts: [],
          createdAt: "2026-01-01T00:00:00Z",
        },
      },
      {
        ...context,
        type: "message.part.updated",
        messageId: "assistant",
        part: { id: "text", type: "text", text: "Hel" },
      },
      {
        ...context,
        type: "message.part.updated",
        messageId: "assistant",
        part: { id: "text", type: "text", text: "Hello" },
      },
      {
        ...context,
        type: "message.part.updated",
        messageId: "assistant",
        part: { id: "a", type: "tool", callId: "a", output: "first progress" },
      },
      {
        ...context,
        type: "message.part.updated",
        messageId: "assistant",
        part: { id: "b", type: "tool", callId: "b", output: "second progress" },
      },
      {
        ...context,
        type: "message.part.updated",
        messageId: "assistant",
        part: { id: "a", type: "tool", callId: "a", output: "first finished" },
      },
    ];
    let state = { messages: new Map(), pendingDeltas: new Map() };
    for (const event of events) state = applyChatEvent(state, event, "session");
    const message = state.messages.get("assistant");
    expect(message).toBeDefined();
    renderWithProviders(<AssistantMessageBubble message={message!} />);
    expect(await screen.findAllByText("Hello")).toHaveLength(1);
    expect(screen.getByText("first finished")).toBeInTheDocument();
    expect(screen.getByText("second progress")).toBeInTheDocument();
    expect(screen.queryByText("first progress")).not.toBeInTheDocument();
  });
});
