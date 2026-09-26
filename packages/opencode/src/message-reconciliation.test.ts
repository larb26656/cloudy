import { describe, expect, test } from "vitest";
import type { ChatMessage, MessagePart } from "@repo/ai-core";
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
  completed = false,
}: {
  id: string;
  role?: "assistant" | "user";
  parts?: MessagePart[];
  completed?: boolean;
}): ChatMessage {
  return {
    id,
    sessionId: "session",
    role,
    parts,
    createdAt: "1970-01-01T00:00:00.001Z",
    updatedAt: completed ? "1970-01-01T00:00:00.002Z" : undefined,
  };
}

function text(id: string, value: string): MessagePart {
  return { id, type: "text", text: value };
}

function tool(id: string): MessagePart {
  return { id, type: "tool", toolName: "bash", status: "pending" };
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

  test("keeps the streamed user message when the remote copy has no parts", () => {
    const remote = message({ id: "user", role: "user" });
    const streaming = message({
      id: "user",
      role: "user",
      parts: [text("text", "hello")],
    });

    expect(pickFresher(remote, streaming)).toBe("streaming");
    expect(reconcileMessages([remote], [streaming])).toEqual([streaming]);
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

  test("prefers a finalized durable assistant message", () => {
    const remote = message({ id: "assistant", completed: true });
    const streaming = message({
      id: "assistant",
      parts: [text("text", "hello")],
    });

    expect(pickFresher(remote, streaming)).toBe("remote");
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
