import type { OpencodeClient } from "@opencode-ai/sdk/v2/client";
import { describe, expect, it, vi } from "vitest";
import {
  createOpenCodeAdapter,
  encodeOpenCodeCursor,
} from "./opencode.adapter";

describe("OpenCode cursor encoding", () => {
  it("encodes the message id and creation time as base64 JSON", () => {
    expect(encodeOpenCodeCursor("msg_oldest", 1)).toBe(
      btoa(JSON.stringify({ id: "msg_oldest", time: 1 })),
    );
  });
});

describe("OpenCode question interactions", () => {
  it("advertises question and approval capabilities", () => {
    const adapter = createOpenCodeAdapter({ baseUrl: "http://localhost:4096" });

    expect(adapter.capabilities).toMatchObject({
      approvals: true,
      questions: true,
    });
  });

  it("lists pending v2 questions for a directory", async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: "que_test",
            sessionID: "ses_test",
            questions: [
              {
                header: "Scope",
                question: "What should change?",
                options: [{ label: "Feature", description: "Add a feature" }],
              },
            ],
          },
        ],
      },
    });
    const client = {
      v2: { question: { request: { list } } },
    } as unknown as OpencodeClient;
    const adapter = createOpenCodeAdapter({
      baseUrl: "http://localhost:4096",
      client,
    });

    await expect(
      adapter.listQuestions?.({ directory: "/tmp/cloudy" }),
    ).resolves.toEqual([
      expect.objectContaining({ id: "que_test", sessionId: "ses_test" }),
    ]);
    expect(list).toHaveBeenCalledWith({
      location: { directory: "/tmp/cloudy" },
    });
  });

  it("falls back to the legacy question endpoint when a session request is not found", async () => {
    const sessionReply = vi.fn().mockResolvedValue({
      error: { _tag: "QuestionNotFoundError", message: "not found" },
    });
    const legacyReply = vi.fn().mockResolvedValue({ data: undefined });
    const client = {
      v2: { session: { question: { reply: sessionReply } } },
      question: { reply: legacyReply },
    } as unknown as OpencodeClient;
    const adapter = createOpenCodeAdapter({
      baseUrl: "http://localhost:4096",
      client,
    });

    await adapter.respondToInteraction?.({
      kind: "question",
      sessionId: "ses_test",
      interactionId: "que_test",
      directory: "/tmp/cloudy",
      value: [["เพิ่มฟีเจอร์"]],
    });

    expect(sessionReply).toHaveBeenCalledWith({
      sessionID: "ses_test",
      requestID: "que_test",
      questionV2Reply: { answers: [["เพิ่มฟีเจอร์"]] },
    });
    expect(legacyReply).toHaveBeenCalledWith({
      requestID: "que_test",
      answers: [["เพิ่มฟีเจอร์"]],
      directory: "/tmp/cloudy",
    });
  });
});

describe("OpenCode session mapping", () => {
  it("includes each session directory when listing recent sessions", async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: "ses_test",
            directory: "/tmp/project",
            title: "Test session",
            time: { created: 1, updated: 2 },
          },
        ],
      },
    });
    const client = {
      v2: { session: { list } },
    } as unknown as OpencodeClient;
    const adapter = createOpenCodeAdapter({
      baseUrl: "http://localhost:4096",
      client,
    });

    const sessions = await adapter.listSessions?.({ limit: 8 });

    expect(sessions).toEqual([
      expect.objectContaining({
        id: "ses_test",
        directory: "/tmp/project",
      }),
    ]);
    expect(list).toHaveBeenCalledWith({ limit: 8 });
  });
});

describe("OpenCode message pagination", () => {
  it("maps a full result page to a provider-specific next cursor", async () => {
    const messages = vi.fn().mockResolvedValue({
      data: [
        {
          info: {
            id: "msg_oldest",
            sessionID: "ses_test",
            role: "user",
            time: { created: 1, updated: 1 },
          },
          parts: [],
        },
        {
          info: {
            id: "msg_newest",
            sessionID: "ses_test",
            role: "assistant",
            time: { created: 2, updated: 2 },
          },
          parts: [],
        },
      ],
    });
    const client = { session: { messages } } as unknown as OpencodeClient;
    const adapter = createOpenCodeAdapter({
      baseUrl: "http://localhost:4096",
      client,
    });

    const page = await adapter.listMessages?.({
      sessionId: "ses_test",
      limit: 2,
      before: "opaque-cursor-from-previous-page",
    });

    expect(messages).toHaveBeenCalledWith({
      sessionID: "ses_test",
      directory: undefined,
      limit: 2,
      before: "opaque-cursor-from-previous-page",
    });
    expect(page?.nextCursor).toBe(
      btoa(JSON.stringify({ id: "msg_oldest", time: 1 })),
    );
  });
});

describe("OpenCode model variants", () => {
  it("passes the selected model variant to the prompt request", async () => {
    const promptAsync = vi.fn().mockResolvedValue({ data: undefined });
    const client = {
      session: { promptAsync },
    } as unknown as OpencodeClient;
    const adapter = createOpenCodeAdapter({
      baseUrl: "http://localhost:4096",
      client,
    });

    await adapter.sendMessage?.({
      sessionId: "ses_test",
      directory: "/tmp/project",
      content: "Review this change",
      model: {
        providerId: "openai",
        modelId: "gpt-5",
        variantId: "high",
      },
    });

    expect(promptAsync).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "high" }),
    );
  });
});

describe("OpenCode provider info", () => {
  it("uses the configured instance name", async () => {
    const client = {
      config: {
        providers: vi.fn().mockResolvedValue({ data: { providers: [] } }),
      },
      v2: {
        agent: { list: vi.fn().mockResolvedValue({ data: { data: [] } }) },
      },
    } as unknown as OpencodeClient;
    const adapter = createOpenCodeAdapter({
      id: "local-opencode",
      name: "Local OpenCode",
      baseUrl: "http://localhost:4096",
      client,
    });

    await expect(adapter.getInfo()).resolves.toMatchObject({
      id: "local-opencode",
      name: "Local OpenCode",
    });
  });
});
