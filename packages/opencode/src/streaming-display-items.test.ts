import { describe, expect, test } from "vitest";
import type { Part } from "@opencode-ai/sdk/v2";
import type { Message } from "./message-stream";
import { getStreamingMessageDisplayItems } from "./streaming-display-items";

function message({ id, text }: { id: string; text: string }): Message {
  return {
    info: {
      id,
      sessionID: "session",
      role: "assistant",
      time: { created: 1 },
    } as Message["info"],
    parts: [
      {
        id: `${id}-part`,
        sessionID: "session",
        messageID: id,
        type: "text",
        text,
      } as Part,
    ],
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
        (item) => item.info.id !== "hidden",
      ),
    ).toEqual([{ id: "visible", kind: "remote", message: visible }]);
  });
});
