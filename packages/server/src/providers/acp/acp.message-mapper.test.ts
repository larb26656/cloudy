import { describe, expect, it } from "vitest";
import {
  createAcpMessageState,
  finishPrompt,
  mapSessionUpdate,
  startPrompt,
} from "./acp.message-mapper";

describe("ACP skill reads", () => {
  it.each(["live", "load"] as const)(
    "maps skill URIs including late inputs on %s",
    (source) => {
      const state = createAcpMessageState("session");
      mapSessionUpdate(
        state,
        {
          sessionUpdate: "tool_call",
          toolCallId: "a",
          name: "read",
          title: "Read",
          status: "pending",
        },
        source,
      );
      const [change] = mapSessionUpdate(
        state,
        {
          sessionUpdate: "tool_call_update",
          toolCallId: "a",
          rawInput: { path: "skill://shadcn" },
          status: "completed",
        },
        source,
      );
      expect(change).toMatchObject({
        part: {
          toolName: "skill",
          input: { name: "shadcn" },
          metadata: {
            acp: { name: "read", rawInput: { path: "skill://shadcn" } },
          },
        },
      });
      const [filePath] = mapSessionUpdate(
        state,
        {
          sessionUpdate: "tool_call",
          toolCallId: "b",
          name: "read",
          title: "Read",
          rawInput: { filePath: "skill://other" },
        },
        source,
      );
      expect(filePath).toMatchObject({
        part: { toolName: "skill", input: { name: "other" } },
      });
      const [ordinary] = mapSessionUpdate(
        state,
        {
          sessionUpdate: "tool_call",
          toolCallId: "c",
          name: "read",
          title: "Read",
          rawInput: { path: "file.txt" },
        },
        source,
      );
      expect(ordinary).toMatchObject({
        part: { toolName: "read", input: { filePath: "file.txt" } },
      });
    },
  );
});

