import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@repo/ai-core";
import { createTestDb } from "../../db/test-utils";
import { createCloudyMessagesRepository } from "./sessions.cloudy-messages.repository";

describe("CloudyMessagesRepository", () => {
  it("persists and returns message errors", () => {
    const testDb = createTestDb();
    const repository = createCloudyMessagesRepository(testDb.db);
    const message: ChatMessage = {
      id: "message-1",
      sessionId: "session-1",
      role: "assistant",
      parts: [{ id: "part-1", type: "text", text: "" }],
      createdAt: new Date().toISOString(),
      error: {
        name: "LLMError",
        message: "Provider request failed",
        data: { message: "Provider request failed" },
      },
    };

    repository.append(message, message.sessionId);

    expect(repository.list(message.sessionId)[0]?.error).toEqual(message.error);
    testDb.close();
  });
});
