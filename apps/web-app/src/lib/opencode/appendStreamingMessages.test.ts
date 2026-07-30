import { describe, expect, test } from "vitest";
import type { InfiniteData } from "@tanstack/react-query";
import { appendStreamingMessages } from "./appendStreamingMessages";
import type { Message } from "@/types";
import type { AssistantMessage, Part } from "@opencode-ai/sdk/v2";

const makeInfo = (overrides: Partial<AssistantMessage> = {}): AssistantMessage =>
  ({
    id: "msg_1",
    sessionID: "session_1",
    role: "assistant",
    time: { created: 1 },
    modelID: "glm-5.2",
    providerID: "zai",
    mode: "build",
    agent: "build",
    path: { cwd: "/tmp", root: "/tmp" },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    ...overrides,
  }) as AssistantMessage;

const makeTextPart = (overrides: Partial<Part> = {}): Part =>
  ({
    id: "part_1",
    sessionID: "session_1",
    messageID: "msg_1",
    type: "text",
    text: "hello",
    ...overrides,
  }) as Part;

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  info: makeInfo(),
  parts: [],
  ...overrides,
});

const makeInfiniteData = (
  pages: Message[][],
): InfiniteData<Message[], string | undefined> => ({
  pages,
  pageParams: pages.map((_, i) => (i === 0 ? undefined : `cursor_${i}`)),
});

describe("appendStreamingMessages", () => {
  test("returns placeholder pages when old is undefined and newMessages empty", () => {
    const result = appendStreamingMessages(undefined, []);
    expect(result).toEqual({ pages: [[]], pageParams: [undefined] });
  });

  test("returns newMessages as single page when old is undefined", () => {
    const msg = makeMessage();
    const result = appendStreamingMessages(undefined, [msg]);
    expect(result).toEqual({ pages: [[msg]], pageParams: [undefined] });
  });

  test("appends new message to first page when id does not exist", () => {
    const existing = makeMessage({ info: makeInfo({ id: "msg_a" }) });
    const streaming = makeMessage({ info: makeInfo({ id: "msg_b" }) });
    const old = makeInfiniteData([[existing]]);

    const result = appendStreamingMessages(old, [streaming]);

    expect(result.pages[0]).toHaveLength(2);
    expect(result.pages[0]?.[0]).toEqual(existing);
    expect(result.pages[0]?.[1]).toEqual(streaming);
  });

  test("merges streaming parts into existing message with same id (Bug 1)", () => {
    const cached = makeMessage({
      info: makeInfo({ id: "msg_a", cost: 0 }),
      parts: [],
    });
    const streaming = makeMessage({
      info: makeInfo({ id: "msg_a", cost: 100 }),
      parts: [makeTextPart({ id: "part_text", text: "streamed text" })],
    });
    const old = makeInfiniteData([[cached]]);

    const result = appendStreamingMessages(old, [streaming]);

    expect(result.pages[0]).toHaveLength(1);
    const merged = result.pages[0]?.[0];
    expect((merged?.info as AssistantMessage).cost).toBe(100);
    expect(merged?.parts).toHaveLength(1);
    expect(merged?.parts[0]).toEqual(
      makeTextPart({ id: "part_text", text: "streamed text" }),
    );
  });

  test("preserves cache-only parts when merging", () => {
    const cachedPart = makeTextPart({ id: "part_step_start", type: "step-start" });
    const cached = makeMessage({
      info: makeInfo({ id: "msg_a" }),
      parts: [cachedPart],
    });
    const streaming = makeMessage({
      info: makeInfo({ id: "msg_a" }),
      parts: [makeTextPart({ id: "part_text", text: "streamed" })],
    });
    const old = makeInfiniteData([[cached]]);

    const result = appendStreamingMessages(old, [streaming]);

    const merged = result.pages[0]?.[0];
    expect(merged?.parts).toHaveLength(2);
    const ids = merged?.parts.map((p) => p.id);
    expect(ids).toContain("part_step_start");
    expect(ids).toContain("part_text");
  });

  test("streaming part overrides cache part with same id", () => {
    const cached = makeMessage({
      info: makeInfo({ id: "msg_a" }),
      parts: [makeTextPart({ id: "part_text", text: "stale" })],
    });
    const streaming = makeMessage({
      info: makeInfo({ id: "msg_a" }),
      parts: [makeTextPart({ id: "part_text", text: "fresh" })],
    });
    const old = makeInfiniteData([[cached]]);

    const result = appendStreamingMessages(old, [streaming]);

    const merged = result.pages[0]?.[0];
    expect(merged?.parts).toHaveLength(1);
    expect((merged?.parts[0] as { text: string }).text).toBe("fresh");
  });

  test("keeps cache parts when streaming has empty parts", () => {
    const cached = makeMessage({
      info: makeInfo({ id: "msg_a" }),
      parts: [makeTextPart({ id: "part_text", text: "cached" })],
    });
    const streaming = makeMessage({
      info: makeInfo({ id: "msg_a" }),
      parts: [],
    });
    const old = makeInfiniteData([[cached]]);

    const result = appendStreamingMessages(old, [streaming]);

    const merged = result.pages[0]?.[0];
    expect(merged?.parts).toHaveLength(1);
    expect((merged?.parts[0] as { text: string }).text).toBe("cached");
  });

  test("preserves other pages untouched", () => {
    const page0 = [makeMessage({ info: makeInfo({ id: "msg_a" }) })];
    const page1 = [makeMessage({ info: makeInfo({ id: "msg_older" }) })];
    const old = makeInfiniteData([page0, page1]);

    const streaming = makeMessage({ info: makeInfo({ id: "msg_new" }) });
    const result = appendStreamingMessages(old, [streaming]);

    expect(result.pages).toHaveLength(2);
    expect(result.pages[1]).toEqual(page1);
  });
});
