import { randomUUID } from "node:crypto";
import type {
  ChatEvent,
  ChatMessage,
  ChatSession,
  ProviderAdapter,
  ProviderEventsInput,
  ProviderInfo,
  ProviderMessageRequest,
  ProviderSessionInput,
} from "@repo/ai-core";

interface EchoSession {
  session: ChatSession;
  messages: ChatMessage[];
}

export function createEchoAdapter(): ProviderAdapter {
  const sessions = new Map<string, EchoSession>();
  const subscribers = new Set<(event: ChatEvent) => void>();
  const capabilities = { streaming: true };

  const get = (sessionId: string) => {
    const value = sessions.get(sessionId);
    if (!value) throw new Error(`Echo session not found: ${sessionId}`);
    return value;
  };

  const publish = (event: ChatEvent) => {
    for (const subscriber of subscribers) subscriber(event);
  };

  const adapter = {
    id: "echo",
    capabilities,
    async getInfo(): Promise<ProviderInfo> {
      return { id: "echo", providerType: "echo", name: "Echo", capabilities };
    },
    async createSession(input: ProviderSessionInput): Promise<ChatSession> {
      const now = new Date().toISOString();
      const session: ChatSession = {
        id: randomUUID(),
        title: input.title ?? "Echo chat",
        status: "idle",
        runStatus: "idle",
        providerId: "echo",
        createdAt: now,
        updatedAt: now,
        directory: input.directory,
        parentId: input.parentId,
      };
      sessions.set(session.id, { session, messages: [] });
      return session;
    },
    async listSessions(input: { directory?: string; limit?: number }) {
      const values = [...sessions.values()]
        .map(({ session }) => session)
        .filter(
          (session) =>
            !input.directory || session.directory === input.directory,
        );
      return input.limit ? values.slice(0, input.limit) : values;
    },
    async getSession(input: { sessionId: string }) {
      return get(input.sessionId).session;
    },
    async updateSession(input: ProviderSessionInput) {
      const value = get(input.sessionId ?? "");
      value.session = {
        ...value.session,
        title: input.title ?? value.session.title,
        updatedAt: new Date().toISOString(),
      };
      return value.session;
    },
    async deleteSession(input: { sessionId: string }) {
      sessions.delete(input.sessionId);
    },
    async getSessionChildren(input: { sessionId: string }) {
      return [...sessions.values()]
        .map(({ session }) => session)
        .filter((session) => session.parentId === input.sessionId);
    },
    async getSessionStatuses() {
      return Object.fromEntries(
        [...sessions.keys()].map((id) => [id, "idle" as const]),
      );
    },
    async listMessages(input: {
      sessionId: string;
      limit?: number;
      before?: string;
    }) {
      const messages = get(input.sessionId).messages;
      const beforeIndex = input.before
        ? messages.findIndex((message) => message.id === input.before)
        : messages.length;
      const end = beforeIndex < 0 ? messages.length : beforeIndex;
      const start = Math.max(0, end - (input.limit ?? messages.length));
      return {
        messages: messages.slice(start, end),
        ...(start > 0 ? { nextCursor: messages[start]?.id } : {}),
      };
    },
    async sendMessage(request: ProviderMessageRequest) {
      const value = get(request.sessionId);
      const now = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: randomUUID(),
        sessionId: request.sessionId,
        role: "user",
        parts: [{ id: randomUUID(), type: "text", text: request.content }],
        createdAt: now,
      };
      const assistantMessage: ChatMessage = {
        id: randomUUID(),
        sessionId: request.sessionId,
        role: "assistant",
        parts: [{ id: randomUUID(), type: "text", text: "" }],
        createdAt: new Date().toISOString(),
      };
      value.messages.push(userMessage);
      value.session = {
        ...value.session,
        updatedAt: assistantMessage.createdAt,
      };
      publish({
        type: "message.updated",
        providerId: "echo",
        sessionId: request.sessionId,
        message: userMessage,
      });
      publish({
        type: "message.updated",
        providerId: "echo",
        sessionId: request.sessionId,
        message: assistantMessage,
      });
      void streamEcho(request, value, assistantMessage);
      return { interactionId: request.sessionId, value: null };
    },
    subscribeEvents(input: ProviderEventsInput = {}): AsyncIterable<ChatEvent> {
      return {
        [Symbol.asyncIterator]() {
          const queue: ChatEvent[] = [];
          let wake: (() => void) | undefined;
          let done = false;
          const onEvent = (event: ChatEvent) => {
            if (
              input.sessionId &&
              (!("sessionId" in event) || event.sessionId !== input.sessionId)
            )
              return;
            queue.push(event);
            wake?.();
          };
          const onAbort = () => {
            done = true;
            wake?.();
          };
          subscribers.add(onEvent);
          input.signal?.addEventListener("abort", onAbort, { once: true });
          if (input.signal?.aborted) onAbort();
          return {
            async next(): Promise<IteratorResult<ChatEvent>> {
              while (!queue.length && !done)
                await new Promise<void>((resolve) => {
                  wake = resolve;
                });
              const value = queue.shift();
              return value
                ? { done: false, value }
                : { done: true, value: undefined };
            },
            async return(): Promise<IteratorResult<ChatEvent>> {
              done = true;
              subscribers.delete(onEvent);
              input.signal?.removeEventListener("abort", onAbort);
              return { done: true, value: undefined };
            },
          };
        },
      };
    },
  } satisfies ProviderAdapter;

  return adapter;

  async function streamEcho(
    request: ProviderMessageRequest,
    value: EchoSession,
    assistantMessage: ChatMessage,
  ) {
    const part = assistantMessage.parts[0];
    if (!part || part.type !== "text") return;
    const characters = Array.from(request.content);
    let text = "";
    for (let index = 0; index < characters.length; index += 4) {
      const delta = characters.slice(index, index + 4).join("");
      await new Promise((resolve) => setTimeout(resolve, 50));
      text += delta;
      publish({
        type: "message.delta",
        providerId: "echo",
        sessionId: request.sessionId,
        messageId: assistantMessage.id,
        partId: part.id,
        delta,
      });
    }
    assistantMessage.parts = [{ ...part, text }];
    value.messages.push(assistantMessage);
    publish({
      type: "message.part.updated",
      providerId: "echo",
      sessionId: request.sessionId,
      messageId: assistantMessage.id,
      part: assistantMessage.parts[0]!,
    });
  }
}
