import type { ChatEvent } from "./event";

export const eventFixtures = [
  {
    type: "session.status",
    providerId: "opencode",
    sessionId: "session",
    status: "active",
  },
  {
    type: "message.updated",
    providerId: "opencode",
    sessionId: "session",
    message: {
      id: "message",
      sessionId: "session",
      role: "assistant",
      parts: [],
      createdAt: "2026-09-27T00:00:00.000Z",
    },
  },
  {
    type: "message.part.updated",
    providerId: "opencode",
    sessionId: "session",
    messageId: "message",
    part: { id: "part", type: "text", text: "hello" },
  },
  {
    type: "message.delta",
    providerId: "opencode",
    sessionId: "session",
    messageId: "message",
    partId: "part",
    delta: " world",
  },
  {
    type: "approval.requested",
    providerId: "opencode",
    sessionId: "session",
    request: {
      id: "approval",
      sessionId: "session",
      permission: "file.read",
      patterns: [],
    },
  },
  {
    type: "question.requested",
    providerId: "opencode",
    sessionId: "session",
    request: { id: "question", sessionId: "session", questions: [] },
  },
  {
    type: "run.failed",
    providerId: "opencode",
    sessionId: "session",
    message: "failed",
  },
] satisfies ChatEvent[];
