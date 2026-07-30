import { describe, test, expect, beforeEach, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import {
  handleEvent,
  messageKeys,
  permissionKeys,
  questionKeys,
  sessionKeys,
} from "@/lib/opencode";
import type { GlobalEvent, Session, SessionStatus } from "@opencode-ai/sdk/v2";
import type { AssistantMessage, Part } from "@opencode-ai/sdk/v2";
import type { InfiniteData } from "@tanstack/react-query";
import type { Message } from "@/types";

const DEMO_DIRECTORY = "/demo/project";
const SESSION_ID = "ses_1";
const MESSAGE_ID = "msg_1";

function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    id: SESSION_ID,
    slug: "test-slug",
    projectID: "proj_1",
    directory: DEMO_DIRECTORY,
    title: "Test Session",
    version: "1.0.0",
    time: { created: 0, updated: 0 },
    ...overrides,
  };
}

function createMockAssistantMessage(
  overrides: Partial<AssistantMessage> = {},
): AssistantMessage {
  return {
    id: MESSAGE_ID,
    sessionID: SESSION_ID,
    role: "assistant",
    time: { created: 0 },
    parentID: "parent_1",
    modelID: "gpt-4o",
    providerID: "openai",
    mode: "agent",
    agent: "default",
    path: { cwd: "/tmp", root: "/tmp" },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    ...overrides,
  } as AssistantMessage;
}

function createTextPart(overrides: Partial<Part> = {}): Part {
  return {
    id: "part_1",
    sessionID: SESSION_ID,
    messageID: MESSAGE_ID,
    type: "text",
    text: "Hello",
    ...overrides,
  } as Part;
}

function createMockMessage(overrides: Partial<Message> = {}): Message {
  return {
    info: createMockAssistantMessage(),
    parts: [],
    ...overrides,
  };
}

