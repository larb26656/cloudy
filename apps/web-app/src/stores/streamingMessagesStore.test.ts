import { beforeEach, describe, expect, test } from "vitest";
import type { ChatMessage, MessagePart } from "@repo/contracts";
import { useStreamingMessagesStore } from "./streamingMessagesStore";

function message(id: string): ChatMessage {
  return {
    id,
    sessionId: "session_1",
    role: "assistant",
    parts: [],
    createdAt: "1970-01-01T00:00:00.000Z",
  };
}

function textPart(id: string, text = "base"): MessagePart {
  return { id, type: "text", text };
}

describe("streamingMessagesStore", () => {
  beforeEach(() => {
    useStreamingMessagesStore.setState({
      streamingMessages: new Map(),
      pendingDeltas: new Map(),
    });
  });

  test("stores normalized messages by session", () => {
    const value = message("message_1");

    useStreamingMessagesStore
      .getState()
      .onMessageInfoUpdated("session_1", value);

    expect(
      useStreamingMessagesStore
        .getState()
        .streamingMessages.get("session_1")
        ?.get("message_1"),
    ).toEqual(value);
  });

  test("updates normalized parts and flushes pending deltas", () => {
    const store = useStreamingMessagesStore.getState();
    store.onMessagePartDeltaUpdated(
      "session_1",
      "message_1",
      "part_1",
      " delta",
    );
    store.onMessagePartUpdated("session_1", "message_1", textPart("part_1"));

    expect(
      useStreamingMessagesStore
        .getState()
        .streamingMessages.get("session_1")
        ?.get("message_1")?.parts[0],
    ).toEqual(textPart("part_1", "base delta"));
  });

  test("takes and clears one session without affecting another", () => {
    const first = message("message_1");
    const second = { ...message("message_2"), sessionId: "session_2" };
    const store = useStreamingMessagesStore.getState();
    store.onMessageInfoUpdated("session_1", first);
    store.onMessageInfoUpdated("session_2", second);

    expect(store.takeSessionStreaming("session_1")).toEqual([first]);
    expect(
      useStreamingMessagesStore.getState().streamingMessages.has("session_1"),
    ).toBe(false);
    expect(
      useStreamingMessagesStore
        .getState()
        .streamingMessages.get("session_2")
        ?.get("message_2"),
    ).toEqual(second);
  });
});
