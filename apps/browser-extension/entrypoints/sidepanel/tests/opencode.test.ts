import { describe, expect, it } from "vitest";
import type { GlobalEvent, Part } from "@opencode-ai/sdk/v2/client";
import type { Message } from "@repo/ui/components/message/types";
import { applyStreamEvent, type StreamState } from "../lib/opencode/events";
import {
  INJECTED_CONTEXT_MARKER,
  isInjectedContextMessage,
  toMessage,
} from "../lib/opencode/sessions";

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
  it("identifies injected context user messages", () => {
    const message = toMessage({
      info: {
        id: "context-message",
        sessionID: sessionId,
        role: "user",
        time: { created: 1 },
      } as Message["info"],
      parts: [part("text", "text-1", `${INJECTED_CONTEXT_MARKER}\ncontent`)],
    });

    expect(isInjectedContextMessage(message)).toBe(true);
  });

  it("does not hide normal user or assistant messages", () => {
    const userMessage = toMessage({
      info: {
        id: "user-message",
        sessionID: sessionId,
        role: "user",
        time: { created: 1 },
      } as Message["info"],
      parts: [part("text", "text-1", "What is this page about?")],
    });
    const assistantMessage = toMessage({
      info: {
        id: "assistant-message",
        sessionID: sessionId,
        role: "assistant",
        time: { created: 2 },
      } as Message["info"],
      parts: [part("text", "text-2", "It is a page about testing.")],
    });

    expect(isInjectedContextMessage(userMessage)).toBe(false);
    expect(isInjectedContextMessage(assistantMessage)).toBe(false);
  });

  it("requires the marker at the start of a text part", () => {
    const message = toMessage({
      info: {
        id: "user-message",
        sessionID: sessionId,
        role: "user",
        time: { created: 1 },
      } as Message["info"],
      parts: [
        part("text", "text-1", `quoted ${INJECTED_CONTEXT_MARKER} content`),
      ],
    });

    expect(isInjectedContextMessage(message)).toBe(false);
  });

  it("recognizes a mixed context and prompt message as containing context", () => {
    const message = toMessage({
      info: {
        id: "mixed-message",
        sessionID: sessionId,
        role: "user",
        time: { created: 1 },
      } as Message["info"],
      parts: [
        part("text", "context", `${INJECTED_CONTEXT_MARKER}\ncontent`),
        part("text", "prompt", "What is this page about?"),
      ],
    });

    expect(isInjectedContextMessage(message)).toBe(true);
  });

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
