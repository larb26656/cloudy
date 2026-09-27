import type { GlobalEvent } from "@opencode-ai/sdk/v2";
import { describe, expect, it } from "vitest";
import { toChatEvent, toModelInfo } from "./opencode.mapper";

describe("OpenCode mapper", () => {
  it("normalizes unknown parts without exposing an SDK type", () => {
    const event = {
      directory: "/tmp/project",
      payload: {
        id: "event-1",
        type: "message.part.updated",
        properties: {
          sessionID: "session-1",
          part: {
            id: "part-1",
            messageID: "message-1",
            sessionID: "session-1",
            type: "future-part",
            value: 42,
          },
        },
      },
    } as unknown as GlobalEvent;

    expect(toChatEvent(event)).toEqual({
      type: "message.part.updated",
      sessionId: "session-1",
      messageId: "message-1",
      part: {
        id: "part-1",
        type: "unknown",
        providerType: "future-part",
        data: expect.objectContaining({ value: 42 }),
        metadata: expect.objectContaining({ provider: "opencode" }),
      },
    });
  });

  it("ignores malformed event payloads", () => {
    const event = {
      directory: "/tmp/project",
      payload: {
        id: "event-1",
        type: "message.part.updated",
        properties: { part: "not-a-part" },
      },
    } as unknown as GlobalEvent;

    expect(toChatEvent(event)).toBeUndefined();
  });

  it("normalizes model references", () => {
    const model = {
      id: "model-1",
      providerID: "provider-1",
      name: "Model 1",
      capabilities: {
        temperature: true,
        reasoning: true,
        attachment: false,
        toolcall: true,
        input: {
          text: true,
          audio: false,
          image: true,
          video: false,
          pdf: false,
        },
        output: {
          text: true,
          audio: false,
          image: false,
          video: false,
          pdf: false,
        },
        interleaved: false,
      },
      limit: { context: 1000, output: 100 },
      status: "active",
    } as never;

    expect(toModelInfo("opencode", model)).toMatchObject({
      providerId: "opencode",
      modelId: "model-1",
      capabilities: { reasoning: true, tools: true, vision: true },
    });
  });
});
