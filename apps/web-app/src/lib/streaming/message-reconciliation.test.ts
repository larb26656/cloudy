import { describe, expect, test } from "vitest";
import type { ChatMessage } from "@repo/contracts";
import { pickFresher } from "./message-reconciliation";

function assistantMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "message_1",
    sessionId: "session_1",
    role: "assistant",
    parts: [{ id: "part_1", type: "text", text: "" }],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("pickFresher", () => {
  test("keeps the streaming copy when both initial assistant messages are empty", () => {
    expect(pickFresher(assistantMessage(), assistantMessage())).toBe(
      "streaming",
    );
  });

  test("prefers the finalized remote message over the streaming copy", () => {
    expect(
      pickFresher(
        assistantMessage({ updatedAt: "2026-01-01T00:00:01.000Z" }),
        assistantMessage({
          parts: [{ id: "part_1", type: "text", text: "hello" }],
        }),
      ),
    ).toBe("remote");
  });
});