describe("ACP message mapping", () => {
  it("starts successive prompts with separate user and assistant messages", () => {
    const state = createAcpMessageState("s");
    expect(startPrompt(state, "first")).toMatchObject([
      {
        type: "message",
        message: {
          id: "acp:s:0:user",
          role: "user",
          parts: [{ type: "text", text: "first" }],
        },
      },
      {
        type: "message",
        message: { id: "acp:s:0", role: "assistant", parts: [] },
      },
    ]);
    expect(startPrompt(state, "second")).toMatchObject([
      { message: { id: "acp:s:1:user", parts: [{ text: "second" }] } },
      { message: { id: "acp:s:1", role: "assistant" } },
    ]);
    expect(state.messages).toHaveLength(4);
  });

  it("reconstructs loaded turns and joins adjacent chunks by type", () => {
    const state = createAcpMessageState("s");
    const send = (
      sessionUpdate:
        | "user_message_chunk"
        | "agent_message_chunk"
        | "agent_thought_chunk",
      text: string,
    ) =>
      mapSessionUpdate(
        state,
        { sessionUpdate, content: { type: "text", text } },
        "load",
      );
    send("user_message_chunk", "hel");
    send("user_message_chunk", "lo");
    send("agent_thought_chunk", "think");
    send("agent_thought_chunk", "ing");
    send("agent_message_chunk", "answer");
    send("user_message_chunk", "next");
    send("agent_message_chunk", "done");
    expect(state.messages).toMatchObject([
      {
        id: "acp:s:0:user",
        role: "user",
        parts: [{ type: "text", text: "hello" }],
      },
      {
        id: "acp:s:0",
        role: "assistant",
        parts: [
          { type: "reasoning", text: "thinking" },
          { type: "text", text: "answer" },
        ],
      },
      {
        id: "acp:s:1:user",
        role: "user",
        parts: [{ type: "text", text: "next" }],
      },
      {
        id: "acp:s:1",
        role: "assistant",
        parts: [{ type: "text", text: "done" }],
      },
    ]);
  });

  it("ignores live user echoes and preserves non-text content between text chunks", () => {
    const state = createAcpMessageState("s");
    startPrompt(state, "question");
    expect(
      mapSessionUpdate(
        state,
        {
          sessionUpdate: "user_message_chunk",
          content: { type: "text", text: "echo" },
        },
        "live",
      ),
    ).toEqual([]);
    mapSessionUpdate(
      state,
      {
        sessionUpdate: "agent_message_chunk",
        content: { type: "text", text: "before" },
      },
      "live",
    );
    const image = {
      sessionUpdate: "agent_message_chunk",
      content: { type: "image", data: "YWJj", mimeType: "image/png" },
    } as const;
    mapSessionUpdate(state, image, "live");
    mapSessionUpdate(
      state,
      {
        sessionUpdate: "agent_message_chunk",
        content: { type: "text", text: "after" },
      },
      "live",
    );
    expect(state.messages[1]?.parts).toMatchObject([
      { type: "text", text: "before" },
      { type: "unknown", providerType: "image", data: image },
      { type: "text", text: "after" },
    ]);
    expect(state.messages[0]?.parts).toMatchObject([{ text: "question" }]);
  });

  it("updates a tool in its original message after a later turn starts", () => {
    const state = createAcpMessageState("s");
    startPrompt(state, "one");
    mapSessionUpdate(
      state,
      {
        sessionUpdate: "tool_call",
        toolCallId: "t",
        title: "Running",
        name: "bash",
        rawInput: { command: "pwd" },
        status: "in_progress",
      },
      "live",
    );
    startPrompt(state, "two");
    const result = mapSessionUpdate(
      state,
      {
        sessionUpdate: "tool_call_update",
        toolCallId: "t",
        status: "completed",
        content: [{ type: "content", content: { type: "text", text: "/tmp" } }],
      },
      "live",
    );
    expect(result).toMatchObject([
      {
        messageId: "acp:s:0",
        part: {
          callId: "t",
          toolName: "bash",
          status: "completed",
          input: { command: "pwd" },
          output: "/tmp",
          displayContent: ["/tmp"],
          title: "Running",
        },
      },
    ]);
    expect(state.messages[1]?.parts).toHaveLength(1);
    expect(state.messages[3]?.parts).toHaveLength(0);
  });

  it("maps tool diffs, locations, terminal output and failure details", () => {
    const state = createAcpMessageState("s");
    const [change] = mapSessionUpdate(
      state,
      {
        sessionUpdate: "tool_call",
        toolCallId: "edit",
        title: "Edit",
        name: "edit",
        status: "failed",
        rawInput: { path: "a.ts", oldString: "old", newString: "new" },
        rawOutput: { error: "denied" },
        locations: [{ path: "a.ts", line: 4 }, { path: "b.ts" }],
        content: [
          { type: "diff", path: "a.ts", oldText: "old", newText: "new" },
          { type: "terminal", terminalId: "term" },
          { type: "content", content: { type: "text", text: "failed" } },
        ],
      },
      "live",
    ).slice(-1);
    expect(change).toMatchObject({
      part: {
        toolName: "edit",
        status: "failed",
        input: { filePath: "a.ts" },
        output: { error: "denied" },
        error: "denied",
        displayContent: ["failed"],
        terminalIds: ["term"],
        changes: [{ path: "a.ts", before: "old", after: "new" }],
        locations: [{ path: "a.ts", line: 4 }, { path: "b.ts" }],
      },
    });
    if (change?.type !== "part" || change.part.type !== "tool")
      throw new Error("Expected tool");
    expect(change.part.input).toEqual({ filePath: "a.ts" });
  });

  it.each([
    ["skill", { name: "review", extra: true }, "skill", { name: "review" }],
    ["skill", { name: "" }, undefined, { name: "" }],
    [
      "bash",
      { command: "pwd", timeout: 10, workdir: "/tmp", extra: 1 },
      "bash",
      { command: "pwd", timeout: 10, workdir: "/tmp" },
    ],
    [
      "bash",
      { command: "pwd", timeout: "bad" },
      undefined,
      { command: "pwd", timeout: "bad" },
    ],
    [
      "write",
      { path: "a", content: "x" },
      "write",
      { filePath: "a", content: "x" },
    ],
    [
      "apply_patch",
      { path: "a", filePath: "b" },
      "apply_patch",
      { path: "a", filePath: "b" },
    ],
  ])("normalizes %s inputs", (name, rawInput, toolName, input) => {
    const state = createAcpMessageState("s");
    const changes = mapSessionUpdate(
      state,
      {
        sessionUpdate: "tool_call",
        toolCallId: "t",
        title: "Tool",
        name,
        rawInput,
      },
      "live",
    );
    expect(changes.at(-1)).toMatchObject({ part: { toolName, input } });
  });

  it("replaces plans and breaks text aggregation around them", () => {
    const state = createAcpMessageState("s");
    startPrompt(state, "go");
    mapSessionUpdate(
      state,
      {
        sessionUpdate: "agent_message_chunk",
        content: { type: "text", text: "before" },
      },
      "live",
    );
    mapSessionUpdate(
      state,
      {
        sessionUpdate: "plan",
        entries: [{ content: "work", priority: "high", status: "pending" }],
      },
      "live",
    );
    mapSessionUpdate(state, { sessionUpdate: "plan", entries: [] }, "live");
    mapSessionUpdate(
      state,
      {
        sessionUpdate: "agent_message_chunk",
        content: { type: "text", text: "after" },
      },
      "live",
    );
    expect(state.messages[1]?.parts).toMatchObject([
      { type: "text", text: "before" },
      {
        type: "tool",
        toolName: "todowrite",
        input: { content: "No todos", todos: [] },
      },
      { type: "text", text: "after" },
    ]);
  });

  it("preserves tool details on partial updates and clears explicitly empty content", () => {
    const state = createAcpMessageState("s");
    mapSessionUpdate(
      state,
      {
        sessionUpdate: "tool_call",
        toolCallId: "t",
        title: "Read",
        name: "read",
        status: "in_progress",
        rawInput: { path: "a" },
        content: [
          { type: "content", content: { type: "text", text: "first" } },
        ],
      },
      "live",
    );
    const [partial] = mapSessionUpdate(
      state,
      {
        sessionUpdate: "tool_call_update",
        toolCallId: "t",
        status: "completed",
      },
      "live",
    );
    expect(partial).toMatchObject({
      part: {
        title: "Read",
        status: "completed",
        output: "first",
        input: { filePath: "a" },
      },
    });
    const [cleared] = mapSessionUpdate(
      state,
      { sessionUpdate: "tool_call_update", toolCallId: "t", content: [] },
      "live",
    );
    expect(cleared).toMatchObject({
      part: {
        output: undefined,
        displayContent: [],
        terminalIds: [],
        changes: [],
      },
    });
  });

  it("keeps multiple content blocks and unwraps redundant structured output", () => {
    const state = createAcpMessageState("s");
    const changes = mapSessionUpdate(
      state,
      {
        sessionUpdate: "tool_call",
        toolCallId: "t",
        title: "Tool",
        rawOutput: { content: [{ type: "text", text: "hello" }] },
        content: [
          { type: "content", content: { type: "text", text: "hello" } },
        ],
      },
      "live",
    );
    expect(changes.at(-1)).toMatchObject({ part: { output: "hello" } });
    const [updated] = mapSessionUpdate(
      state,
      {
        sessionUpdate: "tool_call_update",
        toolCallId: "t",
        rawOutput: null,
        content: [
          { type: "content", content: { type: "text", text: "one" } },
          { type: "content", content: { type: "text", text: "two" } },
        ],
      },
      "live",
    );
    expect(updated).toMatchObject({ part: { output: ["one", "two"] } });
  });

  it("finishes a prompt with usage and replaces the finish part on subsequent responses", () => {
    const state = createAcpMessageState("s");
    expect(finishPrompt(state, { stopReason: "end_turn" })).toEqual([]);
    startPrompt(state, "go");
    const response = {
      stopReason: "end_turn" as const,
      usage: {
        inputTokens: 12,
        outputTokens: 3,
        thoughtTokens: 2,
        cachedReadTokens: 4,
        cachedWriteTokens: 1,
      },
    };
    expect(finishPrompt(state, response, "model")).toMatchObject([
      {
        messageId: "acp:s:0",
        part: {
          type: "step-finish",
          reason: "stop",
          modelID: "model",
          cost: 0,
          tokens: {
            input: 12,
            output: 3,
            reasoning: 2,
            cache: { read: 4, write: 1 },
          },
          metadata: {
            provider: "acp",
            stopReason: "end_turn",
            usage: response.usage,
          },
        },
      },
    ]);
    expect(finishPrompt(state, { stopReason: "cancelled" })).toMatchObject([
      {
        part: {
          reason: "cancelled",
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
        },
      },
    ]);
    expect(state.messages[1]?.parts).toHaveLength(1);
    expect(state.messages[1]?.updatedAt).toBeDefined();
  });
});
