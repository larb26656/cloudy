import { describe, test, expect, beforeEach } from "vitest";
import { useStreamingMessagesStore } from "./streamingMessagesStore";
import type { Message } from "@/types";
import type { Part, AssistantMessage } from "@opencode-ai/sdk/v2";

const createMockAssistantMessage = (overrides: Partial<AssistantMessage> = {}): AssistantMessage =>
  ({
    id: "msg_123",
    sessionID: "session_abc",
    role: "assistant",
    time: { created: Date.now() },
    parentID: "parent_123",
    modelID: "gpt-4o",
    providerID: "openai",
    mode: "agent",
    path: { cwd: "/tmp", root: "/tmp" },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    ...overrides,
  }) as AssistantMessage;

const createTextPart = (overrides: Partial<Part> = {}): Part =>
  ({
    id: "part_1",
    sessionID: "session_abc",
    messageID: "msg_123",
    type: "text",
    text: "Hello, ",
    ...overrides,
  }) as Part;

const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  info: createMockAssistantMessage(),
  parts: [],
  ...overrides,
});

describe("streamingMessagesStore", () => {
  beforeEach(() => {
    useStreamingMessagesStore.setState({ streamingMessages: new Map() });
  });

  describe("initial state", () => {
    test("streamingMessages is empty Map", () => {
      expect(useStreamingMessagesStore.getState().streamingMessages).toBeInstanceOf(Map);
      expect(useStreamingMessagesStore.getState().streamingMessages.size).toBe(0);
    });
  });

  describe("onMessageInfoUpdated", () => {
    test("creates new session and message when session does not exist", () => {
      const message = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1" }),
      });

      useStreamingMessagesStore.getState().onMessageInfoUpdated("session_1", message);

      const state = useStreamingMessagesStore.getState();
      expect(state.streamingMessages.get("session_1")).toBeInstanceOf(Map);
      expect(state.streamingMessages.get("session_1")!.get("msg_1")).toEqual(message);
    });

    test("adds new message to existing session", () => {
      const message1 = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1" }),
      });
      const message2 = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_2", sessionID: "session_1" }),
      });

      useStreamingMessagesStore.getState().onMessageInfoUpdated("session_1", message1);
      useStreamingMessagesStore.getState().onMessageInfoUpdated("session_1", message2);

      const state = useStreamingMessagesStore.getState();
      expect(state.streamingMessages.get("session_1")!.size).toBe(2);
      expect(state.streamingMessages.get("session_1")!.get("msg_1")).toEqual(message1);
      expect(state.streamingMessages.get("session_1")!.get("msg_2")).toEqual(message2);
    });

    test("merges message info without overwriting existing parts", () => {
      const existingMessage = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1" }),
        parts: [createTextPart({ id: "part_existing", text: "existing text" })],
      });
      const updatedMessage = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1", cost: 100 }),
        parts: [],
      });

      useStreamingMessagesStore.setState({
        streamingMessages: new Map([
          ["session_1", new Map([["msg_1", existingMessage]])],
        ]),
      });

      useStreamingMessagesStore.getState().onMessageInfoUpdated("session_1", updatedMessage);

      const state = useStreamingMessagesStore.getState();
      const result = state.streamingMessages.get("session_1")!.get("msg_1")!;
      expect((result.info as AssistantMessage).cost).toBe(100);
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toEqual(existingMessage.parts[0]);
    });
  });

  describe("onMessagePartUpdated", () => {
    test("adds new part to message", () => {
      const message = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1" }),
        parts: [],
      });

      useStreamingMessagesStore.setState({
        streamingMessages: new Map([
          ["session_1", new Map([["msg_1", message]])],
        ]),
      });

      const newPart = createTextPart({ id: "part_new", text: "New part", messageID: "msg_1" });
      useStreamingMessagesStore.getState().onMessagePartUpdated("session_1", newPart);

      const state = useStreamingMessagesStore.getState();
      const result = state.streamingMessages.get("session_1")!.get("msg_1")!;
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toEqual(newPart);
    });

    test("replaces existing part with same id", () => {
      const message = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1" }),
        parts: [createTextPart({ id: "part_1", text: "Original", messageID: "msg_1" })],
      });

      useStreamingMessagesStore.setState({
        streamingMessages: new Map([
          ["session_1", new Map([["msg_1", message]])],
        ]),
      });

      const updatedPart = createTextPart({ id: "part_1", text: "Updated", messageID: "msg_1" });
      useStreamingMessagesStore.getState().onMessagePartUpdated("session_1", updatedPart);

      const state = useStreamingMessagesStore.getState();
      const result = state.streamingMessages.get("session_1")!.get("msg_1")!;
      expect(result.parts).toHaveLength(1);
      expect((result.parts[0] as { text: string }).text).toBe("Updated");
    });

    test("creates skeleton message when session does not exist", () => {
      useStreamingMessagesStore.setState({ streamingMessages: new Map() });

      const newPart = createTextPart({
        id: "part_new",
        text: "New part",
        messageID: "msg_orphan",
        sessionID: "session_orphan",
      });

      useStreamingMessagesStore
        .getState()
        .onMessagePartUpdated("session_orphan", newPart);

      const state = useStreamingMessagesStore.getState();
      const sessionMap = state.streamingMessages.get("session_orphan");
      expect(sessionMap).toBeInstanceOf(Map);
      const created = sessionMap!.get("msg_orphan");
      expect(created).toBeDefined();
      expect(created!.info.id).toBe("msg_orphan");
      expect(created!.info.sessionID).toBe("session_orphan");
      expect(created!.parts).toHaveLength(1);
      expect(created!.parts[0]).toEqual(newPart);
    });

    test("creates skeleton message when message not found in existing session", () => {
      const existingMessage = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1" }),
        parts: [],
      });

      useStreamingMessagesStore.setState({
        streamingMessages: new Map([
          ["session_1", new Map([["msg_1", existingMessage]])],
        ]),
      });

      const newPart = createTextPart({
        id: "part_new",
        text: "New part",
        messageID: "msg_2",
        sessionID: "session_1",
      });

      useStreamingMessagesStore
        .getState()
        .onMessagePartUpdated("session_1", newPart);

      const state = useStreamingMessagesStore.getState();
      const sessionMap = state.streamingMessages.get("session_1")!;
      expect(sessionMap.size).toBe(2);
      const created = sessionMap.get("msg_2");
      expect(created).toBeDefined();
      expect(created!.info.id).toBe("msg_2");
      expect(created!.parts).toHaveLength(1);
      expect(created!.parts[0]).toEqual(newPart);
    });
  });

  describe("onMessagePartDeltaUpdated", () => {
    test("appends delta to existing text part", () => {
      const message = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1" }),
        parts: [createTextPart({ id: "part_1", text: "Hello" })],
      });

      useStreamingMessagesStore.setState({
        streamingMessages: new Map([
          ["session_1", new Map([["msg_1", message]])],
        ]),
      });

      useStreamingMessagesStore.getState().onMessagePartDeltaUpdated("session_1", "msg_1", "part_1", ", world!");

      const state = useStreamingMessagesStore.getState();
      const result = state.streamingMessages.get("session_1")!.get("msg_1")!;
      expect((result.parts[0] as { text: string }).text).toBe("Hello, world!");
    });

    test("creates skeleton message and placeholder text part when nothing exists", () => {
      useStreamingMessagesStore.setState({ streamingMessages: new Map() });

      useStreamingMessagesStore
        .getState()
        .onMessagePartDeltaUpdated("session_orphan", "msg_orphan", "part_orphan", "Hello");

      const state = useStreamingMessagesStore.getState();
      const sessionMap = state.streamingMessages.get("session_orphan");
      expect(sessionMap).toBeInstanceOf(Map);
      const created = sessionMap!.get("msg_orphan");
      expect(created).toBeDefined();
      expect(created!.info.id).toBe("msg_orphan");
      expect(created!.parts).toHaveLength(1);
      expect(created!.parts[0].id).toBe("part_orphan");
      expect(created!.parts[0].type).toBe("text");
      expect((created!.parts[0] as { text: string }).text).toBe("Hello");
    });

    test("appends delta as new text part when message exists but part does not", () => {
      const message = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1" }),
        parts: [],
      });

      useStreamingMessagesStore.setState({
        streamingMessages: new Map([
          ["session_1", new Map([["msg_1", message]])],
        ]),
      });

      useStreamingMessagesStore
        .getState()
        .onMessagePartDeltaUpdated("session_1", "msg_1", "part_new", "Hello");

      const state = useStreamingMessagesStore.getState();
      const result = state.streamingMessages.get("session_1")!.get("msg_1")!;
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0].type).toBe("text");
      expect((result.parts[0] as { text: string }).text).toBe("Hello");
    });

    test("returns state unchanged when part not found", () => {
      const message = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1" }),
        parts: [createTextPart({ id: "part_1", text: "Hello" })],
      });

      useStreamingMessagesStore.setState({
        streamingMessages: new Map([
          ["session_1", new Map([["msg_1", message]])],
        ]),
      });

      useStreamingMessagesStore.getState().onMessagePartDeltaUpdated("session_1", "msg_1", "nonexistent_part", "!");

      const state = useStreamingMessagesStore.getState();
      const result = state.streamingMessages.get("session_1")!.get("msg_1")!;
      expect((result.parts[0] as { text: string }).text).toBe("Hello");
    });

    test("handles non-text part gracefully (no-op)", () => {
      const reasoningPart: Part = {
        id: "reasoning_1",
        sessionID: "session_1",
        messageID: "msg_1",
        type: "reasoning",
        text: "thinking...",
        time: { start: Date.now() },
      } as const;

      const message = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1" }),
        parts: [reasoningPart],
      });

      useStreamingMessagesStore.setState({
        streamingMessages: new Map([
          ["session_1", new Map([["msg_1", message]])],
        ]),
      });

      useStreamingMessagesStore.getState().onMessagePartDeltaUpdated("session_1", "msg_1", "reasoning_1", " more");

      const state = useStreamingMessagesStore.getState();
      const result = state.streamingMessages.get("session_1")!.get("msg_1")!;
      expect(result.parts[0]).toEqual(reasoningPart);
    });
  });

  describe("takeSessionStreaming", () => {
    test("returns messages array and clears session from map", () => {
      const message1 = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_1", sessionID: "session_1" }),
        parts: [],
      });
      const message2 = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_2", sessionID: "session_1" }),
        parts: [],
      });

      useStreamingMessagesStore.setState({
        streamingMessages: new Map([
          [
            "session_1",
            new Map([
              ["msg_1", message1],
              ["msg_2", message2],
            ]),
          ],
        ]),
      });

      const result = useStreamingMessagesStore.getState().takeSessionStreaming("session_1");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(message1);
      expect(result[1]).toEqual(message2);
      expect(useStreamingMessagesStore.getState().streamingMessages.has("session_1")).toBe(false);
    });

    test("returns empty array when session not found", () => {
      useStreamingMessagesStore.setState({
        streamingMessages: new Map(),
      });

      const result = useStreamingMessagesStore.getState().takeSessionStreaming("nonexistent_session");

      expect(result).toEqual([]);
    });

    test("removes session entry even when empty", () => {
      useStreamingMessagesStore.setState({
        streamingMessages: new Map([["session_1", new Map()]]),
      });

      const result = useStreamingMessagesStore.getState().takeSessionStreaming("session_1");

      expect(result).toEqual([]);
      expect(useStreamingMessagesStore.getState().streamingMessages.has("session_1")).toBe(false);
    });

    test("preserves other sessions when taking one session", () => {
      const messageA = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_a", sessionID: "session_A" }),
        parts: [],
      });
      const messageB = createMockMessage({
        info: createMockAssistantMessage({ id: "msg_b", sessionID: "session_B" }),
        parts: [],
      });

      useStreamingMessagesStore.setState({
        streamingMessages: new Map([
          ["session_A", new Map([["msg_a", messageA]])],
          ["session_B", new Map([["msg_b", messageB]])],
        ]),
      });

      useStreamingMessagesStore.getState().takeSessionStreaming("session_A");

      expect(useStreamingMessagesStore.getState().streamingMessages.has("session_A")).toBe(false);
      expect(useStreamingMessagesStore.getState().streamingMessages.has("session_B")).toBe(true);
      expect(useStreamingMessagesStore.getState().streamingMessages.get("session_B")!.get("msg_b")).toEqual(messageB);
    });
  });
});
