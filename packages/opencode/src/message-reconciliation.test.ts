import { describe, expect, test } from "vitest";
import type { Part } from "@opencode-ai/sdk/v2";
import type { Message } from "./message-stream";
import {
  mergeMessage,
  mergeMessages,
  pickFresher,
  reconcileMessages,
} from "./message-reconciliation";

function message({
  id,
  role = "assistant",
  parts = [],
  completed,
}: {
  id: string;
  role?: "assistant" | "user";
  parts?: Part[];
  completed?: number;
}): Message {
  return {
    info: {
      id,
      sessionID: "session",
      role,
      time: { created: 1, ...(completed ? { completed } : {}) },
    } as Message["info"],
    parts,
  };
}

function text(id: string, value: string): Part {
  return {
    id,
    sessionID: "session",
    messageID: "message",
    type: "text",
    text: value,
  } as Part;
}

function tool(id: string): Part {
  return {
    id,
    sessionID: "session",
    messageID: "message",
    type: "tool",
    callID: "call",
    tool: "bash",
    state: { status: "pending", input: {}, raw: "" },
  } as Part;
}

describe("message reconciliation", () => {
  test("keeps the durable user message when its stream copy has no parts", () => {
    const remote = message({
      id: "user",
      role: "user",
      parts: [text("text", "hello")],
    });
    const streaming = message({ id: "user", role: "user" });

    expect(reconcileMessages([remote], [streaming])).toEqual([remote]);
  });

  test("uses the longer in-progress assistant stream", () => {
    const remote = message({ id: "assistant", parts: [text("text", "hel")] });
    const streaming = message({
      id: "assistant",
      parts: [text("text", "hello"), tool("tool")],
    });

    expect(pickFresher(remote, streaming)).toBe("streaming");
    expect(reconcileMessages([remote], [streaming])).toEqual([streaming]);
  });

  test("merges durable parts with streamed parts without dropping either", () => {
    const remote = message({ id: "assistant", parts: [text("text", "hello")] });
    const streaming = message({ id: "assistant", parts: [tool("tool")] });

    expect(mergeMessage(remote, streaming).parts).toEqual([
      text("text", "hello"),
      tool("tool"),
    ]);
  });

  test("merges streamed messages into the durable timeline", () => {
    const remote = message({
      id: "assistant",
      parts: [text("text", "hello")],
    });
    const streaming = message({ id: "assistant", parts: [tool("tool")] });

    expect(mergeMessages([remote], [streaming])).toEqual([
      mergeMessage(remote, streaming),
    ]);
  });
});
