import { describe, expect, it, vi } from "vitest";
import type { ChatEvent, ChatMessage, MessagePart } from "@repo/opencode";
import { applyChatEvent, type MessageStreamState } from "@repo/opencode";
import {
  INJECTED_CONTEXT_MARKER,
  isInjectedContextMessage,
} from "../lib/opencode/sessions";
import { subscribeToProviderEvents } from "../lib/cloudy/provider";

const sessionId = "session-1";

function message(
  parts: MessagePart[],
  role: ChatMessage["role"] = "user",
): ChatMessage {
  return {
    id: "message-1",
    sessionId,
    role,
    parts,
    createdAt: new Date(1).toISOString(),
  };
}

function state(): MessageStreamState {
  return { messages: new Map(), pendingDeltas: new Map() };
}

function textPart(id: string, text: string): MessagePart {
  return { id, type: "text", text };
}

describe("extension provider message handling", () => {
  it("identifies injected context user messages", () => {
    expect(
      isInjectedContextMessage(
        message([textPart("context", `${INJECTED_CONTEXT_MARKER}\ncontent`)]),
      ),
    ).toBe(true);
  });

  it("preserves all normalized message parts", () => {
    const normalized = message(
      [
        textPart("text-1", "hello"),
        {
          id: "tool-1",
          type: "tool",
          toolName: "bash",
          status: "pending",
        },
      ],
      "assistant",
    );

    expect(normalized.parts).toEqual([
      expect.objectContaining({ id: "text-1", type: "text", text: "hello" }),
      expect.objectContaining({
        id: "tool-1",
        type: "tool",
        toolName: "bash",
        status: "pending",
      }),
    ]);
  });

  it("applies normalized part updates and deltas", () => {
    const updated: ChatEvent = {
      type: "message.part.updated",
      sessionId,
      messageId: "message-1",
      part: textPart("text-1", " world"),
    };
    const delta: ChatEvent = {
      type: "message.delta",
      sessionId,
      messageId: "message-1",
      partId: "text-1",
      delta: "hello",
    };

    const pending = applyChatEvent(state(), delta, sessionId);
    const next = applyChatEvent(pending, updated, sessionId);

    expect(next.messages.get("message-1")?.parts).toEqual([
      expect.objectContaining({ id: "text-1", text: " worldhello" }),
    ]);
    expect(next.pendingDeltas.has("text-1")).toBe(false);
  });

  it("ignores events for another session", () => {
    const event: ChatEvent = {
      type: "message.delta",
      sessionId: "other-session",
      messageId: "message-1",
      partId: "text-1",
      delta: "ignored",
    };

    expect(applyChatEvent(state(), event, sessionId)).toEqual(state());
  });

  it("parses normalized SSE frames split across chunks", async () => {
    const controller = new AbortController();
    const event: ChatEvent = {
      type: "message.delta",
      sessionId,
      messageId: "message-1",
      partId: "text-1",
      delta: "hello",
    };
    const encoded = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(streamController) {
        const serialized = JSON.stringify(event);
        streamController.enqueue(
          encoded.encode(
            `event: message.delta\ndata: ${serialized.slice(0, 20)}`,
          ),
        );
        streamController.enqueue(encoded.encode(`${serialized.slice(20)}\n\n`));
        streamController.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        }),
      ),
    );
    const received: ChatEvent[] = [];

    await subscribeToProviderEvents(
      "/workspace",
      (next) => received.push(next),
      controller.signal,
    );

    expect(received).toEqual([event]);
    vi.unstubAllGlobals();
  });
});
