import { describe, it, expect } from "vitest";
import { pickFresher } from "./freshness";
import type { Message } from "@/types";
import type { Part } from "@opencode-ai/sdk/v2";

const SID = "ses_test";
const MID = "msg_test";

function textPart(id: string, text: string): Part {
  return {
    type: "text",
    id,
    sessionID: SID,
    messageID: MID,
    text,
  } as Part;
}

function reasoningPart(id: string, text: string): Part {
  return {
    type: "reasoning",
    id,
    sessionID: SID,
    messageID: MID,
    text,
    time: { start: 1 },
  } as Part;
}

function stepStartPart(id: string): Part {
  return {
    type: "step-start",
    id,
    sessionID: SID,
    messageID: MID,
  } as Part;
}

function assistant(opts: {
  completed?: number;
  parts?: Part[];
  id?: string;
}): Message {
  return {
    info: {
      id: opts.id ?? MID,
      sessionID: SID,
      role: "assistant",
      time: { created: 100, completed: opts.completed },
      parentID: "parent",
      modelID: "m",
      providerID: "p",
      mode: "build",
      agent: "build",
      path: { cwd: "/", root: "/" },
      cost: 0,
      tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    },
    parts: opts.parts ?? [],
  };
}

function user(parts: Part[] = []): Message {
  return {
    info: {
      id: MID,
      sessionID: SID,
      role: "user",
      time: { created: 100 },
      agent: "build",
      model: { providerID: "p", modelID: "m" },
    },
    parts,
  };
}

describe("pickFresher", () => {
  describe("presence", () => {
    it("returns 'neither' when both are undefined", () => {
      expect(pickFresher(undefined, undefined)).toBe("neither");
    });

    it("returns 'remote' when only remote is present", () => {
      expect(pickFresher(assistant({}), undefined)).toBe("remote");
    });

    it("returns 'streaming' when only streaming is present", () => {
      expect(pickFresher(undefined, assistant({}))).toBe("streaming");
    });
  });

  describe("finalized signal (time.completed)", () => {
    it("prefers remote when remote is finalized and streaming is not", () => {
      expect(
        pickFresher(
          assistant({ completed: 200, parts: [textPart("a", "hi")] }),
          assistant({ parts: [textPart("a", "hi")] }),
        ),
      ).toBe("remote");
    });

    it("prefers streaming when streaming is finalized and remote is not", () => {
      expect(
        pickFresher(
          assistant({ parts: [textPart("a", "hi")] }),
          assistant({ completed: 200, parts: [textPart("a", "hi")] }),
        ),
      ).toBe("streaming");
    });

    it("prefers remote when both are finalized (durable source wins ties)", () => {
      // both finalized → remote wins regardless of content (e.g. retry/compaction
      // may legitimately leave streaming with a different part set).
      expect(
        pickFresher(
          assistant({ completed: 200, parts: [textPart("a", "short")] }),
          assistant({
            completed: 200,
            parts: [textPart("a", "short"), textPart("b", "more text")],
          }),
        ),
      ).toBe("remote");
    });
  });

  describe("content comparison (no completed on either side)", () => {
    it("prefers streaming when it has more parts", () => {
      expect(
        pickFresher(
          assistant({ parts: [textPart("a", "hello")] }),
          assistant({
            parts: [textPart("a", "hello"), stepStartPart("b")],
          }),
        ),
      ).toBe("streaming");
    });

    it("prefers streaming when part count ties but text is longer", () => {
      // simulates a mid-stream refetch: same single text part, but streaming
      // has accumulated more delta characters than the server snapshot.
      expect(
        pickFresher(
          assistant({ parts: [textPart("a", "hello")] }),
          assistant({ parts: [textPart("a", "hello world")] }),
        ),
      ).toBe("streaming");
    });

    it("prefers remote when part count ties and remote text is longer", () => {
      expect(
        pickFresher(
          assistant({ parts: [textPart("a", "hello world")] }),
          assistant({ parts: [textPart("a", "hello")] }),
        ),
      ).toBe("remote");
    });

    it("counts reasoning text alongside text", () => {
      expect(
        pickFresher(
          assistant({ parts: [textPart("a", "x")] }),
          assistant({
            parts: [textPart("a", "x"), reasoningPart("r", "thinking")],
          }),
        ),
      ).toBe("streaming");
    });

    it("tie-breaks to remote when content is identical", () => {
      expect(
        pickFresher(
          assistant({ parts: [textPart("a", "same")] }),
          assistant({ parts: [textPart("a", "same")] }),
        ),
      ).toBe("remote");
    });

    it("tie-breaks to remote when neither has any content", () => {
      expect(pickFresher(assistant({}), assistant({}))).toBe("remote");
    });
  });

  describe("user messages", () => {
    it("always prefers remote when remote is present (user messages are immutable)", () => {
      // user messages are finalized by definition; even if a streaming echo
      // somehow differs, remote is authoritative.
      expect(
        pickFresher(
          user([textPart("a", "hi")]),
          user([textPart("a", "hi there")]),
        ),
      ).toBe("remote");
    });

    it("returns streaming when only streaming has the user message", () => {
      expect(pickFresher(undefined, user())).toBe("streaming");
    });
  });
});