function buildEvent(
  payload: GlobalEvent["payload"],
  directory = DEMO_DIRECTORY,
): GlobalEvent {
  return { directory, payload } as GlobalEvent;
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe("handleEvent", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    useStreamingMessagesStore.setState({ streamingMessages: new Map() });
  });

  describe("guard clause", () => {
    test("ignores unknown event types", () => {
      const setSpy = vi.spyOn(queryClient, "setQueryData");
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      handleEvent(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildEvent({
          id: "evt_1",
          type: "unknown.event",
          properties: {},
        } as any),
        queryClient,
      );

      expect(setSpy).not.toHaveBeenCalled();
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe("session.updated", () => {
    test("sets session detail in cache", () => {
      const session = createMockSession({ title: "Updated Title" });

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "session.updated",
          properties: { sessionID: SESSION_ID, info: session },
        }),
        queryClient,
      );

      expect(
        queryClient.getQueryData<Session>(sessionKeys.detail(SESSION_ID)),
      ).toEqual(session);
    });

    test("replaces existing session in infinite list", () => {
      const oldSession = createMockSession({ title: "Old Title" });
      const otherSession = createMockSession({
        id: "ses_other",
        title: "Other",
      });
      const updatedSession = createMockSession({ title: "New Title" });
      queryClient.setQueryData<Session[]>(
        sessionKeys.infinite(DEMO_DIRECTORY),
        [oldSession, otherSession],
      );

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "session.updated",
          properties: { sessionID: SESSION_ID, info: updatedSession },
        }),
        queryClient,
      );

      const list = queryClient.getQueryData<Session[]>(
        sessionKeys.infinite(DEMO_DIRECTORY),
      );
      expect(list).toHaveLength(2);
      expect(list!.find((s) => s.id === SESSION_ID)).toEqual(updatedSession);
      expect(list!.find((s) => s.id === "ses_other")).toEqual(otherSession);
    });

    test("does not append session when not in infinite list", () => {
      const otherSession = createMockSession({
        id: "ses_other",
        title: "Other",
      });
      const updatedSession = createMockSession({ title: "New Title" });
      queryClient.setQueryData<Session[]>(
        sessionKeys.infinite(DEMO_DIRECTORY),
        [otherSession],
      );

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "session.updated",
          properties: { sessionID: SESSION_ID, info: updatedSession },
        }),
        queryClient,
      );

      const list = queryClient.getQueryData<Session[]>(
        sessionKeys.infinite(DEMO_DIRECTORY),
      );
      expect(list).toHaveLength(1);
      expect(list![0].id).toBe("ses_other");
    });

    test("handles missing infinite list gracefully (no-op)", () => {
      const updatedSession = createMockSession({ title: "New Title" });

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "session.updated",
          properties: { sessionID: SESSION_ID, info: updatedSession },
        }),
        queryClient,
      );

      const list = queryClient.getQueryData<Session[]>(
        sessionKeys.infinite(DEMO_DIRECTORY),
      );
      expect(list).toEqual([]);
    });
  });

  describe("session.idle", () => {
    test("flushes buffered messages to cache and invalidates session list", () => {
      const message = createMockMessage();
      useStreamingMessagesStore
        .getState()
        .onMessageInfoUpdated(SESSION_ID, message);

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "session.idle",
          properties: { sessionID: SESSION_ID },
        }),
        queryClient,
      );

      const data = queryClient.getQueryData<
        InfiniteData<Message[], string | undefined>
      >(messageKeys.infinite(SESSION_ID));
      expect(data?.pages[0]).toHaveLength(1);
      expect(data?.pages[0][0].info.id).toBe(MESSAGE_ID);

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: sessionKeys.infinite(DEMO_DIRECTORY),
      });
    });

    test("clears session from store after flush", () => {
      const message = createMockMessage();
      useStreamingMessagesStore
        .getState()
        .onMessageInfoUpdated(SESSION_ID, message);

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "session.idle",
          properties: { sessionID: SESSION_ID },
        }),
        queryClient,
      );

      expect(
        useStreamingMessagesStore.getState().streamingMessages.has(SESSION_ID),
      ).toBe(false);
    });

    test("does not set message cache when nothing is buffered", () => {
      const setSpy = vi.spyOn(queryClient, "setQueryData");

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "session.idle",
          properties: { sessionID: SESSION_ID },
        }),
        queryClient,
      );

      expect(
        queryClient.getQueryData(messageKeys.infinite(SESSION_ID)),
      ).toBeUndefined();
      expect(setSpy).not.toHaveBeenCalledWith(
        messageKeys.infinite(SESSION_ID),
        expect.any(Function),
      );
    });

    test("merges buffered messages into existing cache page", () => {
      const existingMessage = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_existing" }),
        parts: [createTextPart({ id: "part_old", text: "Old text" })],
      });
      queryClient.setQueryData<InfiniteData<Message[], string | undefined>>(
        messageKeys.infinite(SESSION_ID),
        { pages: [[existingMessage]], pageParams: [undefined] },
      );

      const streamingMessage = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_new" }),
        parts: [createTextPart({ id: "part_new", text: "New text" })],
      });
      useStreamingMessagesStore
        .getState()
        .onMessageInfoUpdated(SESSION_ID, streamingMessage);

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "session.idle",
          properties: { sessionID: SESSION_ID },
        }),
        queryClient,
      );

      const data = queryClient.getQueryData<
        InfiniteData<Message[], string | undefined>
      >(messageKeys.infinite(SESSION_ID));
      expect(data?.pages[0]).toHaveLength(2);
    });
  });

  describe("session.status", () => {
    test("sets status in the statuses map", () => {
      const status: SessionStatus = { type: "busy" };

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "session.status",
          properties: { sessionID: SESSION_ID, status },
        }),
        queryClient,
      );

      const statuses = queryClient.getQueryData<Record<string, SessionStatus>>(
        sessionKeys.statuses(DEMO_DIRECTORY),
      );
      expect(statuses?.[SESSION_ID]).toEqual(status);
    });

    test("preserves existing statuses when adding new one", () => {
      const existingStatus: SessionStatus = { type: "idle" };
      queryClient.setQueryData<Record<string, SessionStatus>>(
        sessionKeys.statuses(DEMO_DIRECTORY),
        { ses_other: existingStatus },
      );

      const newStatus: SessionStatus = { type: "busy" };
      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "session.status",
          properties: { sessionID: SESSION_ID, status: newStatus },
        }),
        queryClient,
      );

      const statuses = queryClient.getQueryData<Record<string, SessionStatus>>(
        sessionKeys.statuses(DEMO_DIRECTORY),
      );
      expect(statuses?.ses_other).toEqual(existingStatus);
      expect(statuses?.[SESSION_ID]).toEqual(newStatus);
    });
  });

  describe("message.updated", () => {
    test("buffers message info into streaming store", () => {
      const info = createMockAssistantMessage({ cost: 50 });

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "message.updated",
          properties: { sessionID: SESSION_ID, info },
        }),
        queryClient,
      );

      const state = useStreamingMessagesStore.getState();
      const buffered = state.streamingMessages.get(SESSION_ID)?.get(MESSAGE_ID);
      expect(buffered).toBeDefined();
      expect(buffered!.info).toEqual(info);
      expect(buffered!.parts).toEqual([]);
    });

    test("skips buffering when summary has diffs array", () => {
      const info = {
        ...createMockAssistantMessage(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        summary: { diffs: [{ additions: 1, deletions: 0 }] } as any,
      };

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "message.updated",
          properties: { sessionID: SESSION_ID, info },
        }),
        queryClient,
      );

      const state = useStreamingMessagesStore.getState();
      expect(state.streamingMessages.size).toBe(0);
    });
  });

  describe("message.part.updated", () => {
    test("buffers updated part into streaming store", () => {
      const part = createTextPart({ id: "part_updated", text: "Updated text" });

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "message.part.updated",
          properties: {
            sessionID: SESSION_ID,
            part,
            time: Date.now(),
          },
        }),
        queryClient,
      );

      const state = useStreamingMessagesStore.getState();
      const buffered = state.streamingMessages.get(SESSION_ID)?.get(MESSAGE_ID);
      expect(buffered).toBeDefined();
      expect(buffered!.parts).toHaveLength(1);
      expect(buffered!.parts[0]).toEqual(part);
    });
  });

  describe("message.part.delta", () => {
    test("buffers delta into streaming store", () => {
      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "message.part.delta",
          properties: {
            sessionID: SESSION_ID,
            messageID: MESSAGE_ID,
            partID: "part_delta",
            field: "text",
            delta: "Hello world",
          },
        }),
        queryClient,
      );

      const state = useStreamingMessagesStore.getState();
      const buffered = state.streamingMessages.get(SESSION_ID)?.get(MESSAGE_ID);
      expect(buffered).toBeDefined();
      expect(buffered!.parts).toHaveLength(1);
      expect(buffered!.parts[0].id).toBe("part_delta");
    });
  });

  describe("question.asked", () => {
    test("invalidates question list query", () => {
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "question.asked",
          properties: {
            id: "que_1",
            sessionID: SESSION_ID,
            questions: [],
          },
        }),
        queryClient,
      );

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: questionKeys.list(DEMO_DIRECTORY),
      });
    });
  });

  describe("permission.asked", () => {
    test("invalidates permission request query", () => {
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      handleEvent(
        buildEvent({
          id: "evt_1",
          type: "permission.asked",
          properties: {
            id: "per_1",
            sessionID: SESSION_ID,
            permission: "read",
            patterns: [],
            metadata: {},
            always: [],
          },
        }),
        queryClient,
      );

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: permissionKeys.request.root(),
      });
    });
  });
});
