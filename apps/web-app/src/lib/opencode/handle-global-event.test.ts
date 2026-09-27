import { QueryClient } from "@tanstack/react-query";
import type { ChatEvent } from "@repo/contracts";
import { beforeEach, describe, expect, test } from "vitest";
import { handleEvent } from "./handle-global-event";
import { messageKeys, sessionKeys } from "./query-keys";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";

const SESSION_ID = "session_1";

function queryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function message() {
  return {
    id: "message_1",
    sessionId: SESSION_ID,
    role: "assistant" as const,
    parts: [],
    createdAt: "1970-01-01T00:00:00.000Z",
  };
}

describe("handleEvent", () => {
  beforeEach(() => {
    useStreamingMessagesStore.setState({
      streamingMessages: new Map(),
      pendingDeltas: new Map(),
    });
  });

  test("updates session status for normalized events", () => {
    const client = queryClient();
    const event: ChatEvent = {
      type: "session.status",
      sessionId: SESSION_ID,
      status: "active",
      runStatus: "running",
    };

    handleEvent(event, client, "/project");

    expect(client.getQueryData(sessionKeys.statuses("/project"))).toEqual({
      [SESSION_ID]: { type: "busy" },
    });
  });

  test("applies normalized message events to the streaming store", () => {
    const event: ChatEvent = {
      type: "message.updated",
      sessionId: SESSION_ID,
      message: message(),
    };

    handleEvent(event, queryClient());

    expect(
      useStreamingMessagesStore
        .getState()
        .streamingMessages.get(SESSION_ID)
        ?.get("message_1"),
    ).toEqual(message());
  });

  test("flushes streaming messages when a session completes", () => {
    const client = queryClient();
    useStreamingMessagesStore
      .getState()
      .onMessageInfoUpdated(SESSION_ID, message());

    handleEvent(
      {
        type: "session.status",
        sessionId: SESSION_ID,
        status: "idle",
        runStatus: "completed",
      },
      client,
    );

    expect(client.getQueryData(messageKeys.infinite(SESSION_ID))).toEqual({
      pages: [[message()]],
      pageParams: [undefined],
    });
  });
});
