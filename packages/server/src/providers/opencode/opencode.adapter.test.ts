import type { OpencodeClient } from "@opencode-ai/sdk/v2/client";
import { describe, expect, it, vi } from "vitest";
import { createOpenCodeAdapter } from "./opencode.adapter";

describe("OpenCode question interactions", () => {
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
