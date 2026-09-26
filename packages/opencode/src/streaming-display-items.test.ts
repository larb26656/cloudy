import { describe, expect, test } from "vitest";
import type { ChatMessage } from "@repo/ai-core";
import { getStreamingMessageDisplayItems } from "./streaming-display-items";

function message({ id, text }: { id: string; text: string }): ChatMessage {
  return {
    id,
    sessionId: "session",
    role: "assistant",
    createdAt: "1970-01-01T00:00:00.001Z",
    parts: [{ id: `${id}-part`, type: "text", text }],
  };
}

describe("streaming message display items", () => {
  test("uses the fresher streaming message and appends streaming-only messages", () => {
    const remote = message({ id: "remote", text: "hel" });
    const streaming = message({ id: "remote", text: "hello" });
    const streamingOnly = message({ id: "streaming", text: "world" });

    expect(
      getStreamingMessageDisplayItems([remote], [streaming, streamingOnly]),
    ).toEqual([
      { id: "remote", kind: "streaming" },
      { id: "streaming", kind: "streaming" },
    ]);
  });

  test("keeps filtered messages out of both durable and streaming results", () => {
    const visible = message({ id: "visible", text: "visible" });
    const hidden = message({ id: "hidden", text: "hidden" });

    expect(
      getStreamingMessageDisplayItems(
        [visible, hidden],
        [hidden],
        (item) => item.id !== "hidden",
      ),
    ).toEqual([{ id: "visible", kind: "remote", message: visible }]);
  });
});
