import { describe, expect, test } from "vitest";
import type { Part } from "@opencode-ai/sdk/v2";
import {
  applyMessagePart,
  applyMessagePartDelta,
  createMessageStreamState,
} from "./message-stream";

const part = (
  id: string,
  type: "text" | "reasoning" | "tool",
  text = "",
): Part =>
  (type === "tool"
    ? {
        id,
        sessionID: "session",
        messageID: "message",
        type,
        callID: "call",
        tool: "bash",
        state: { status: "pending", input: {}, raw: "" },
      }
    : { id, sessionID: "session", messageID: "message", type, text }) as Part;

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
      part("text", "text", "hello"),
    );
    const second = applyMessagePartDelta(first, "message", "text", "!");

    expect(second.messages.get("message")?.parts).toEqual([
      part("text", "text", "hello!"),
    ]);
    const replaced = applyMessagePart(
      second,
      "session",
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
        part("tool", "tool"),
      ),
      "message",
      "tool",
      "ignored",
    );

    expect(next.messages.get("message")?.parts).toEqual([part("tool", "tool")]);
    expect(next.pendingDeltas.size).toBe(0);
  });
});
