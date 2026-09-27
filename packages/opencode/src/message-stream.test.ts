import { describe, expect, test } from "vitest";
import type { ChatEvent, MessagePart } from "@repo/ai-core";
import {
  applyChatEvent,
  applyMessagePart,
  applyMessagePartDelta,
  createMessageStreamState,
} from "./message-stream";

const part = (
  id: string,
  type: "text" | "reasoning" | "tool",
  text = "",
): MessagePart =>
  type === "tool"
    ? {
        id,
        type,
        toolName: "bash",
        callId: "call",
        status: "pending",
        input: {},
      }
    : { id, type, text };

describe("message stream reducer", () => {
  test("buffers out-of-order deltas and flushes them on part update", () => {
    const pending = applyMessagePartDelta(
      createMessageStreamState(),
      "message",
      "text",
      "hello",
    );
    const next = applyMessagePart(
      pending,
      "session",
      "message",
      part("text", "text", " world"),
    );

    expect(next.messages.get("message")?.parts).toEqual([
      part("text", "text", " worldhello"),
    ]);
    expect(next.pendingDeltas.has("text")).toBe(false);
  });

  test("replaces parts by id and appends text or reasoning deltas", () => {
    const first = applyMessagePart(
      createMessageStreamState(),
      "session",
      "message",
      part("text", "text", "hello"),
    );
    const second = applyMessagePartDelta(first, "message", "text", "!");

    expect(second.messages.get("message")?.parts).toEqual([
      part("text", "text", "hello!"),
    ]);
    const replaced = applyMessagePart(
      second,
      "session",
      "message",
      part("text", "text", "updated"),
    );
    expect(replaced.messages.get("message")?.parts).toEqual([
      part("text", "text", "updated"),
    ]);
  });

  test("keeps non-text parts unchanged when a delta arrives", () => {
    const next = applyMessagePartDelta(
      applyMessagePart(
        createMessageStreamState(),
        "session",
        "message",
        part("tool", "tool"),
      ),
      "message",
      "tool",
      "ignored",
    );

    expect(next.messages.get("message")?.parts).toEqual([part("tool", "tool")]);
    expect(next.pendingDeltas.size).toBe(0);
  });

  test("applies normalized chat events only for the selected session", () => {
    const event: ChatEvent = {
      type: "message.updated",
      providerId: "opencode",
      sessionId: "session",
      message: {
        id: "message",
        sessionId: "session",
        role: "assistant",
        parts: [],
        createdAt: "1970-01-01T00:00:00.000Z",
      },
    };

    expect(
      applyChatEvent(createMessageStreamState(), event, "session").messages.get(
        "message",
      ),
    ).toEqual(event.message);
    expect(
      applyChatEvent(createMessageStreamState(), event, "other").messages.size,
    ).toBe(0);
  });
});
