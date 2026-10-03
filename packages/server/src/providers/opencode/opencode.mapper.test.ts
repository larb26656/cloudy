import type { GlobalEvent } from "@opencode-ai/sdk/v2";
import { describe, expect, it } from "vitest";
import {
  mapOpenCodePart,
  toChatEvent,
  toChatSession,
  toModelInfo,
} from "./opencode.mapper";

describe("OpenCode mapper", () => {
  it("preserves reasoning timing for the UI lifecycle", () => {
    expect(
      mapOpenCodePart({
        id: "part-1",
        type: "reasoning",
        text: "Thinking",
        time: { start: 1000, end: 2000 },
      } as never),
    ).toMatchObject({
      type: "reasoning",
      startedAt: 1000,
      completedAt: 2000,
    });
  });

  it("preserves the raw OpenCode session ID", () => {
    expect(
      toChatSession({
        id: "ses_123",
        directory: "/tmp/project",
        time: { created: 1, updated: 2 },
      }),
    ).toMatchObject({ id: "ses_123", directory: "/tmp/project" });
  });

  it("uses the requested directory when OpenCode omits it", () => {
    expect(
      toChatSession(
        { id: "ses_123", time: { created: 1, updated: 2 } },
        "opencode",
        "/tmp/project",
      ),
    ).toMatchObject({ id: "ses_123", directory: "/tmp/project" });
  });

  it("maps the directory from OpenCode session location", () => {
    expect(
      toChatSession({
        id: "ses_123",
        location: { directory: "/tmp/project" },
        time: { created: 1, updated: 2 },
      }),
    ).toMatchObject({ id: "ses_123", directory: "/tmp/project" });
  });

  it("preserves the event directory in normalized events", () => {
    const event = {
      directory: "/tmp/project",
      payload: {
        id: "event-1",
        type: "session.status",
        properties: {
          sessionID: "session-1",
          status: { type: "busy" },
        },
      },
    } as unknown as GlobalEvent;

    expect(toChatEvent(event)).toEqual({
      type: "session.status",
      providerId: "opencode",
      directory: "/tmp/project",
      sessionId: "session-1",
      status: "active",
      runStatus: "running",
    });
  });

  it("normalizes v2 question events", () => {
    const event = {
      directory: "/tmp/project",
      payload: {
        id: "event-1",
        type: "question.v2.asked",
        properties: {
          id: "que_1",
          sessionID: "session-1",
          questions: [
            {
              header: "Scope",
              question: "What should change?",
              options: [{ label: "Feature", description: "Add a feature" }],
            },
          ],
        },
      },
    } as unknown as GlobalEvent;

    expect(toChatEvent(event)).toEqual({
      type: "question.requested",
      providerId: "opencode",
      directory: "/tmp/project",
      sessionId: "session-1",
      request: expect.objectContaining({
        id: "que_1",
        sessionId: "session-1",
      }),
    });
  });

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
      providerId: "opencode",
      directory: "/tmp/project",
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

  it("preserves nested session error details", () => {
    const event = {
      directory: "/tmp/project",
      payload: {
        id: "event-1",
        type: "session.error",
        properties: {
          sessionID: "session-1",
          error: {
            name: "UnknownError",
            data: { message: "ProviderModelNotFoundError: Model not found" },
          },
        },
      },
    } as unknown as GlobalEvent;

    expect(toChatEvent(event)).toEqual({
      type: "run.failed",
      providerId: "opencode",
      directory: "/tmp/project",
      sessionId: "session-1",
      message: "ProviderModelNotFoundError: Model not found",
      error: {
        name: "UnknownError",
        data: { message: "ProviderModelNotFoundError: Model not found" },
      },
    });
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
