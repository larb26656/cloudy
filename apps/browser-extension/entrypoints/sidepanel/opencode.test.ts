import { describe, expect, it } from "vitest";
import type { GlobalEvent, Part } from "@opencode-ai/sdk/v2/client";
import type { Message } from "@repo/ui/components/message/types";
import { applyStreamEvent, toMessage, type StreamState } from "./opencode";

const sessionId = "session-1";

function messageParts(message: Message): Part[] {
  return message.parts;
}

function event(payload: GlobalEvent["payload"]): GlobalEvent {
  return { directory: "/workspace", payload } as GlobalEvent;
}

function state(): StreamState {
  return {
    messages: new Map(),
    pendingDeltas: new Map(),
  };
}

function part(
  type: "text" | "reasoning" | "tool",
  id: string,
  text = "",
): Part {
  if (type === "tool") {
    return {
      id,
      sessionID: sessionId,
      messageID: "message-1",
      type,
      callID: "call-1",
      tool: "bash",
      state: { status: "pending", input: {}, raw: "" },
    } as Part;
  }
  return {
    id,
    sessionID: sessionId,
    messageID: "message-1",
    type,
    text,
  } as Part;
}

describe("extension OpenCode message assembly", () => {
  it("retains every loaded part", () => {
    const parts = [part("text", "text-1", "hello"), part("tool", "tool-1")];
    const message = toMessage({
      info: {
        id: "message-1",
        sessionID: sessionId,
        role: "assistant",
        time: { created: 1 },
      } as Message["info"],
      parts,
    });

    expect(messageParts(message)).toEqual(parts);
  });

  it("stores non-text updates without changing their shape", () => {
    const next = applyStreamEvent(
      state(),
      event({
        type: "message.part.updated",
        properties: {
          sessionID: sessionId,
          part: part("tool", "tool-1"),
          time: 1,
        },
      } as unknown as GlobalEvent["payload"]),
      sessionId,
    );

    expect(next.messages.get("message-1")?.parts).toEqual([
      part("tool", "tool-1"),
    ]);
  });

  it("applies deltas that arrive before the part update", () => {
    const pending = applyStreamEvent(
      state(),
      event({
        type: "message.part.delta",
        properties: {
          sessionID: sessionId,
          messageID: "message-1",
          partID: "text-1",
          field: "text",
          delta: "hello",
        },
      } as unknown as GlobalEvent["payload"]),
      sessionId,
    );
    const next = applyStreamEvent(
      pending,
      event({
        type: "message.part.updated",
        properties: {
          sessionID: sessionId,
          part: part("text", "text-1", " world"),
          time: 1,
        },
      } as unknown as GlobalEvent["payload"]),
      sessionId,
    );

    expect(next.messages.get("message-1")?.parts).toEqual([
      part("text", "text-1", " worldhello"),
    ]);
    expect(next.pendingDeltas.has("text-1")).toBe(false);
  });

  it("updates text and reasoning while ignoring deltas for other parts", () => {
    let next = applyStreamEvent(
      state(),
      event({
        type: "message.part.updated",
        properties: {
          sessionID: sessionId,
          part: part("reasoning", "reasoning-1", "think"),
          time: 1,
        },
      } as unknown as GlobalEvent["payload"]),
      sessionId,
    );
    next = applyStreamEvent(
      next,
      event({
        type: "message.part.delta",
        properties: {
          sessionID: sessionId,
          messageID: "message-1",
          partID: "reasoning-1",
          field: "text",
          delta: " more",
        },
      } as unknown as GlobalEvent["payload"]),
      sessionId,
    );

    expect(next.messages.get("message-1")?.parts).toEqual([
      part("reasoning", "reasoning-1", "think more"),
    ]);
  });
});
