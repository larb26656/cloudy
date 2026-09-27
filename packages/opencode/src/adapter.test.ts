import type { GlobalEvent, Message, Part } from "@opencode-ai/sdk/v2";
import { describe, expect, test } from "vitest";
import { toChatEvent, toChatMessage, toOpenCodeMessage } from "./adapter";

const message = {
  id: "message-1",
  sessionID: "session-1",
  role: "assistant",
  time: { created: 1_000 },
} as Message;

describe("OpenCode adapter", () => {
  test("normalizes messages and preserves provider payloads as metadata", () => {
    const parts = [
      {
        id: "part-1",
        sessionID: "session-1",
        messageID: "message-1",
        type: "text",
        text: "hello",
      },
    ] as Part[];

    expect(toChatMessage(message, parts)).toMatchObject({
      id: "message-1",
      sessionId: "session-1",
      role: "assistant",
      parts: [{ id: "part-1", type: "text", text: "hello" }],
      metadata: { provider: "opencode", raw: message },
    });
  });

  test("normalizes optional model and agent fields on step finishes", () => {
    const parts = [
      {
        id: "step-finish-1",
        type: "step-finish",
        reason: "stop",
        modelID: "claude-3-opus",
        agent: "build",
        cost: 0,
        tokens: {
          input: 0,
          output: 0,
          reasoning: 0,
          cache: { read: 0, write: 0 },
        },
      },
    ] as unknown as Part[];

    expect(toChatMessage(message, parts).parts[0]).toMatchObject({
      modelID: "claude-3-opus",
      agent: "build",
    });

    const messageWithExecutionInfo = {
      ...message,
      modelID: "claude-3-opus",
      agent: "build",
    } as Message;
    const stepFinishWithoutExecutionInfo = {
      ...parts[0],
      modelID: undefined,
      agent: undefined,
    } as unknown as Part;

    expect(
      toChatMessage(messageWithExecutionInfo, [stepFinishWithoutExecutionInfo])
        .parts[0],
    ).toMatchObject({
      modelID: "claude-3-opus",
      agent: "build",
    });
  });

  test("preserves OpenCode patch metadata", () => {
    const parts = [
      {
        id: "patch-1",
        sessionID: "session-1",
        messageID: "message-1",
        type: "patch",
        hash: "abc123456789",
        files: ["src/index.ts", "src/app.ts"],
      },
    ] as Part[];

    expect(toChatMessage(message, parts).parts[0]).toMatchObject({
      type: "diff",
      path: "src/index.ts",
      hash: "abc123456789",
      files: ["src/index.ts", "src/app.ts"],
    });
  });

  test("normalizes message deltas without exposing SDK field names", () => {
    const event = {
      payload: {
        type: "message.part.delta",
        properties: {
          sessionID: "session-1",
          messageID: "message-1",
          partID: "part-1",
          delta: "hello",
        },
      },
    } as GlobalEvent;

    expect(toChatEvent(event)).toEqual({
      type: "message.delta",
      providerId: "opencode",
      sessionId: "session-1",
      messageId: "message-1",
      partId: "part-1",
      delta: "hello",
    });
  });

  test("derives update session ids from nested OpenCode payloads", () => {
    const event = {
      payload: {
        type: "message.part.updated",
        properties: {
          part: {
            id: "part-1",
            sessionID: "session-1",
            messageID: "message-1",
            type: "text",
            text: "hello",
          },
        },
      },
    } as GlobalEvent;

    expect(toChatEvent(event)).toMatchObject({
      type: "message.part.updated",
      sessionId: "session-1",
      messageId: "message-1",
    });
  });

  test("maps unknown provider parts to the explicit fallback", () => {
    const parts = [
      {
        id: "part-1",
        sessionID: "session-1",
        messageID: "message-1",
        type: "provider-specific",
        value: true,
      },
    ] as unknown as Part[];

    expect(toChatMessage(message, parts).parts[0]).toMatchObject({
      type: "unknown",
      providerType: "provider-specific",
      data: { value: true },
    });
  });

  test("normalizes step lifecycle parts", () => {
    const parts = [
      {
        id: "step-start-1",
        type: "step-start",
        snapshot: "snapshot-1",
      },
      {
        id: "step-finish-1",
        type: "step-finish",
        reason: "stop",
        cost: 0.001,
        tokens: {
          input: 10,
          output: 20,
          reasoning: 3,
          cache: { read: 4, write: 5 },
        },
      },
    ] as unknown as Part[];

    expect(toChatMessage(message, parts).parts).toMatchObject([
      { type: "step-start", snapshot: "snapshot-1" },
      {
        type: "step-finish",
        reason: "stop",
        cost: 0.001,
        tokens: {
          input: 10,
          output: 20,
          reasoning: 3,
          cache: { read: 4, write: 5 },
        },
      },
    ]);
  });

  test("converts normalized streaming updates back to the OpenCode UI model", () => {
    const normalized = toChatMessage(message, [
      {
        id: "part-1",
        sessionID: "session-1",
        messageID: "message-1",
        type: "text",
        text: "hello",
      } as Part,
    ]);
    normalized.parts[0] = {
      ...normalized.parts[0]!,
      type: "text",
      text: "hello world",
    };

    expect(toOpenCodeMessage(normalized)).toMatchObject({
      info: message,
      parts: [
        {
          id: "part-1",
          sessionID: "session-1",
          messageID: "message-1",
          type: "text",
          text: "hello world",
        },
      ],
    });
  });
});
