import { QueryClient } from "@tanstack/react-query";
import type { ChatEvent } from "@repo/contracts";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { handleEvent } from "./handle-global-event";
import { messageKeys, questionKeys, sessionKeys } from "./query-keys";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import { useSessionErrorStore } from "@/stores/sessionErrorStore";

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
    useSessionErrorStore.setState({ errors: new Map() });
  });

  test("updates session status for normalized events", () => {
    const client = queryClient();
    const event: ChatEvent = {
      type: "session.status",
      sessionId: SESSION_ID,
      status: "active",
      runStatus: "running",
    };

    handleEvent(event, client);

    expect(client.getQueryData(sessionKeys.status(SESSION_ID))).toEqual({
      type: "busy",
    });
  });

  test("updates the canonical cache for an event before any session query exists", () => {
    const client = queryClient();

    handleEvent(
      {
        type: "session.status",
        sessionId: SESSION_ID,
        status: "active",
        runStatus: "running",
      },
      client,
    );

    expect(client.getQueryData(sessionKeys.status(SESSION_ID))).toEqual({
      type: "busy",
    });
  });

  test("invalidates the root session query on every session.status event", () => {
    const client = queryClient();
    const invalidateQueries = vi.spyOn(client, "invalidateQueries");

    handleEvent(
      {
        type: "session.status",
        sessionId: SESSION_ID,
        status: "active",
        runStatus: "running",
      },
      client,
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: sessionKeys.root(),
    });

    invalidateQueries.mockClear();
    handleEvent(
      {
        type: "session.status",
        sessionId: SESSION_ID,
        status: "active",
        runStatus: "queued",
      },
      client,
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: sessionKeys.root(),
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

  test("adds message execution info to streamed step-finish parts", () => {
    const client = queryClient();

    handleEvent(
      {
        type: "message.updated",
        sessionId: SESSION_ID,
        message: {
          ...message(),
          metadata: {
            provider: "opencode",
            raw: { modelID: "model-1", agent: "build" },
          },
        },
      },
      client,
    );
    handleEvent(
      {
        type: "message.part.updated",
        sessionId: SESSION_ID,
        messageId: "message_1",
        part: {
          id: "finish_1",
          type: "step-finish",
          reason: "stop",
          cost: 0,
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
        },
      },
      client,
    );

    expect(
      useStreamingMessagesStore
        .getState()
        .streamingMessages.get(SESSION_ID)
        ?.get("message_1")?.parts[0],
    ).toMatchObject({ modelID: "model-1", agent: "build" });
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

  test("refetches questions for the Cloudy session that requested them", () => {
    const client = queryClient();
    const invalidateQueries = vi.spyOn(client, "invalidateQueries");

    handleEvent(
      {
        type: "question.requested",
        sessionId: SESSION_ID,
        request: { id: "question_1", sessionId: SESSION_ID, questions: [] },
      },
      client,
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: questionKeys.list(SESSION_ID),
    });
  });

  test("keeps the detailed SSE error visible after the session becomes idle", () => {
    const client = queryClient();

    handleEvent(
      {
        type: "run.failed",
        sessionId: SESSION_ID,
        error: {
          name: "UnknownError",
          stack: "stack detail",
          data: {
            message: "ProviderModelNotFoundError: Model not found",
            context: "model lookup",
          },
        },
      },
      client,
    );
    handleEvent(
      {
        type: "session.status",
        sessionId: SESSION_ID,
        status: "idle",
        runStatus: "completed",
      },
      client,
    );

    expect(useSessionErrorStore.getState().errors.get(SESSION_ID)).toEqual({
      name: "UnknownError",
      message: "ProviderModelNotFoundError: Model not found",
      data: {
        stack: "stack detail",
        message: "ProviderModelNotFoundError: Model not found",
        context: "model lookup",
      },
    });
  });
});
