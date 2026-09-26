import type { GlobalEvent, Message, Part } from "@opencode-ai/sdk/v2";
import { describe, expect, test } from "vitest";
import { toChatEvent, toChatMessage } from "./adapter";

const message = {
  id: "message-1",
  sessionID: "session-1",
  role: "assistant",
  time: { created: 1_000 },
} as Message;

describe("OpenCode adapter", () => {
  test("normalizes messages and preserves provider payloads as metadata", () => {
    const parts = [
      {
        id: "part-1",
        sessionID: "session-1",
        messageID: "message-1",
        type: "text",
        text: "hello",
      },
    ] as Part[];

    expect(toChatMessage(message, parts)).toMatchObject({
      id: "message-1",
      sessionId: "session-1",
      role: "assistant",
      parts: [{ id: "part-1", type: "text", text: "hello" }],
      metadata: { provider: "opencode", raw: message },
    });
  });

  test("normalizes message deltas without exposing SDK field names", () => {
    const event = {
      payload: {
        type: "message.part.delta",
        properties: {
          sessionID: "session-1",
          messageID: "message-1",
          partID: "part-1",
          delta: "hello",
        },
      },
    } as GlobalEvent;

    expect(toChatEvent(event)).toEqual({
      type: "message.delta",
      sessionId: "session-1",
      messageId: "message-1",
      partId: "part-1",
      delta: "hello",
    });
  });

  test("maps unknown provider parts to the explicit fallback", () => {
    const parts = [
      {
        id: "part-1",
        sessionID: "session-1",
        messageID: "message-1",
        type: "provider-specific",
        value: true,
      },
    ] as unknown as Part[];

    expect(toChatMessage(message, parts).parts[0]).toMatchObject({
      type: "unknown",
      providerType: "provider-specific",
      data: { value: true },
    });
  });
});
