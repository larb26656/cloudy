import { beforeEach, describe, expect, test } from "vitest";
import type { Part } from "@opencode-ai/sdk/v2";
import { useStreamingMessagesStore } from "./streaming-store";

function textPart(sessionID: string, messageID: string, id: string): Part {
  return {
    id,
    sessionID,
    messageID,
    type: "text",
    text: "base",
  } as Part;
}

describe("streaming store", () => {
  beforeEach(() => {
    useStreamingMessagesStore.setState({
      streamingMessages: new Map(),
      pendingDeltas: new Map(),
    });
  });

  test("isolates messages and pending deltas by session", () => {
    const store = useStreamingMessagesStore.getState();
    store.onMessagePartDeltaUpdated("session-a", "message-a", "part-a", "a");
    store.onMessagePartDeltaUpdated("session-b", "message-b", "part-b", "b");

    const state = useStreamingMessagesStore.getState();
    expect(state.pendingDeltas.get("session-a")?.get("part-a")).toBe("a");
    expect(state.pendingDeltas.get("session-a")?.has("part-b")).toBe(false);
    expect(state.pendingDeltas.get("session-b")?.get("part-b")).toBe("b");
  });

  test("flushes pending deltas and clears a finalized session", () => {
    const store = useStreamingMessagesStore.getState();
    store.onMessagePartDeltaUpdated(
      "session-a",
      "message-a",
      "part-a",
      "delta",
    );
    store.onMessagePartUpdated(
      "session-a",
      textPart("session-a", "message-a", "part-a"),
    );

    expect(
      useStreamingMessagesStore
        .getState()
        .streamingMessages.get("session-a")
        ?.get("message-a")?.parts[0],
    ).toMatchObject({ text: "basedelta" });

    expect(store.takeSessionStreaming("session-a")).toHaveLength(1);
    expect(
      useStreamingMessagesStore.getState().streamingMessages.has("session-a"),
    ).toBe(false);
    expect(
      useStreamingMessagesStore.getState().pendingDeltas.has("session-a"),
    ).toBe(false);
  });

  test("notifies selectors with a new session map for updates", () => {
    const selected: unknown[] = [];
    const unsubscribe = useStreamingMessagesStore.subscribe((state) => {
      selected.push(state.streamingMessages.get("session-a"));
    });

    useStreamingMessagesStore
      .getState()
      .onMessagePartUpdated(
        "session-a",
        textPart("session-a", "message-a", "part-a"),
      );

    unsubscribe();
    expect(selected).toHaveLength(1);
    expect(selected[0]).toBeInstanceOf(Map);
  });
});
