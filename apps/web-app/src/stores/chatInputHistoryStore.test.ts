import { describe, test, expect, beforeEach } from "vitest";
import { useChatInputHistoryStore, MAX_ENTRIES } from "./chatInputHistoryStore";

describe("chatInputHistoryStore", () => {
  beforeEach(() => {
    useChatInputHistoryStore.setState({ sessions: {} });
  });

  test("addEntry records a trimmed entry under the session", () => {
    useChatInputHistoryStore.getState().addEntry("ses_a", "  hello world  ");
    expect(useChatInputHistoryStore.getState().sessions["ses_a"]).toEqual([
      "hello world",
    ]);
  });

  test("addEntry ignores empty/whitespace", () => {
    useChatInputHistoryStore.getState().addEntry("ses_a", "   ");
    useChatInputHistoryStore.getState().addEntry("ses_a", "");
    expect(
      useChatInputHistoryStore.getState().sessions["ses_a"],
    ).toBeUndefined();
  });

  test("addEntry keeps sessions isolated by key", () => {
    useChatInputHistoryStore.getState().addEntry("ses_a", "a1");
    useChatInputHistoryStore.getState().addEntry("ses_b", "b1");
    useChatInputHistoryStore.getState().addEntry("ses_a", "a2");
    expect(useChatInputHistoryStore.getState().sessions["ses_a"]).toEqual([
      "a1",
      "a2",
    ]);
    expect(useChatInputHistoryStore.getState().sessions["ses_b"]).toEqual([
      "b1",
    ]);
  });

  test("addEntry skips consecutive duplicate", () => {
    useChatInputHistoryStore.getState().addEntry("ses_a", "same");
    useChatInputHistoryStore.getState().addEntry("ses_a", "same");
    expect(useChatInputHistoryStore.getState().sessions["ses_a"]).toEqual([
      "same",
    ]);
  });

  test("addEntry allows non-consecutive duplicate", () => {
    useChatInputHistoryStore.getState().addEntry("ses_a", "ping");
    useChatInputHistoryStore.getState().addEntry("ses_a", "pong");
    useChatInputHistoryStore.getState().addEntry("ses_a", "ping");
    expect(useChatInputHistoryStore.getState().sessions["ses_a"]).toEqual([
      "ping",
      "pong",
      "ping",
    ]);
  });

  test("addEntry caps at MAX_ENTRIES, dropping oldest", () => {
    for (let i = 0; i < MAX_ENTRIES + 3; i++) {
      useChatInputHistoryStore.getState().addEntry("ses_a", `msg-${i}`);
    }
    const entries = useChatInputHistoryStore.getState().sessions["ses_a"];
    expect(entries).toHaveLength(MAX_ENTRIES);
    expect(entries[0]).toBe("msg-3");
    expect(entries[entries.length - 1]).toBe(`msg-${MAX_ENTRIES + 2}`);
  });
});
