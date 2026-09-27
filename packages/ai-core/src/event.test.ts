import type { ChatEvent } from "./event";

export const eventFixtures = [
  { type: "session.status", sessionId: "session", status: "active" },
  {
    type: "message.updated",
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
    sessionId: "session",
    messageId: "message",
    part: { id: "part", type: "text", text: "hello" },
  },
  {
    type: "message.delta",
    sessionId: "session",
    messageId: "message",
    partId: "part",
    delta: " world",
  },
  {
    type: "approval.requested",
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
    sessionId: "session",
    request: { id: "question", sessionId: "session", questions: [] },
  },
  { type: "run.failed", sessionId: "session", message: "failed" },
] satisfies ChatEvent[];
